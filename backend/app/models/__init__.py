"""
DataSpeak Backend — Models Package
Exports Pydantic v2 domain schemas.
"""

from app.models.user import AuthenticatedUser

__all__ = ["AuthenticatedUser"]
