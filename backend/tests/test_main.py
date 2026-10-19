"""
DataSpeak Backend — Main Application & Top-Level Endpoints Tests
Verifies root ("/") and health check ("/health") endpoints.
"""

from __future__ import annotations

import pytest
from starlette.testclient import TestClient

from main import app


@pytest.fixture
def client():
    return TestClient(app)


def test_root_endpoint(client):
    """Test that GET / returns a 200 with welcome message and status."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "message" in data
    assert data["version"] == "0.1.0"


def test_health_endpoint(client):
    """Test that GET /health returns 200 with ok status and uptime."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "environment" in data
    assert "uptime_seconds" in data
