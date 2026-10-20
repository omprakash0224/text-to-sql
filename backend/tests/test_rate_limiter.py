"""
DataSpeak Backend — Redis & Sliding Window Rate Limiter Tests
Verifies Redis connection lifecycle, sliding window algorithm, fail-open resilience,
RFC 6585 compliance, and HTTP 429 enforcement under rapid load.
"""

from __future__ import annotations

import asyncio
import time
import pytest
import pytest_asyncio
import fakeredis.aioredis
from fastapi import FastAPI, Depends, status
from fastapi.testclient import TestClient

from app.core.config import get_settings
from app.core.rate_limit import (
    RateLimiter,
    RateLimitResult,
    check_sliding_window_rate_limit,
    get_client_ip,
)
from app.core.redis import (
    close_redis,
    get_redis_client,
    init_redis,
    ping_redis,
    reset_redis_client,
    set_redis_client,
)
from app.models.user import AuthenticatedUser


@pytest_asyncio.fixture
async def fake_redis():
    """Provides an isolated in-memory FakeRedis instance for testing."""
    server = fakeredis.FakeServer()
    client = fakeredis.aioredis.FakeRedis(server=server, decode_responses=True)
    set_redis_client(client)
    yield client
    await client.aclose()
    reset_redis_client()


@pytest.mark.asyncio
async def test_redis_ping_and_lifecycle(fake_redis):
    """Verify ping_redis works with active client and returns False when closed."""
    assert await ping_redis() is True

    # After clearing client
    set_redis_client(None)
    assert await ping_redis() is False
    reset_redis_client()


@pytest.mark.asyncio
async def test_sliding_window_rate_limiter_under_limit(fake_redis):
    """Verify requests under the limit are allowed with accurate remaining counters."""
    key = "rl:test:user_1"
    limit = 3
    window = 60

    # Request 1
    res1 = await check_sliding_window_rate_limit(key, limit=limit, window_seconds=window)
    assert res1.allowed is True
    assert res1.remaining == 2
    assert res1.limit == 3
    headers1 = res1.to_headers()
    assert headers1["X-RateLimit-Limit"] == "3"
    assert headers1["X-RateLimit-Remaining"] == "2"
    assert "Retry-After" not in headers1

    # Request 2
    res2 = await check_sliding_window_rate_limit(key, limit=limit, window_seconds=window)
    assert res2.allowed is True
    assert res2.remaining == 1

    # Request 3
    res3 = await check_sliding_window_rate_limit(key, limit=limit, window_seconds=window)
    assert res3.allowed is True
    assert res3.remaining == 0


@pytest.mark.asyncio
async def test_sliding_window_rate_limiter_exceeded(fake_redis):
    """Verify exceeding the quota returns allowed=False and positive retry_after."""
    key = "rl:test:user_2"
    limit = 2
    window = 10

    # Use up quota
    await check_sliding_window_rate_limit(key, limit=limit, window_seconds=window)
    await check_sliding_window_rate_limit(key, limit=limit, window_seconds=window)

    # 3rd request must be blocked
    blocked_res = await check_sliding_window_rate_limit(key, limit=limit, window_seconds=window)
    assert blocked_res.allowed is False
    assert blocked_res.remaining == 0
    assert blocked_res.retry_after > 0
    assert blocked_res.retry_after <= window

    headers = blocked_res.to_headers()
    assert headers["X-RateLimit-Limit"] == "2"
    assert headers["X-RateLimit-Remaining"] == "0"
    assert "Retry-After" in headers
    assert int(headers["Retry-After"]) > 0


@pytest.mark.asyncio
async def test_sliding_window_replenishment(fake_redis):
    """Verify expired timestamps outside the sliding window are pruned."""
    key = "rl:test:user_3"
    limit = 1
    window = 1  # 1 second window

    # Request 1: allowed
    res1 = await check_sliding_window_rate_limit(key, limit=limit, window_seconds=window)
    assert res1.allowed is True

    # Immediate Request 2: blocked
    res2 = await check_sliding_window_rate_limit(key, limit=limit, window_seconds=window)
    assert res2.allowed is False

    # Wait for window to elapse
    await asyncio.sleep(1.1)

    # Request 3: replenished
    res3 = await check_sliding_window_rate_limit(key, limit=limit, window_seconds=window)
    assert res3.allowed is True


@pytest.mark.asyncio
async def test_rate_limiter_fail_open(fake_redis):
    """Verify that if Redis throws an exception or is unavailable, requests fail-open."""
    # Set client to None
    set_redis_client(None)

    res = await check_sliding_window_rate_limit("rl:test:failopen", limit=5, window_seconds=60)
    assert res.allowed is True
    assert res.remaining == 5
    reset_redis_client()


def test_rate_limiter_fastapi_dependency_integration(fake_redis):
    """Test full HTTP 429 integration on a test FastAPI application."""
    test_app = FastAPI()

    # Protected endpoint with limit of 2 requests per minute
    @test_app.get("/test-limited")
    async def limited_endpoint(
        _rl: RateLimitResult = Depends(RateLimiter(times=2, seconds=60, namespace="test_api")),
    ):
        return {"status": "ok"}

    client = TestClient(test_app)

    # 1st request -> 200 OK
    r1 = client.get("/test-limited")
    assert r1.status_code == status.HTTP_200_OK
    assert r1.headers["X-RateLimit-Remaining"] == "1"

    # 2nd request -> 200 OK
    r2 = client.get("/test-limited")
    assert r2.status_code == status.HTTP_200_OK
    assert r2.headers["X-RateLimit-Remaining"] == "0"

    # 3rd request -> 429 Too Many Requests
    r3 = client.get("/test-limited")
    assert r3.status_code == status.HTTP_429_TOO_MANY_REQUESTS
    assert "Rate limit exceeded" in r3.json()["detail"]
    assert "Retry-After" in r3.headers
    assert r3.headers["X-RateLimit-Remaining"] == "0"


def test_strict_tier_20_requests_allowed_21st_429(fake_redis):
    """Verify threshold enforcement: exactly 20 requests allowed, 21st receives 429."""
    test_app = FastAPI()

    @test_app.get("/strict-20")
    async def strict_endpoint(
        _rl: RateLimitResult = Depends(RateLimiter(times=20, seconds=60, namespace="strict_tier")),
    ):
        return {"ok": True}

    client = TestClient(test_app)

    # First 20 requests must all succeed
    for i in range(1, 21):
        resp = client.get("/strict-20")
        assert resp.status_code == status.HTTP_200_OK, f"Request {i} unexpectedly failed"
        assert resp.headers["X-RateLimit-Limit"] == "20"
        assert resp.headers["X-RateLimit-Remaining"] == str(20 - i)

    # 21st request must trigger 429 Too Many Requests
    resp_21 = client.get("/strict-20")
    assert resp_21.status_code == status.HTTP_429_TOO_MANY_REQUESTS
    assert "Retry-After" in resp_21.headers
    assert int(resp_21.headers["Retry-After"]) > 0
    assert resp_21.headers["X-RateLimit-Remaining"] == "0"


def test_get_client_ip_headers():
    """Verify client IP extraction handles X-Forwarded-For and X-Real-IP headers correctly."""
    from starlette.requests import Request

    scope = {
        "type": "http",
        "method": "GET",
        "path": "/",
        "headers": [
            (b"x-forwarded-for", b"203.0.113.195, 70.41.3.18, 150.172.238.178"),
        ],
        "client": ("127.0.0.1", 54321),
    }
    req = Request(scope)
    assert get_client_ip(req) == "203.0.113.195"

    scope_real = {
        "type": "http",
        "method": "GET",
        "path": "/",
        "headers": [
            (b"x-real-ip", b"198.51.100.42"),
        ],
        "client": ("127.0.0.1", 54321),
    }
    req_real = Request(scope_real)
    assert get_client_ip(req_real) == "198.51.100.42"


def test_rate_limiter_bypass_when_disabled(fake_redis, monkeypatch):
    """When RATE_LIMIT_ENABLED is False, rate limiting is completely bypassed."""
    settings = get_settings()
    monkeypatch.setattr(settings, "RATE_LIMIT_ENABLED", False)

    test_app = FastAPI()

    @test_app.get("/disabled-check")
    async def disabled_endpoint(
        rl: RateLimitResult = Depends(RateLimiter(times=1, seconds=60, namespace="disabled_test")),
    ):
        return {"allowed": rl.allowed}

    client = TestClient(test_app)

    # 1st request -> 200 OK
    r1 = client.get("/disabled-check")
    assert r1.status_code == 200

    # 2nd request -> 200 OK (bypassed, limit is 1)
    r2 = client.get("/disabled-check")
    assert r2.status_code == 200
    assert r2.json()["allowed"] is True

