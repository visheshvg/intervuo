import uuid
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.user import User
from app.models.session import InterviewSession
from app.services.resume_parser import parse_resume
from app.services.question_generator import generate_questions
from app.schemas.interview import UploadResumeResponse
from app.config import settings

router = APIRouter()


@router.post("/upload", response_model=UploadResumeResponse)
async def upload_resume(
    file: UploadFile = File(...),
    field: str = Form(default="General"),
    level: str = Form(default="intermediate"),
    current_user: User = Depends(get_current_user),
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
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"AI question generation failed: {exc}")

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

    return UploadResumeResponse(
        session_id=session.id,
        questions=questions,
        skills=parsed.skills,
        parsed_name=parsed.name,
    )
