from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.user import User
from app.models.session import InterviewSession
from app.models.answer import InterviewAnswer  # noqa: F401

router = APIRouter()


@router.get("/")
async def list_sessions(
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(InterviewSession)
        .where(InterviewSession.user_id == current_user.id)
        .order_by(InterviewSession.created_at.desc())
        .limit(limit)
        .offset(offset)
    )
    sessions = result.scalars().all()
    return [_session_summary(s) for s in sessions]


@router.get("/{session_id}")
async def get_session(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(InterviewSession)
        .options(selectinload(InterviewSession.answers))
        .where(
            InterviewSession.id == session_id,
            InterviewSession.user_id == current_user.id,
        )
    )
    sess = result.scalar_one_or_none()
    if not sess:
        raise HTTPException(status_code=404, detail="Session not found.")

    return {
        **_session_summary(sess),
        "answers": [
            {
                "question_index": a.question_index,
                "question_text": a.question_text,
                "answer_text": a.answer_text,
                "content_score": a.content_score,
                "sentiment_score": a.sentiment_score,
                "final_score": a.final_score,
                "strengths": a.strengths,
                "improvements": a.improvements,
                "model_answer": a.model_answer,
                "word_count": a.word_count,
                "filler_count": a.filler_count,
                "speaking_wpm": a.speaking_wpm,
                "vader_compound": a.vader_compound,
                "eye_contact_pct": a.eye_contact_pct,
            }
            for a in sess.answers
        ],
    }


@router.post("/{session_id}/complete")
async def complete_session(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(InterviewSession)
        .options(selectinload(InterviewSession.answers))
        .where(
            InterviewSession.id == session_id,
            InterviewSession.user_id == current_user.id,
        )
    )
    sess = result.scalar_one_or_none()
    if not sess:
        raise HTTPException(status_code=404, detail="Session not found.")

    if sess.completed_at is not None:
        return {"total_score": sess.total_score}

    scores = [a.final_score for a in sess.answers if a.final_score is not None]
    sess.total_score = round(sum(scores) / len(scores), 2) if scores else None
    sess.completed_at = datetime.now(timezone.utc)
    await db.flush()

    return {"total_score": sess.total_score}


def _session_summary(s: InterviewSession) -> dict:
    return {
        "id": s.id,
        "field": s.field,
        "experience_level": s.experience_level,
        "questions": s.questions,
        "total_score": s.total_score,
        "created_at": s.created_at.isoformat() if s.created_at else None,
        "completed_at": s.completed_at.isoformat() if s.completed_at else None,
    }
