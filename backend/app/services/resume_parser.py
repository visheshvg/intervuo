import io
import re
from dataclasses import dataclass
from pdfminer.high_level import extract_text
from pdfminer.pdfpage import PDFPage


@dataclass
class ParsedResume:
    raw_text: str
    name: str
    email: str
    phone: str
    page_count: int
    skills: list[str]


def _extract_phone(text: str) -> str:
    for cand in re.findall(r"\+?\d[\d\s().-]{8,}\d", text):
        digits = re.sub(r"\D", "", cand)
        if 10 <= len(digits) <= 13:
            return cand.strip()
    return ""


def _count_pages(pdf_bytes: bytes) -> int:
    try:
        return sum(1 for _ in PDFPage.get_pages(io.BytesIO(pdf_bytes)))
    except Exception:
        return 0


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
        raise ValueError("Could not read the PDF. Please upload a valid PDF file.") from exc

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

    return ParsedResume(
        raw_text=text,
        name=name,
        email=email,
        phone=_extract_phone(text),
        page_count=_count_pages(pdf_bytes),
        skills=skills,
    )
