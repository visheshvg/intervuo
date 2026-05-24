import json
import re
import google.generativeai as genai

_model = genai.GenerativeModel(
    "gemini-1.5-flash",
    generation_config={
        "temperature": 0.9,
        "top_p": 0.95,
        "max_output_tokens": 2048,
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
    response = await _model.generate_content_async(prompt)
    raw = response.text.strip()
    raw = re.sub(r"^```(?:json)?|```$", "", raw, flags=re.MULTILINE).strip()

    try:
        questions: list = json.loads(raw)
    except json.JSONDecodeError as exc:
        raise ValueError(f"Gemini returned non-JSON: {raw[:200]}") from exc

    if not isinstance(questions, list) or len(questions) < 2:
        raise ValueError(f"Unexpected question format from Gemini: {questions}")

    return [str(q) for q in questions[:num_questions]]
