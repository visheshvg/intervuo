from fastapi import APIRouter, Depends
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
async def get_analytics(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(InterviewSession)
        .options(selectinload(InterviewSession.answers))
        .where(InterviewSession.user_id == current_user.id)
        .order_by(InterviewSession.created_at.asc())
    )
    sessions = result.scalars().all()

    history = []
    all_scores: list[float] = []

    for s in sessions:
        scores = [a.final_score for a in s.answers if a.final_score is not None]
        avg = round(sum(scores) / len(scores), 2) if scores else 0.0
        all_scores.extend(scores)
        history.append({
            "session_id": s.id,
            "field": s.field,
            "level": s.experience_level,
            "avg_score": avg,
            "total_questions": len(s.questions),
            "answered_questions": len(s.answers),
            "date": s.created_at.isoformat() if s.created_at else None,
        })

    return {
        "total_sessions": len(sessions),
        "average_score": round(sum(all_scores) / len(all_scores), 2) if all_scores else 0.0,
        "best_score": round(max(all_scores), 2) if all_scores else 0.0,
        "history": history,
    }
