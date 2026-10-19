"""
DataSpeak Backend — Core Package
Provides configuration, structured logging, and authentication dependencies.
"""

from app.core.config import Settings, get_settings
from app.core.logging import configure_logging, get_logger
from app.core.auth import get_current_user, get_optional_user, verify_clerk_token

__all__ = [
    "Settings",
    "get_settings",
    "configure_logging",
    "get_logger",
    "get_current_user",
    "get_optional_user",
    "verify_clerk_token",
]
