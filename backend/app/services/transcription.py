import os
import tempfile
from openai import AsyncOpenAI
from app.config import settings

_client: AsyncOpenAI | None = None


def _get_client() -> AsyncOpenAI:
    global _client
    if _client is None:
        if not settings.openai_api_key:
            raise RuntimeError("OPENAI_API_KEY is not configured.")
        _client = AsyncOpenAI(api_key=settings.openai_api_key)
    return _client


async def transcribe_audio(audio_bytes: bytes, mime_type: str = "audio/webm") -> str:
    if not audio_bytes:
        return ""

    ext = ".webm" if "webm" in mime_type else (".mp4" if "mp4" in mime_type else ".wav")

    with tempfile.NamedTemporaryFile(suffix=ext, delete=False) as tmp:
        tmp.write(audio_bytes)
        tmp_path = tmp.name

    try:
        with open(tmp_path, "rb") as audio_file:
            result = await _get_client().audio.transcriptions.create(
                model="whisper-1",
                file=audio_file,
                response_format="text",
            )
        return result.strip() if isinstance(result, str) else str(result).strip()
    finally:
        os.unlink(tmp_path)
