"""
DataSpeak Backend — Application Configuration
Loads and validates all environment variables using pydantic-settings.
"""

from __future__ import annotations

from functools import lru_cache
from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Central settings model. All values are loaded from the environment or a
    .env file at the backend root. Add new variables here — never hard-code
    secrets anywhere else in the codebase.
    """

    model_config = SettingsConfigDict(
        env_file=[".env", "backend/.env", "../.env"],
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ── Server ──────────────────────────────────────────────────────────────
    BACKEND_HOST: str = "0.0.0.0"
    BACKEND_PORT: int = 8000
    ENVIRONMENT: str = "development"
    LOG_LEVEL: str = "info"

    # ── CORS ─────────────────────────────────────────────────────────────────
    CORS_ORIGINS: str = "http://localhost:5173,http://127.0.0.1:5173"

    @property
    def cors_origins_list(self) -> List[str]:
        """Return CORS_ORIGINS as a parsed list of strings."""
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]

    # ── Clerk Authentication ─────────────────────────────────────────────────
    CLERK_SECRET_KEY: str = ""
    CLERK_ISSUER: str = ""
    CLERK_JWKS_URL: str = ""

    # ── LLM Providers ────────────────────────────────────────────────────────
    GROQ_API_KEY: str = ""
    GROQ_MODEL: str = "qwen/qwen3.8-27b"

    OPENROUTER_API_KEY: str = ""
    OPENROUTER_MODEL: str = "minimax/minimax-m3.1-flash:free"

    # ── SQL Security ──────────────────────────────────────────────────────────
    DEFAULT_QUERY_ROW_LIMIT: int = 100
    MAX_QUERY_TIMEOUT_SECONDS: int = 10

    # ── Demo Database ─────────────────────────────────────────────────────────
    DEMO_DATABASE_URL: str = "sqlite+aiosqlite:///./demo_ecommerce.db"

    # ── Internal Application Database (Query History, Bookmarks) ──────────────
    APP_DATABASE_URL: str = "postgresql+asyncpg://dataspeak_app:dataspeak_secure_pass@localhost:5432/dataspeak_internal"

    # ── Redis Cache & Rate Limiting ───────────────────────────────────────────
    REDIS_URL: str = "redis://localhost:6379/0"
    RATE_LIMIT_QUERY_PER_MINUTE: int = 20
    RATE_LIMIT_GLOBAL_PER_MINUTE: int = 120
    RATE_LIMIT_BURST_CAP: int = 5
    RATE_LIMIT_ENABLED: bool = True


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """
    Return a cached singleton Settings instance.
    Use this everywhere — avoids re-parsing .env on every call.
    """
    return Settings()
