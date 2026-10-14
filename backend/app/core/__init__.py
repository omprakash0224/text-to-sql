"""
DataSpeak Backend — Application Configuration
Loads and validates all environment variables using pydantic-settings.
"""

from __future__ import annotations

from functools import lru_cache
from typing import List

from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Central settings model. All values are loaded from the environment or a
    .env file at the backend root. Add new variables here — never hard-code
    secrets anywhere else in the codebase.
    """

    model_config = SettingsConfigDict(
        env_file=".env",
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
    GROQ_MODEL: str = "llama-3.3-70b-versatile"

    OPENROUTER_API_KEY: str = ""
    OPENROUTER_MODEL: str = "qwen/qwen-2.5-coder-32b-instruct"

    # ── SQL Security ──────────────────────────────────────────────────────────
    DEFAULT_QUERY_ROW_LIMIT: int = 100
    MAX_QUERY_TIMEOUT_SECONDS: int = 10

    # ── Demo Database ─────────────────────────────────────────────────────────
    DEMO_DATABASE_URL: str = "sqlite+aiosqlite:///./demo_ecommerce.db"


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """
    Return a cached singleton Settings instance.
    Use this everywhere — avoids re-parsing .env on every call.
    """
    return Settings()
