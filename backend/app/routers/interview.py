import json
from fastapi import (
    APIRouter, Depends, File, Form, HTTPException,
    Query, UploadFile, WebSocket, WebSocketDisconnect,
)
from jose import JWTError, jwt
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.config import settings
from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.user import User
from app.models.session import InterviewSession
from app.models.answer import InterviewAnswer
from app.services.transcription import transcribe_audio
from app.services.answer_analyzer import analyze_answer
from app.services.ws_manager import manager
from app.schemas.interview import SubmitAnswerResponse

router = APIRouter()


def _decode_ws_token(token: str) -> str | None:
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
        return payload.get("sub")
    except JWTError:
        return None


@router.websocket("/ws/{session_id}")
async def interview_ws(
    websocket: WebSocket,
    session_id: str,
    token: str = Query(...),
    db: AsyncSession = Depends(get_db),
):
    """
    Real-time feedback channel. Requires JWT via ?token= query param.

    Client sends:
      {"event": "answer_ready", "data": {"question_index": 0, "answer_text": "..."}}

    Server replies:
      {"event": "feedback_loading", "data": {}}
      {"event": "feedback_ready",   "data": {question_index, content_score, sentiment_score, final_score, strengths, improvements}}
      {"event": "feedback_error",   "data": {"detail": "..."}}
    """
    user_id = _decode_ws_token(token)
    if not user_id:
        await websocket.close(code=4001)
        return

    result = await db.execute(
        select(InterviewSession).where(
            InterviewSession.id == session_id,
            InterviewSession.user_id == user_id,
        )
    )
    sess = result.scalar_one_or_none()
    if not sess:
        await websocket.close(code=4004)
        return

    await manager.connect(websocket, session_id)
    try:
        while True:
            raw = await websocket.receive_text()
            msg = json.loads(raw)

            if msg.get("event") != "answer_ready":
                continue

            d = msg["data"]
            question_index = d.get("question_index", -1)

            if not isinstance(question_index, int) or not (0 <= question_index < len(sess.questions)):
                await manager.send(session_id, "feedback_error", {
                    "detail": f"question_index {question_index} is out of range."
                })
                continue

            await manager.send(session_id, "feedback_loading", {})

            try:
                analysis = await analyze_answer(
                    question=sess.questions[question_index],
                    answer=d.get("answer_text", ""),
                    field=sess.field,
                    level=sess.experience_level,
                )
                await manager.send(session_id, "feedback_ready", {
                    "question_index": question_index,
                    "content_score": analysis.content_score,
                    "sentiment_score": analysis.sentiment_score,
                    "final_score": analysis.final_score,
                    "strengths": analysis.strengths,
                    "improvements": analysis.improvements,
                })
            except Exception as exc:
                await manager.send(session_id, "feedback_error", {"detail": str(exc)})

    except WebSocketDisconnect:
        manager.disconnect(websocket, session_id)


@router.post("/submit-audio/{session_id}/{question_index}", response_model=SubmitAnswerResponse)
async def submit_audio(
    session_id: str,
    question_index: int,
    audio: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
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

    audio_bytes = await audio.read()
    try:
        transcript = await transcribe_audio(audio_bytes, audio.content_type or "audio/webm")
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Transcription failed: {exc}")

    try:
        analysis = await analyze_answer(
            question=question_text,
            answer=transcript,
            field=sess.field,
            level=sess.experience_level,
        )
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Analysis failed: {exc}")

    existing = await db.execute(
        select(InterviewAnswer).where(
            InterviewAnswer.session_id == session_id,
            InterviewAnswer.question_index == question_index,
        )
    )
    answer_row = existing.scalar_one_or_none()
    if answer_row:
        answer_row.answer_text = transcript
        answer_row.content_score = analysis.content_score
        answer_row.sentiment_score = analysis.sentiment_score
        answer_row.final_score = analysis.final_score
        answer_row.strengths = analysis.strengths
        answer_row.improvements = analysis.improvements
    else:
        answer_row = InterviewAnswer(
            session_id=session_id,
            question_index=question_index,
            question_text=question_text,
            answer_text=transcript,
            content_score=analysis.content_score,
            sentiment_score=analysis.sentiment_score,
            final_score=analysis.final_score,
            strengths=analysis.strengths,
            improvements=analysis.improvements,
        )
        db.add(answer_row)
    await db.flush()

    await manager.send(session_id, "feedback_ready", {
        "question_index": question_index,
        "content_score": analysis.content_score,
        "sentiment_score": analysis.sentiment_score,
        "final_score": analysis.final_score,
        "strengths": analysis.strengths,
        "improvements": analysis.improvements,
    })

    return SubmitAnswerResponse(
        success=True,
        transcript=transcript,
        score=analysis.final_score,
    )
