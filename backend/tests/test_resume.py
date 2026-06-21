import pytest

from app.models.answer import InterviewAnswer
from app.models.session import InterviewSession
from app.models.user import User
from app.services.resume_parser import ParsedResume
from sqlalchemy import select


@pytest.mark.asyncio
async def test_upload_rejects_unauthenticated(client):
    res = await client.post(
        "/api/resume/upload",
        files={"file": ("resume.pdf", b"%PDF-1.4", "application/pdf")},
    )
    assert res.status_code == 401


@pytest.mark.asyncio
async def test_upload_rejects_non_pdf(auth_client):
    res = await auth_client.post(
        "/api/resume/upload",
        files={"file": ("resume.docx", b"not a pdf", "application/octet-stream")},
    )
    assert res.status_code == 400


@pytest.mark.asyncio
async def test_health_endpoint(client):
    res = await client.get("/health")
    assert res.status_code == 200
    assert res.json()["status"] == "ok"


@pytest.mark.asyncio
async def test_upload_creates_session(auth_client, monkeypatch):
    def fake_parse_resume(pdf_bytes):
        return ParsedResume(
            raw_text="Jane Candidate\njane@example.com\nPython FastAPI React projects",
            name="Jane Candidate",
            email="jane@example.com",
            phone="123-456-7890",
            page_count=1,
            skills=["fastapi", "python", "react"],
        )

    async def fake_generate_questions(resume_text, field, level, num_questions):
        return ["Tell me about your FastAPI work.", "How do you test React code?"]

    monkeypatch.setattr("app.routers.resume.parse_resume", fake_parse_resume)
    monkeypatch.setattr("app.routers.resume.generate_questions", fake_generate_questions)

    res = await auth_client.post(
        "/api/resume/upload",
        data={"field": "Backend", "level": "experienced"},
        files={"file": ("resume.pdf", b"%PDF-1.4 fake content", "application/pdf")},
    )

    assert res.status_code == 200
    body = res.json()
    assert body["parsed_name"] == "Jane Candidate"
    assert body["skills"] == ["fastapi", "python", "react"]
    assert body["questions"] == [
        "Tell me about your FastAPI work.",
        "How do you test React code?",
    ]


@pytest.mark.asyncio
async def test_submit_answer_updates_existing_row(auth_client, db, monkeypatch):
    user = (
        await db.execute(select(User).where(User.email == "testuser@example.com"))
    ).scalar_one()
    session = InterviewSession(
        id="session-1",
        user_id=user.id,
        field="Backend",
        experience_level="intermediate",
        questions=["What did you build?"],
    )
    db.add(session)
    await db.flush()

    async def fake_analyze_answer(question, answer, field, level):
        from app.services.answer_analyzer import AnalysisResult

        return AnalysisResult(
            content_score=8.0,
            sentiment_score=7.0,
            final_score=7.7,
            strengths="Clear example.",
            improvements="Add more detail.",
            model_answer="- key point",
        )

    monkeypatch.setattr("app.routers.interview.analyze_answer", fake_analyze_answer)

    for answer in ("First answer with enough text", "Second answer with enough text"):
        res = await auth_client.post(
            "/api/interview/submit-answer/session-1/0",
            json={"answer_text": answer},
        )
        assert res.status_code == 200

    rows = (
        await db.execute(
            select(InterviewAnswer).where(InterviewAnswer.session_id == "session-1")
        )
    ).scalars().all()
    assert len(rows) == 1
    assert rows[0].answer_text == "Second answer with enough text"
