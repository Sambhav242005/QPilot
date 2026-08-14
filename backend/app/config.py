"""QPilot Backend - Settings and Configuration."""

from functools import lru_cache

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # ─── LLM Configuration ─────────────────────────────────────────────
    LLM_URL: str = "http://localhost:11434/v1"
    LLM_API_KEY: str = "ollama"
    LLM_MODEL_NAME: str = "gemma4:31b-cloud"

    # ─── Database ───────────────────────────────────────────────────────
    DATABASE_URL: str = "sqlite+aiosqlite:///./qpilot.db"

    # ─── Application ────────────────────────────────────────────────────
    BACKEND_HOST: str = "0.0.0.0"
    BACKEND_PORT: int = 8000
    MAX_UPLOAD_SIZE: int = 10_485_760  # 10MB

    # ─── Streaming ──────────────────────────────────────────────────────
    ENABLE_STREAMING: bool = True

    # ─── CORS ───────────────────────────────────────────────────────────
    CORS_ORIGINS: list[str] = ["http://localhost:3000"]

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


def get_async_database_url(database_url: str) -> str:
    """Normalize supported database URLs for SQLAlchemy's async engine."""
    if database_url.startswith("postgres://"):
        return "postgresql+asyncpg://" + database_url[len("postgres://") :]
    if database_url.startswith("postgresql://"):
        return "postgresql+asyncpg://" + database_url[len("postgresql://") :]
    if database_url.startswith("sqlite://"):
        return "sqlite+aiosqlite://" + database_url[len("sqlite://") :]
    return database_url


@lru_cache
def get_settings() -> Settings:
    """Return cached settings singleton."""
    return Settings()
