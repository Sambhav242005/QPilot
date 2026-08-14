"""QPilot Backend - Security Tests."""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_api_key_not_exposed(client: AsyncClient):
    """Test that API keys are not exposed in responses."""
    response = await client.get("/api/v1/health")

    # Health endpoint should not expose any sensitive data
    assert response.status_code == 200
    data = response.json()
    assert "api_key" not in data
    assert "LLM_API_KEY" not in str(data)


@pytest.mark.asyncio
async def test_env_not_in_response(client: AsyncClient):
    """Test that environment variables are not exposed."""
    response = await client.get("/api/v1/health")

    assert response.status_code == 200
    # Should not expose database URL or other env vars
    response_text = str(response.json())
    assert "postgresql://" not in response_text
    assert "sqlite://" not in response_text


@pytest.mark.asyncio
async def test_input_validation_empty(client: AsyncClient):
    """Test that empty input is rejected."""
    response = await client.post(
        "/api/v1/complaints",
        json={"raw_input": "", "input_type": "text"},
    )

    # Should reject empty input
    assert response.status_code in [400, 422]


@pytest.mark.asyncio
async def test_input_validation_long_input(client: AsyncClient):
    """Test that extremely long input is handled."""
    long_input = "x" * 100000  # 100KB
    response = await client.post(
        "/api/v1/complaints",
        json={"raw_input": long_input, "input_type": "text"},
    )

    # Should either accept or reject based on size limits
    assert response.status_code in [201, 400, 413, 422]


@pytest.mark.asyncio
async def test_sql_injection_attempt(client: AsyncClient):
    """Test that SQL injection is prevented."""
    response = await client.post(
        "/api/v1/complaints",
        json={
            "raw_input": "'; DROP TABLE complaints; --",
            "input_type": "text",
        },
    )

    # Should handle safely
    assert response.status_code in [201, 400, 422]

    # Verify table still exists
    list_response = await client.get("/api/v1/complaints")
    assert list_response.status_code == 200


@pytest.mark.asyncio
async def test_path_traversal_attempt(client: AsyncClient):
    """Test that path traversal is prevented."""
    response = await client.get("/api/v1/complaints/../../../etc/passwd")

    # Should not expose system files
    assert response.status_code in [400, 404, 422]


@pytest.mark.asyncio
async def test_cors_headers(client: AsyncClient):
    """Test CORS headers are set correctly."""
    response = await client.options(
        "/api/v1/health",
        headers={
            "Origin": "http://localhost:3000",
            "Access-Control-Request-Method": "GET",
        },
    )

    # Should allow CORS from configured origins
    assert response.status_code in [200, 204]
