from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_prefix="INTERVUO_",
        extra="ignore",
    )

    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/intervuo"

    jwt_secret: str = "dev-secret-change-in-production"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 60 * 24 * 7

    gemini_api_key: str = ""
    openai_api_key: str = ""

    redis_url: str = "redis://localhost:6379"

    debug: bool = False
    cors_origins: list[str] = ["http://localhost:3000"]
    num_questions: int = 8
    max_pdf_size_mb: int = 5


settings = Settings()
