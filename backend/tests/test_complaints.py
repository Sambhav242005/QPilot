"""QPilot Backend - Complaints API Tests."""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_get_complaints_empty(client: AsyncClient):
    """Test getting complaints returns empty list initially."""
    response = await client.get("/api/v1/complaints")

    assert response.status_code == 200
    data = response.json()
    assert "complaints" in data
    assert "total" in data


@pytest.mark.asyncio
async def test_create_complaint(client: AsyncClient):
    """Test creating a new complaint."""
    response = await client.post(
        "/api/v1/complaints",
        json={"raw_input": "Test complaint", "input_type": "text"},
    )

    assert response.status_code == 201
    data = response.json()
    assert data["raw_input"] == "Test complaint"
    assert data["status"] == "pending"
    assert "id" in data


@pytest.mark.asyncio
async def test_get_complaint_not_found(client: AsyncClient):
    """Test getting non-existent complaint returns 404."""
    response = await client.get("/api/v1/complaints/nonexistent")

    assert response.status_code == 404
