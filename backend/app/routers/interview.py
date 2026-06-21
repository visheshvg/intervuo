import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.middleware.rate_limit import rate_limit
from app.models.user import User
from app.models.session import InterviewSession
from app.models.answer import InterviewAnswer
from app.services.answer_analyzer import analyze_answer
from app.services.delivery import compute_delivery
from app.schemas.interview import SubmitAnswerRequest, SubmitAnswerResponse

logger = logging.getLogger(__name__)
router = APIRouter()


def _combined_score(content: float, communication: float, eye_contact_pct: float | None) -> float:
    """Transparent weighted blend of the answer's dimensions (each 0-10).

    Content dominates. Presence (eye contact) only counts when the camera was on;
    otherwise its weight folds back into communication.
    """
    if eye_contact_pct is not None:
        # Calibrated: ~60% eye contact during an answer already earns full marks,
        # since nobody (realistically) stares at the camera the entire time.
        presence = max(0.0, min(10.0, eye_contact_pct / 6.0))
        return round(content * 0.7 + communication * 0.2 + presence * 0.1, 2)
    return round(content * 0.7 + communication * 0.3, 2)


@router.post("/submit-answer/{session_id}/{question_index}", response_model=SubmitAnswerResponse)
async def submit_answer(
    session_id: str,
    question_index: int,
    body: SubmitAnswerRequest,
    current_user: User = Depends(rate_limit(max_requests=20, window_seconds=60)),
    db: AsyncSession = Depends(get_db),
):
    """Score a transcribed answer (Gemini), store it, and return the feedback."""
    result = await db.execute(
        select(InterviewSession).where(
            InterviewSession.id == session_id,
            InterviewSession.user_id == current_user.id,
        )
    )
    sess = result.scalar_one_or_none()
    if not sess:
        raise HTTPException(status_code=404, detail="Session not found.")

    if not (0 <= question_index < len(sess.questions)):
        raise HTTPException(
            status_code=400,
            detail=f"question_index {question_index} is out of range for this session.",
        )

    question_text = sess.questions[question_index]

    try:
        analysis = await analyze_answer(
            question=question_text,
            answer=body.answer_text,
            field=sess.field,
            level=sess.experience_level,
        )
    except Exception:
        logger.exception("Gemini answer analysis failed")
        raise HTTPException(status_code=502, detail="Answer analysis failed. Please try again.")

    delivery = compute_delivery(body.answer_text, body.duration_seconds)
    final_score = _combined_score(
        analysis.content_score, analysis.sentiment_score, body.eye_contact_pct
    )

    existing = await db.execute(
        select(InterviewAnswer).where(
            InterviewAnswer.session_id == session_id,
            InterviewAnswer.question_index == question_index,
        )
    )
    answer_row = existing.scalar_one_or_none()
    if answer_row:
        answer_row.answer_text = body.answer_text
        answer_row.content_score = analysis.content_score
        answer_row.sentiment_score = analysis.sentiment_score
        answer_row.final_score = final_score
        answer_row.strengths = analysis.strengths
        answer_row.improvements = analysis.improvements
        answer_row.model_answer = analysis.model_answer
        answer_row.word_count = delivery["word_count"]
        answer_row.filler_count = delivery["filler_count"]
        answer_row.speaking_wpm = delivery["speaking_wpm"]
        answer_row.vader_compound = delivery["vader_compound"]
        answer_row.eye_contact_pct = body.eye_contact_pct
    else:
        answer_row = InterviewAnswer(
            session_id=session_id,
            question_index=question_index,
            question_text=question_text,
            answer_text=body.answer_text,
            content_score=analysis.content_score,
            sentiment_score=analysis.sentiment_score,
            final_score=final_score,
            strengths=analysis.strengths,
            improvements=analysis.improvements,
            model_answer=analysis.model_answer,
            word_count=delivery["word_count"],
            filler_count=delivery["filler_count"],
            speaking_wpm=delivery["speaking_wpm"],
            vader_compound=delivery["vader_compound"],
            eye_contact_pct=body.eye_contact_pct,
        )
        db.add(answer_row)
    await db.flush()

    return SubmitAnswerResponse(
        success=True,
        content_score=analysis.content_score,
        sentiment_score=analysis.sentiment_score,
        final_score=final_score,
        strengths=analysis.strengths,
        improvements=analysis.improvements,
        model_answer=analysis.model_answer,
        word_count=delivery["word_count"],
        filler_count=delivery["filler_count"],
        speaking_wpm=delivery["speaking_wpm"],
        vader_compound=delivery["vader_compound"],
        eye_contact_pct=body.eye_contact_pct,
    )
