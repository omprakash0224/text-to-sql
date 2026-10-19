"""
DataSpeak Backend — Authenticated User Model
Pydantic v2 schema representing an authenticated session verified via Clerk JWT.
"""

from __future__ import annotations

from typing import Any, Dict, Optional
from pydantic import BaseModel, ConfigDict, Field


class AuthenticatedUser(BaseModel):
    """
    User entity extracted from a validated Clerk JWT token.
    Provides session identity and tenant isolation context.
    """

    model_config = ConfigDict(extra="ignore")

    user_id: str = Field(..., description="Unique Clerk User ID (JWT 'sub' claim)")
    email: Optional[str] = Field(default=None, description="Primary email address")
    first_name: Optional[str] = Field(default=None, description="User's first name")
    last_name: Optional[str] = Field(default=None, description="User's last name")
    org_id: Optional[str] = Field(default=None, description="Clerk Organization ID (if multi-tenant)")
    session_claims: Dict[str, Any] = Field(
        default_factory=dict,
        description="Raw validated JWT payload claims for session inspection",
    )

    @property
    def display_name(self) -> str:
        """Return the user's full name or email or user_id."""
        if self.first_name and self.last_name:
            return f"{self.first_name} {self.last_name}"
        if self.first_name:
            return self.first_name
        if self.email:
            return self.email
        return self.user_id
