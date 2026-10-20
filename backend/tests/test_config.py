"""
DataSpeak Backend — Settings & Infrastructure Config Tests
Verifies that environment variables, rate limiting configuration,
and local docker-compose infrastructure definitions are sound.
"""

from __future__ import annotations

from pathlib import Path
import yaml

from app.core.config import Settings, get_settings


def test_settings_rate_limit_and_db_defaults():
    """Verify that Settings includes app db, redis, and rate limit properties."""
    settings = get_settings()

    assert hasattr(settings, "APP_DATABASE_URL")
    assert hasattr(settings, "REDIS_URL")
    assert hasattr(settings, "RATE_LIMIT_QUERY_PER_MINUTE")
    assert hasattr(settings, "RATE_LIMIT_GLOBAL_PER_MINUTE")
    assert hasattr(settings, "RATE_LIMIT_BURST_CAP")
    assert hasattr(settings, "RATE_LIMIT_ENABLED")

    assert settings.RATE_LIMIT_QUERY_PER_MINUTE > 0
    assert settings.RATE_LIMIT_GLOBAL_PER_MINUTE > 0
    assert settings.RATE_LIMIT_BURST_CAP > 0
    assert isinstance(settings.RATE_LIMIT_ENABLED, bool)
    assert "postgresql" in settings.APP_DATABASE_URL
    assert "redis" in settings.REDIS_URL


def test_docker_compose_structure():
    """Verify docker-compose.yml defines postgres and redis services with healthchecks."""
    compose_path = Path(__file__).resolve().parents[2] / "docker-compose.yml"
    assert compose_path.exists(), "docker-compose.yml must exist at project root"

    with open(compose_path, "r", encoding="utf-8") as f:
        compose_data = yaml.safe_load(f)

    services = compose_data.get("services", {})
    assert "postgres" in services, "postgres service must be defined"
    assert "redis" in services, "redis service must be defined"

    # Postgres config checks
    pg = services["postgres"]
    assert "5432:5432" in pg.get("ports", [])
    assert "healthcheck" in pg

    # Redis config checks
    rd = services["redis"]
    assert "6379:6379" in rd.get("ports", [])
    assert "healthcheck" in rd
