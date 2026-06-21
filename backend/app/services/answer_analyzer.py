import asyncio
import json
from dataclasses import dataclass
import google.generativeai as genai

from app.config import settings

_model = genai.GenerativeModel(
    settings.gemini_model,
    generation_config={
        "temperature": 0.4,
        # Room for the model's thinking budget plus the JSON feedback.
        "max_output_tokens": 4096,
        "response_mime_type": "application/json",
    },
)

_EVAL_PROMPT = """
You are a senior interviewer giving honest, specific feedback on a candidate's
spoken answer. The answer is a raw speech-to-text transcript, so judge the content,
not transcription artifacts.

Question: {question}
Candidate's answer: {answer}
Field: {field}
Experience level: {level}

Score two dimensions, each 0.0-10.0, calibrated to a {level} candidate:
1. content_score   - technical accuracy, depth, relevant detail, concrete examples
2. sentiment_score - communication: structure, clarity, conciseness, confidence, and
                     filler-word habits visible in the transcript

Then write genuinely useful feedback. Do NOT give generic praise. Be concrete and
reference what the candidate actually said.
- strengths: 2-3 specific things they did well.
- improvements: the most important gaps. Name the specific concepts or points they
  missed and give concrete, actionable advice. Write it like a real interviewer:
  direct and specific. 3-5 sentences.
- model_answer: a tight outline of what a strong answer to this question covers,
  as 3-5 short bullet lines separated by newlines.

Return ONLY valid JSON (no markdown, no extra text):
{{
  "content_score": 7.5,
  "sentiment_score": 8.0,
  "strengths": "...",
  "improvements": "...",
  "model_answer": "- point one\\n- point two\\n- point three"
}}
"""


@dataclass
class AnalysisResult:
    content_score: float
    sentiment_score: float
    final_score: float
    strengths: str
    improvements: str
    model_answer: str


async def analyze_answer(
    question: str,
    answer: str,
    field: str,
    level: str,
) -> AnalysisResult:
    if not answer or len(answer.strip()) < 10:
        return AnalysisResult(
            content_score=0.0,
            sentiment_score=0.0,
            final_score=0.0,
            strengths="No answer was provided.",
            improvements="Please attempt to answer every question.",
            model_answer="",
        )

    prompt = _EVAL_PROMPT.format(
        question=question,
        answer=answer[:2000],
        field=field,
        level=level,
    )
    response = await asyncio.wait_for(
        _model.generate_content_async(prompt),
        timeout=settings.ai_request_timeout,
    )
    raw = response.text.strip()

    try:
        data = json.loads(raw)
    except json.JSONDecodeError as exc:
        raise ValueError(f"Gemini returned non-JSON evaluation: {raw[:200]}") from exc

    cs = min(10.0, max(0.0, float(data["content_score"])))
    ss = min(10.0, max(0.0, float(data["sentiment_score"])))
    final = round(cs * 0.7 + ss * 0.3, 2)

    return AnalysisResult(
        content_score=cs,
        sentiment_score=ss,
        final_score=final,
        strengths=data.get("strengths", ""),
        improvements=data.get("improvements", ""),
        model_answer=data.get("model_answer", ""),
    )
