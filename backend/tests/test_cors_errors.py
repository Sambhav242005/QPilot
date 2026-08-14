"""QPilot Backend - CORS and Error Format Tests."""

import pytest
from httpx import AsyncClient


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
    # Check for CORS headers
    assert "access-control-allow-origin" in response.headers or response.status_code == 204


@pytest.mark.asyncio
async def test_cors_preflight(client: AsyncClient):
    """Test CORS preflight request."""
    response = await client.options(
        "/api/v1/complaints",
        headers={
            "Origin": "http://localhost:3000",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "Content-Type",
        },
    )

    # Should handle preflight
    assert response.status_code in [200, 204]


@pytest.mark.asyncio
async def test_error_response_format(client: AsyncClient):
    """Test error responses follow consistent format."""
    # Test 404 error
    response = await client.get("/api/v1/complaints/nonexistent-id")
    assert response.status_code == 404
    data = response.json()
    assert "detail" in data


@pytest.mark.asyncio
async def test_validation_error_format(client: AsyncClient):
    """Test validation error responses."""
    # Test empty input validation
    response = await client.post(
        "/api/v1/complaints",
        json={"raw_input": "", "input_type": "text"},
    )
    assert response.status_code == 400
    data = response.json()
    assert "detail" in data


@pytest.mark.asyncio
async def test_method_not_allowed(client: AsyncClient):
    """Test method not allowed returns proper error."""
    response = await client.put("/api/v1/health")
    assert response.status_code == 405


@pytest.mark.asyncio
async def test_content_type_required(client: AsyncClient):
    """Test that content type is required for POST."""
    response = await client.post(
        "/api/v1/complaints",
        content="test",
        headers={"Content-Type": "text/plain"},
    )
    # Should reject non-JSON content
    assert response.status_code in [400, 415, 422]
