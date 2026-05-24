from pydantic import BaseModel


class UploadResumeResponse(BaseModel):
    session_id: str
    questions: list[str]
    skills: list[str]
    parsed_name: str


class SubmitAnswerResponse(BaseModel):
    success: bool
    transcript: str
    score: float
