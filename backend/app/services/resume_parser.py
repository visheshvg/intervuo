import io
import re
from dataclasses import dataclass
from datetime import datetime
from pdfminer.high_level import extract_text


@dataclass
class ParsedResume:
    raw_text: str
    name: str
    email: str
    skills: list[str]
    experience_years: int


_SKILL_KEYWORDS: set[str] = {
    "python", "javascript", "typescript", "react", "next.js", "node.js",
    "fastapi", "flask", "django", "sql", "postgresql", "mysql", "mongodb",
    "redis", "docker", "kubernetes", "aws", "gcp", "azure", "git",
    "machine learning", "deep learning", "tensorflow", "pytorch", "scikit-learn",
    "java", "go", "rust", "c++", "c#", "graphql", "rest", "microservices",
    "ci/cd", "linux", "html", "css", "tailwind", "vue", "angular",
    "kafka", "rabbitmq", "elasticsearch", "spark", "hadoop", "scala",
}


def parse_resume(pdf_bytes: bytes) -> ParsedResume:
    try:
        text = extract_text(io.BytesIO(pdf_bytes))
    except Exception as exc:
        raise ValueError(f"Could not extract text from PDF: {exc}") from exc

    if not text or len(text.strip()) < 50:
        raise ValueError("PDF appears to be empty or image-only (no extractable text).")

    email_match = re.search(r"[\w.+-]+@[\w-]+\.[a-zA-Z]{2,}", text)
    email = email_match.group(0) if email_match else ""

    lines = [ln.strip() for ln in text.splitlines() if ln.strip()]
    name = next(
        (ln for ln in lines if "@" not in ln and "http" not in ln and len(ln) < 60),
        "",
    )

    text_lower = text.lower()
    skills = sorted(kw for kw in _SKILL_KEYWORDS if kw in text_lower)

    current_year = datetime.now().year
    year_matches = [
        int(y) for y in re.findall(r"\b((?:19|20)\d{2})\b", text)
        if 1980 <= int(y) <= current_year
    ]
    years = sorted(set(year_matches))
    experience_years = (max(years) - min(years)) if len(years) >= 2 else 0

    return ParsedResume(
        raw_text=text,
        name=name,
        email=email,
        skills=skills,
        experience_years=experience_years,
    )
