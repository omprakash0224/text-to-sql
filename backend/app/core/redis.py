"""
DataSpeak Backend — Async Redis Connection Manager
Manages Redis connection pooling, SSL/TLS negotiation (Upstash in production),
health check pinging, and graceful fail-open resilience.
"""

from __future__ import annotations

import ssl
from typing import Optional
from redis.asyncio import ConnectionPool, Redis, from_url

from app.core.config import get_settings
from app.core.logging import get_logger

logger = get_logger("core.redis")

_redis_pool: Optional[ConnectionPool] = None
_redis_client: Optional[Redis] = None
_is_overridden: bool = False


def get_redis_client() -> Optional[Redis]:
    """Return the active Redis client, creating a lazy client if needed."""
    global _redis_client, _is_overridden
    if _is_overridden:
        return _redis_client

    if _redis_client is None:
        try:
            init_redis()
        except Exception as exc:
            logger.warning("Could not lazily initialize Redis client", error=str(exc))
            return None
    return _redis_client


def set_redis_client(client: Optional[Redis]) -> None:
    """Explicitly set or mock the Redis client (used in testing with fakeredis)."""
    global _redis_client, _is_overridden
    _redis_client = client
    _is_overridden = True


def reset_redis_client() -> None:
    """Reset the Redis client override to allow default auto-initialization."""
    global _redis_client, _is_overridden
    _redis_client = None
    _is_overridden = False


def init_redis(redis_url: Optional[str] = None) -> Optional[Redis]:
    """
    Initializes the Redis connection pool.
    Configures SSL for rediss:// (Upstash) and handles connection timeouts gracefully.
    """
    global _redis_pool, _redis_client

    settings = get_settings()
    url = (redis_url or settings.REDIS_URL).strip()

    if not url:
        logger.info("REDIS_URL not configured. Redis caching/rate-limiting disabled.")
        return None

    try:
        kwargs = {
            "decode_responses": True,
            "socket_connect_timeout": 2.0,
            "socket_timeout": 2.0,
            "retry_on_timeout": True,
            "max_connections": 20,
        }

        # Upstash / cloud TLS support
        if url.startswith("rediss://"):
            kwargs["ssl_cert_reqs"] = ssl.CERT_NONE

        _redis_client = from_url(url, **kwargs)
        logger.info("Redis client created successfully", url=url.split("@")[-1] if "@" in url else url)
        return _redis_client
    except Exception as exc:
        logger.warning("Failed to initialize Redis client; falling open", error=str(exc))
        _redis_client = None
        return None


async def close_redis() -> None:
    """Gracefully close Redis connection pool during application shutdown."""
    global _redis_pool, _redis_client
    if _redis_client is not None:
        try:
            await _redis_client.aclose()
            logger.info("Redis connection closed")
        except Exception as exc:
            logger.warning("Error while closing Redis connection", error=str(exc))
        finally:
            _redis_client = None
            _redis_pool = None


async def ping_redis() -> bool:
    """Test Redis connectivity with a ping command."""
    client = get_redis_client()
    if client is None:
        return False
    try:
        res = await client.ping()
        return bool(res)
    except Exception as exc:
        logger.warning("Redis ping failed", error=str(exc))
        return False
