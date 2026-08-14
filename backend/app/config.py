"""QPilot Backend - Settings and Configuration."""

import json
from functools import lru_cache

from pydantic import field_validator
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
    CORS_ORIGINS: str = "http://localhost:3000"

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, v):
        if isinstance(v, str):
            # Strip brackets if present (Railway mangles JSON)
            v = v.strip()
            if v.startswith("[") and v.endswith("]"):
                v = v[1:-1]
            return ",".join(origin.strip().strip('"').strip("'") for origin in v.split(",") if origin.strip())
        if isinstance(v, list):
            return ",".join(v)
        return v

    @property
    def cors_origin_list(self) -> list[str]:
        """Return CORS_ORIGINS as a list."""
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

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
