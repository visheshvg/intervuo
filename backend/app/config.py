import json
import secrets
import warnings
from pathlib import Path

from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

# repo-root .env, so it loads whether you run from the root or from backend/
_ROOT_ENV = Path(__file__).resolve().parents[2] / ".env"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(_ROOT_ENV, ".env"),
        env_prefix="INTERVUO_",
        extra="ignore",
    )

    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/intervuo"

    jwt_secret: str = ""
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 60 * 24 * 7

    gemini_api_key: str = ""
    gemini_model: str = "gemini-2.5-flash"

    debug: bool = False
    # plain env string (comma-separated or a JSON array); read via cors_origins_list
    cors_origins: str = "http://localhost:3000"
    num_questions: int = 8
    max_pdf_size_mb: int = 5

    ai_request_timeout: int = 45

    @property
    def cors_origins_list(self) -> list[str]:
        raw = self.cors_origins.strip()
        if not raw:
            return ["http://localhost:3000"]
        if raw.startswith("["):
            return json.loads(raw)
        return [origin.strip() for origin in raw.split(",") if origin.strip()]

    @model_validator(mode="after")
    def _require_jwt_secret(self) -> "Settings":
        # no default secret in production; generate a throwaway one for local dev
        if not self.jwt_secret:
            if self.debug:
                self.jwt_secret = secrets.token_urlsafe(32)
                warnings.warn(
                    "INTERVUO_JWT_SECRET is not set; using an ephemeral debug secret. "
                    "Set INTERVUO_JWT_SECRET for any non-local use.",
                    stacklevel=2,
                )
            else:
                raise ValueError(
                    "INTERVUO_JWT_SECRET must be set (no default is provided in production)."
                )
        return self


settings = Settings()
