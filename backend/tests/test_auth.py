"""
DataSpeak Backend — Authentication & Clerk JWT Unit Tests
Verifies that unauthenticated or invalid requests receive 401 Unauthorized,
and that valid Clerk RS256 JWT tokens extract the user context accurately.
"""

import time
import pytest
import jwt
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.primitives import serialization
from fastapi import HTTPException
from starlette.testclient import TestClient

from main import app
from app.core.auth import (
    verify_clerk_token,
    set_test_jwk_client,
)
from app.models.user import AuthenticatedUser


@pytest.fixture
def test_client():
    return TestClient(app)


# ── RSA Key Pair Fixture for RS256 JWKS Simulation ─────────────────────────
@pytest.fixture(scope="module")
def rsa_keypair():
    """Generate an in-memory RSA key pair for testing RS256 token validation."""
    private_key = rsa.generate_private_key(
        public_exponent=65537,
        key_size=2048,
    )
    private_pem = private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption(),
    )
    public_pem = private_key.public_key().public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo,
    )
    return private_pem, public_pem


class MockSigningKey:
    """Mock PyJWK signing key wrapper."""

    def __init__(self, key: bytes):
        self.key = key


class MockJWKClient:
    """Simulates jwt.PyJWKClient returning our test RSA public key."""

    def __init__(self, public_pem: bytes):
        self.public_pem = public_pem

    def get_signing_key_from_jwt(self, token: str):
        return MockSigningKey(self.public_pem)


# ============================================================================
# 1. ENDPOINT AUTHENTICATION TESTS (GET /api/v1/auth/me)
# ============================================================================

def test_missing_auth_header_returns_401(test_client):
    """Requests without an Authorization header must receive 401 Unauthorized."""
    response = test_client.get("/api/v1/auth/me")
    assert response.status_code == 401
    assert "Not authenticated" in response.json().get("detail", "")
    assert "WWW-Authenticate" in response.headers


def test_invalid_scheme_returns_401(test_client):
    """Requests with non-Bearer authentication must receive 401 Unauthorized."""
    response = test_client.get(
        "/api/v1/auth/me",
        headers={"Authorization": "Basic dXNlcjpwYXNz"},
    )
    assert response.status_code == 401
    assert "Not authenticated" in response.json().get("detail", "")


def test_invalid_bearer_token_returns_401(test_client):
    """Malformed or invalid Bearer tokens must receive 401 Unauthorized."""
    response = test_client.get(
        "/api/v1/auth/me",
        headers={"Authorization": "Bearer not_a_valid_token_xyz"},
    )
    assert response.status_code == 401


def test_dev_token_in_development_returns_200(test_client):
    """In development mode, 'dev-token' resolves a development user session."""
    response = test_client.get(
        "/api/v1/auth/me",
        headers={"Authorization": "Bearer dev-token"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["user_id"] == "user_dev_01"
    assert data["email"] == "developer@dataspeak.local"


# ============================================================================
# 2. RS256 JWKS VERIFICATION UNIT TESTS
# ============================================================================

from app.core.config import get_settings


def test_valid_rs256_token_verifies_successfully(rsa_keypair):
    """A valid RS256 Clerk token must verify cleanly and extract claims."""
    private_pem, public_pem = rsa_keypair
    set_test_jwk_client(MockJWKClient(public_pem))

    try:
        now = int(time.time())
        settings = get_settings()
        issuer = (
            settings.CLERK_ISSUER
            if (settings.CLERK_ISSUER and not settings.CLERK_ISSUER.startswith("https://your-instance"))
            else "https://clerk.test"
        )
        payload = {
            "sub": "user_2test123456",
            "iss": issuer,
            "email": "analyst@company.com",
            "first_name": "Ada",
            "last_name": "Lovelace",
            "org_id": "org_analytics_team",
            "iat": now,
            "exp": now + 3600,
        }
        token = jwt.encode(payload, private_pem, algorithm="RS256", headers={"kid": "key-1"})

        user = verify_clerk_token(token)
        assert isinstance(user, AuthenticatedUser)
        assert user.user_id == "user_2test123456"
        assert user.email == "analyst@company.com"
        assert user.first_name == "Ada"
        assert user.last_name == "Lovelace"
        assert user.org_id == "org_analytics_team"
        assert user.display_name == "Ada Lovelace"
    finally:
        set_test_jwk_client(None)


def test_expired_rs256_token_raises_401(rsa_keypair):
    """Tokens with an expiration time in the past must be rejected with 401."""
    private_pem, public_pem = rsa_keypair
    set_test_jwk_client(MockJWKClient(public_pem))

    try:
        past = int(time.time()) - 100
        settings = get_settings()
        issuer = (
            settings.CLERK_ISSUER
            if (settings.CLERK_ISSUER and not settings.CLERK_ISSUER.startswith("https://your-instance"))
            else "https://clerk.test"
        )
        payload = {
            "sub": "user_expired",
            "iss": issuer,
            "iat": past - 3600,
            "exp": past,
        }
        token = jwt.encode(payload, private_pem, algorithm="RS256", headers={"kid": "key-1"})

        with pytest.raises(HTTPException) as exc_info:
            verify_clerk_token(token)

        assert exc_info.value.status_code == 401
        assert "expired" in exc_info.value.detail.lower()
    finally:
        set_test_jwk_client(None)


def test_forged_signature_raises_401(rsa_keypair):
    """Tokens signed with a different key must be rejected with 401."""
    _, public_pem = rsa_keypair
    set_test_jwk_client(MockJWKClient(public_pem))

    # Generate a second, attacker key
    attacker_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    attacker_pem = attacker_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption(),
    )

    try:
        now = int(time.time())
        settings = get_settings()
        issuer = (
            settings.CLERK_ISSUER
            if (settings.CLERK_ISSUER and not settings.CLERK_ISSUER.startswith("https://your-instance"))
            else "https://clerk.test"
        )
        token = jwt.encode(
            {"sub": "user_attacker", "iss": issuer, "exp": now + 3600},
            attacker_pem,
            algorithm="RS256",
            headers={"kid": "key-1"},
        )

        with pytest.raises(HTTPException) as exc_info:
            verify_clerk_token(token)

        assert exc_info.value.status_code == 401
    finally:
        set_test_jwk_client(None)


def test_missing_sub_claim_raises_401(rsa_keypair):
    """Tokens missing the subject ('sub') claim must be rejected."""
    private_pem, public_pem = rsa_keypair
    set_test_jwk_client(MockJWKClient(public_pem))

    try:
        now = int(time.time())
        settings = get_settings()
        issuer = (
            settings.CLERK_ISSUER
            if (settings.CLERK_ISSUER and not settings.CLERK_ISSUER.startswith("https://your-instance"))
            else "https://clerk.test"
        )
        # Payload with valid iss but no 'sub'
        token = jwt.encode(
            {"iss": issuer, "email": "nobody@test.com", "exp": now + 3600},
            private_pem,
            algorithm="RS256",
            headers={"kid": "key-1"},
        )

        with pytest.raises(HTTPException) as exc_info:
            verify_clerk_token(token)

        assert exc_info.value.status_code == 401
        assert "sub" in exc_info.value.detail.lower()
    finally:
        set_test_jwk_client(None)
