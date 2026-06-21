import re

# VADER is a tiny, deterministic, lexicon-based sentiment scorer (no model download).
try:
    from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer

    _vader = SentimentIntensityAnalyzer()
except Exception:  # pragma: no cover - degrade gracefully if not installed
    _vader = None

# Common spoken fillers. Counted as whole words/phrases against the transcript.
_FILLERS = [
    "um", "uh", "er", "ah", "hmm",
    "like", "you know", "i mean", "basically", "actually",
    "literally", "kind of", "sort of", "right",
]


def compute_delivery(text: str, duration_seconds: float) -> dict:
    """Objective signals from the transcript: word/filler counts, pace, and tone."""
    words = re.findall(r"[A-Za-z']+", text)
    word_count = len(words)

    lowered = text.lower()
    filler_count = sum(
        len(re.findall(rf"\b{re.escape(f)}\b", lowered)) for f in _FILLERS
    )

    wpm = None
    if duration_seconds and duration_seconds > 0:
        wpm = round(word_count / (duration_seconds / 60.0), 1)

    # Sentiment polarity of the answer text: -1 (negative) .. +1 (positive).
    vader_compound = 0.0
    if _vader is not None and text.strip():
        vader_compound = round(_vader.polarity_scores(text)["compound"], 3)

    return {
        "word_count": word_count,
        "filler_count": filler_count,
        "speaking_wpm": wpm,
        "vader_compound": vader_compound,
    }
