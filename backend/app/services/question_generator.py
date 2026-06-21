import asyncio
import json
import google.generativeai as genai

from app.config import settings

_model = genai.GenerativeModel(
    settings.gemini_model,
    generation_config={
        "temperature": 0.9,
        "top_p": 0.95,
        # gemini-2.5 models spend output tokens on internal "thinking", so give the
        # response plenty of room or the JSON array gets truncated mid-string.
        "max_output_tokens": 8192,
        "response_mime_type": "application/json",
    },
)

_PROMPT = """
You are an expert technical interviewer. Given this candidate's resume and profile,
generate exactly {num_questions} high-quality interview questions.

Resume (truncated):
---
{resume_text}
---

Field: {field}
Experience level: {level}

Rules:
- 70% technical questions directly referencing skills/projects from the resume
- 30% behavioural/situational questions (STAR format expected)
- Questions must match the {level} difficulty precisely
- Reference specific technologies or projects visible in the resume where possible
- Return ONLY a valid JSON array of strings, no markdown, no preamble

Example output:
["Question one?", "Question two?", "Question three?"]
"""


async def generate_questions(
    resume_text: str,
    field: str,
    level: str,
    num_questions: int = 8,
) -> list[str]:
    prompt = _PROMPT.format(
        resume_text=resume_text[:3500],
        field=field,
        level=level,
        num_questions=num_questions,
    )
    response = await asyncio.wait_for(
        _model.generate_content_async(prompt),
        timeout=settings.ai_request_timeout,
    )

    try:
        data = json.loads(response.text.strip())
    except json.JSONDecodeError as exc:
        raise ValueError(f"Gemini returned non-JSON: {response.text[:200]}") from exc

    # JSON mode returns the array directly, but can wrap it in an object.
    if isinstance(data, dict):
        data = next((v for v in data.values() if isinstance(v, list)), [])

    if not isinstance(data, list) or len(data) < 2:
        raise ValueError(f"Unexpected question format from Gemini: {data}")

    return [str(q) for q in data[:num_questions]]
