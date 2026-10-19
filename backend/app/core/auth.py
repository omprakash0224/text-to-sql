"""
DataSpeak Backend — Clerk JWT Authentication & Security Guard
Verifies incoming Bearer JWT tokens against Clerk's JWKS public keys.
Provides the `get_current_user` FastAPI dependency for route protection.
"""

from __future__ import annotations

from typing import Any, Dict, Optional
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.config import get_settings
from app.core.logging import get_logger
from app.models.user import AuthenticatedUser

logger = get_logger("auth")

# FastAPI standard security scheme with auto_error=False to allow custom 401 handling
bearer_scheme = HTTPBearer(auto_error=False)

# Cached PyJWKClient instance
_jwk_client: Optional[jwt.PyJWKClient] = None
_jwk_client_url: Optional[str] = None


def get_jwks_url() -> Optional[str]:
    """Derive Clerk JWKS URL from settings."""
    settings = get_settings()
    if settings.CLERK_JWKS_URL and not settings.CLERK_JWKS_URL.startswith("https://your-instance"):
        return settings.CLERK_JWKS_URL
    if settings.CLERK_ISSUER and not settings.CLERK_ISSUER.startswith("https://your-instance"):
        return f"{settings.CLERK_ISSUER.rstrip('/')}/.well-known/jwks.json"
    return None


def get_jwk_client() -> Optional[jwt.PyJWKClient]:
    """
    Get or create a singleton PyJWKClient with caching.
    Supports dependency injection for automated testing.
    """
    global _jwk_client, _jwk_client_url
    if _jwk_client is not None:
        return _jwk_client

    url = get_jwks_url()
    if not url:
        return None

    if _jwk_client_url != url:
        _jwk_client = jwt.PyJWKClient(url, cache_jwk_set=True, lifespan=3600)
        _jwk_client_url = url
    return _jwk_client


def set_test_jwk_client(client: Optional[Any]) -> None:
    """Helper to inject a mock or test PyJWKClient during unit tests."""
    global _jwk_client
    _jwk_client = client


def verify_clerk_token(token: str) -> AuthenticatedUser:
    """
    Decode and verify a Clerk Bearer JWT token.
    Enforces signature validity (RS256), expiration, and issuer.
    """
    settings = get_settings()

    # ── 1. Development / Testing Token Bypass ────────────────────────────────
    if settings.ENVIRONMENT in ("development", "test"):
        if token in ("dev-token", "test-token") or token.startswith("dev_"):
            logger.debug("Accepting development test token", token_preview=token[:10])
            return AuthenticatedUser(
                user_id="user_dev_01",
                email="developer@dataspeak.local",
                first_name="Dev",
                last_name="User",
                org_id="org_dev_local",
                session_claims={"sub": "user_dev_01", "role": "admin"},
            )

    jwk_client = get_jwk_client()

    # ── 2. If JWKS client is available (Live Clerk or Unit Test mock) ─────────
    if jwk_client is not None:
        try:
            signing_key = jwk_client.get_signing_key_from_jwt(token)
            decode_kwargs: Dict[str, Any] = {
                "algorithms": ["RS256"],
                "options": {"verify_aud": False},
            }

            if settings.CLERK_ISSUER and not settings.CLERK_ISSUER.startswith("https://your-instance"):
                decode_kwargs["issuer"] = settings.CLERK_ISSUER

            payload = jwt.decode(token, signing_key.key, **decode_kwargs)

            user_id = payload.get("sub")
            if not user_id:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Token payload is missing subject ('sub') claim.",
                    headers={"WWW-Authenticate": 'Bearer error="invalid_token"'},
                )

            return AuthenticatedUser(
                user_id=user_id,
                email=payload.get("email") or payload.get("primary_email_address"),
                first_name=payload.get("first_name") or payload.get("given_name"),
                last_name=payload.get("last_name") or payload.get("family_name"),
                org_id=payload.get("org_id"),
                session_claims=payload,
            )

        except jwt.ExpiredSignatureError:
            logger.warn("Authentication failed: Token expired")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authentication token has expired.",
                headers={
                    "WWW-Authenticate": 'Bearer error="invalid_token", error_description="The token has expired"'
                },
            )
        except jwt.PyJWTError as e:
            logger.warn("Authentication failed: JWT verification error", error=str(e))
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Invalid authentication token: {str(e)}",
                headers={"WWW-Authenticate": 'Bearer error="invalid_token"'},
            )
        except HTTPException:
            raise
        except Exception as e:
            logger.error("Unexpected error during JWT verification", error=str(e))
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials.",
                headers={"WWW-Authenticate": "Bearer"},
            )

    # ── 3. Fallback when JWKS is not configured ──────────────────────────────
    if settings.ENVIRONMENT in ("development", "test"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Clerk keys unconfigured. Use valid dev-token or configure CLERK_JWKS_URL.",
            headers={"WWW-Authenticate": 'Bearer error="invalid_token"'},
        )

    # In production, missing Clerk credentials is a fatal configuration error
    logger.error("Authentication failed: CLERK_JWKS_URL / CLERK_ISSUER not configured in production")
    raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail="Authentication service is misconfigured.",
    )


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
) -> AuthenticatedUser:
    """
    FastAPI dependency that extracts and validates the Clerk Bearer token.
    Strictly raises HTTP 401 if token is missing, malformed, or invalid.
    """
    if credentials is None or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return verify_clerk_token(credentials.credentials)


async def get_optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
) -> Optional[AuthenticatedUser]:
    """
    FastAPI dependency that extracts user context if a token is present,
    or returns None if unauthenticated.
    """
    if credentials is None or not credentials.credentials:
        return None
    try:
        return verify_clerk_token(credentials.credentials)
    except HTTPException:
        return None
