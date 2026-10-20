"""
DataSpeak Backend — Sliding Window Rate Limiting Engine
Implements sub-millisecond sliding window rate limiting backed by Redis sorted sets (ZSET),
with RFC 6585 compliance, standardized rate-limit headers, and fail-open resilience.
"""

from dataclasses import dataclass
import time
from typing import Dict, Optional
import uuid

from fastapi import Depends, HTTPException, Request, Response, status

from app.core.auth import get_optional_user
from app.core.config import get_settings
from app.core.logging import get_logger
from app.core.redis import get_redis_client
from app.models.user import AuthenticatedUser

logger = get_logger("core.rate_limit")


@dataclass
class RateLimitResult:
    """Outcome of a rate limit evaluation."""
    allowed: bool
    limit: int
    remaining: int
    reset: int
    retry_after: int

    def to_headers(self) -> Dict[str, str]:
        """Convert result into standard RFC rate limiting HTTP headers."""
        headers = {
            "X-RateLimit-Limit": str(self.limit),
            "X-RateLimit-Remaining": str(max(0, self.remaining)),
            "X-RateLimit-Reset": str(self.reset),
        }
        if not self.allowed:
            headers["Retry-After"] = str(self.retry_after)
        return headers


def get_client_ip(request: Request) -> str:
    """Extract client IP address, respecting X-Forwarded-For or X-Real-IP if present."""
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    real_ip = request.headers.get("x-real-ip")
    if real_ip:
        return real_ip.strip()
    if request.client and request.client.host:
        return request.client.host
    return "127.0.0.1"


async def check_sliding_window_rate_limit(
    key: str,
    limit: int,
    window_seconds: int,
) -> RateLimitResult:
    """
    Evaluates rate limit using a sliding window log backed by Redis ZSET.
    Fails open (allows request) if Redis is unavailable or throws an error.
    """
    settings = get_settings()

    # If rate limiting is disabled globally in config, allow all traffic
    if not settings.RATE_LIMIT_ENABLED:
        return RateLimitResult(
            allowed=True,
            limit=limit,
            remaining=limit,
            reset=window_seconds,
            retry_after=0,
        )

    client = get_redis_client()
    if client is None:
        # Fail-open: Redis is offline or unconfigured
        return RateLimitResult(
            allowed=True,
            limit=limit,
            remaining=limit,
            reset=window_seconds,
            retry_after=0,
        )

    now = time.time()
    window_start = now - window_seconds
    unique_member = f"{now}:{uuid.uuid4().hex[:8]}"

    try:
        async with client.pipeline(transaction=True) as pipe:
            # 1. Prune timestamps outside current sliding window
            pipe.zremrangebyscore(key, 0, window_start)
            # 2. Count active events in window
            pipe.zcard(key)
            results = await pipe.execute()

        current_count = results[1]

        if current_count < limit:
            # Under limit: Record request timestamp and set TTL
            async with client.pipeline(transaction=True) as pipe:
                pipe.zadd(key, {unique_member: now})
                pipe.expire(key, window_seconds + 5)
                await pipe.execute()

            remaining = limit - (current_count + 1)
            return RateLimitResult(
                allowed=True,
                limit=limit,
                remaining=remaining,
                reset=window_seconds,
                retry_after=0,
            )
        else:
            # Over limit: Find oldest request in window to calculate retry_after
            oldest_items = await client.zrange(key, 0, 0, withscores=True)
            if oldest_items:
                oldest_timestamp = oldest_items[0][1]
                retry_after = max(1, int(oldest_timestamp + window_seconds - now) + 1)
            else:
                retry_after = max(1, window_seconds)

            return RateLimitResult(
                allowed=False,
                limit=limit,
                remaining=0,
                reset=retry_after,
                retry_after=retry_after,
            )

    except Exception as exc:
        # Graceful degradation / Fail-open: log warning without crashing user request
        logger.warning("Redis rate limit evaluation error; allowing request (fail-open)", error=str(exc))
        return RateLimitResult(
            allowed=True,
            limit=limit,
            remaining=limit,
            reset=window_seconds,
            retry_after=0,
        )


class RateLimiter:
    """
    FastAPI reusable dependency for enforcing sliding-window rate limits.
    Can be parameterized per endpoint tier.
    """

    def __init__(
        self,
        times: int = 20,
        seconds: int = 60,
        namespace: str = "default",
    ):
        self.times = times
        self.seconds = seconds
        self.namespace = namespace

    async def __call__(
        self,
        request: Request,
        response: Response,
        current_user: Optional[AuthenticatedUser] = Depends(get_optional_user),
    ) -> RateLimitResult:
        # Identify requester by user_id if authenticated, otherwise by IP
        if current_user and current_user.user_id:
            identifier = f"user:{current_user.user_id}"
        else:
            identifier = f"ip:{get_client_ip(request)}"

        key = f"rl:{self.namespace}:{identifier}"

        result = await check_sliding_window_rate_limit(
            key=key,
            limit=self.times,
            window_seconds=self.seconds,
        )

        # Inject rate limit headers onto response
        for header_name, header_value in result.to_headers().items():
            response.headers[header_name] = header_value

        if not result.allowed:
            logger.warn(
                "Rate limit exceeded",
                namespace=self.namespace,
                identifier=identifier,
                retry_after=result.retry_after,
            )
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=(
                    f"Rate limit exceeded. Maximum {result.limit} requests per "
                    f"{self.seconds} seconds. Please retry in {result.retry_after} seconds."
                ),
                headers=result.to_headers(),
            )

        return result
