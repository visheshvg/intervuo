import logging
import uuid
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.rate_limit import rate_limit
from app.models.user import User
from app.models.session import InterviewSession
from app.services.resume_parser import parse_resume
from app.services.resume_insights import build_insights
from app.services.question_generator import generate_questions
from app.schemas.interview import UploadResumeResponse
from app.config import settings

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/upload", response_model=UploadResumeResponse)
async def upload_resume(
    file: UploadFile = File(...),
    field: str = Form(default="General"),
    level: str = Form(default="intermediate"),
    current_user: User = Depends(rate_limit(max_requests=10, window_seconds=60)),
    db: AsyncSession = Depends(get_db),
):
    if not (file.filename or "").lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are accepted.")

    pdf_bytes = await file.read()
    max_bytes = settings.max_pdf_size_mb * 1024 * 1024
    if len(pdf_bytes) > max_bytes:
        raise HTTPException(
            status_code=413,
            detail=f"File too large. Maximum size is {settings.max_pdf_size_mb} MB.",
        )

    try:
        parsed = parse_resume(pdf_bytes)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))

    try:
        questions = await generate_questions(
            resume_text=parsed.raw_text,
            field=field,
            level=level,
            num_questions=settings.num_questions,
        )
    except Exception:
        logger.exception("Gemini question generation failed")
        raise HTTPException(status_code=502, detail="AI question generation failed. Please try again.")

    session = InterviewSession(
        id=str(uuid.uuid4()),
        user_id=current_user.id,
        field=field,
        experience_level=level,
        resume_text=parsed.raw_text,
        questions=questions,
    )
    db.add(session)
    await db.flush()

    insights = build_insights(parsed.raw_text, parsed.skills)

    return UploadResumeResponse(
        session_id=session.id,
        questions=questions,
        skills=parsed.skills,
        parsed_name=parsed.name,
        phone=parsed.phone,
        page_count=parsed.page_count,
        resume_score=insights.resume_score,
        resume_tips=insights.resume_tips,
        predicted_field=insights.predicted_field,
        recommended_skills=insights.recommended_skills,
        courses=insights.courses,
    )
