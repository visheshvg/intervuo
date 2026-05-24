import json
import re
from dataclasses import dataclass
import google.generativeai as genai

_model = genai.GenerativeModel(
    "gemini-1.5-flash",
    generation_config={"temperature": 0.3, "max_output_tokens": 1024},
)

_EVAL_PROMPT = """
You are evaluating a candidate's answer during a technical interview.

Question: {question}
Candidate's answer: {answer}
Field: {field}
Experience level: {level}

Score the answer on two dimensions (each 0.0 - 10.0):
1. content_score  - technical accuracy, depth, relevance, use of examples
2. sentiment_score - communication clarity, structure, confidence, conciseness

Also provide:
- strengths: 1-2 sentences on what the candidate did well
- improvements: 1-2 sentences on what they could improve

Return ONLY valid JSON (no markdown, no extra text):
{{
  "content_score": 7.5,
  "sentiment_score": 8.0,
  "strengths": "...",
  "improvements": "..."
}}
"""


@dataclass
class AnalysisResult:
    content_score: float
    sentiment_score: float
    final_score: float
    strengths: str
    improvements: str


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
        )

    prompt = _EVAL_PROMPT.format(
        question=question,
        answer=answer[:2000],
        field=field,
        level=level,
    )
    response = await _model.generate_content_async(prompt)
    raw = response.text.strip()
    raw = re.sub(r"^```(?:json)?|```$", "", raw, flags=re.MULTILINE).strip()

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
    )
