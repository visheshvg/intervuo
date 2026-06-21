from pydantic import BaseModel


class ResumeTip(BaseModel):
    present: bool
    text: str


class CourseRec(BaseModel):
    name: str
    url: str


class UploadResumeResponse(BaseModel):
    session_id: str
    questions: list[str]
    skills: list[str]
    parsed_name: str
    phone: str
    page_count: int
    resume_score: int
    resume_tips: list[ResumeTip]
    predicted_field: str
    recommended_skills: list[str]
    courses: list[CourseRec]


class SubmitAnswerRequest(BaseModel):
    answer_text: str
    duration_seconds: float = 0.0
    eye_contact_pct: float | None = None


class SubmitAnswerResponse(BaseModel):
    success: bool
    content_score: float
    sentiment_score: float
    final_score: float
    strengths: str
    improvements: str
    model_answer: str
    word_count: int
    filler_count: int
    speaking_wpm: float | None = None
    vader_compound: float = 0.0
    eye_contact_pct: float | None = None
