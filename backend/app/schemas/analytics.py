from pydantic import BaseModel


class SessionHistory(BaseModel):
    session_id: str
    field: str
    level: str
    avg_score: float
    total_questions: int
    answered_questions: int
    date: str


class AnalyticsResponse(BaseModel):
    total_sessions: int
    average_score: float
    best_score: float
    history: list[SessionHistory]
