"""QPilot Backend - API Integration Tests."""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_health_endpoint(client: AsyncClient):
    """Test health endpoint."""
    response = await client.get("/api/v1/health")

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"


@pytest.mark.asyncio
async def test_create_and_get_complaint(client: AsyncClient):
    """Test creating and retrieving a complaint."""
    # Create
    create_response = await client.post(
        "/api/v1/complaints",
        json={"raw_input": "Test complaint text", "input_type": "text"},
    )
    assert create_response.status_code == 201
    complaint_id = create_response.json()["id"]

    # Get
    get_response = await client.get(f"/api/v1/complaints/{complaint_id}")
    assert get_response.status_code == 200
    assert get_response.json()["id"] == complaint_id


@pytest.mark.asyncio
async def test_get_complaints_list(client: AsyncClient):
    """Test getting list of complaints."""
    response = await client.get("/api/v1/complaints")

    assert response.status_code == 200
    data = response.json()
    assert "complaints" in data
    assert "total" in data


@pytest.mark.asyncio
async def test_update_complaint(client: AsyncClient):
    """Test updating a complaint."""
    # Create
    create_response = await client.post(
        "/api/v1/complaints",
        json={"raw_input": "Original text", "input_type": "text"},
    )
    complaint_id = create_response.json()["id"]

    # Update
    update_response = await client.patch(
        f"/api/v1/complaints/{complaint_id}",
        json={"fields": {"status": "processing"}},
    )
    assert update_response.status_code == 200
    assert update_response.json()["status"] == "processing"


@pytest.mark.asyncio
async def test_delete_complaint(client: AsyncClient):
    """Test deleting a complaint."""
    # Create
    create_response = await client.post(
        "/api/v1/complaints",
        json={"raw_input": "To be deleted", "input_type": "text"},
    )
    complaint_id = create_response.json()["id"]

    # Delete
    delete_response = await client.delete(f"/api/v1/complaints/{complaint_id}")
    assert delete_response.status_code == 204

    # Verify deleted
    get_response = await client.get(f"/api/v1/complaints/{complaint_id}")
    assert get_response.status_code == 404


@pytest.mark.asyncio
async def test_commit_complaint(client: AsyncClient):
    """Test committing a complaint."""
    # Create
    create_response = await client.post(
        "/api/v1/complaints",
        json={"raw_input": "To be committed", "input_type": "text"},
    )
    complaint_id = create_response.json()["id"]

    # Set to review status
    await client.patch(
        f"/api/v1/complaints/{complaint_id}",
        json={"fields": {"status": "review"}},
    )

    # Commit
    commit_response = await client.post(f"/api/v1/complaints/{complaint_id}/commit")
    assert commit_response.status_code == 200
    assert commit_response.json()["success"] is True


@pytest.mark.asyncio
async def test_commit_complaint_wrong_status(client: AsyncClient):
    """Test committing a complaint with wrong status fails."""
    # Create
    create_response = await client.post(
        "/api/v1/complaints",
        json={"raw_input": "Pending complaint", "input_type": "text"},
    )
    complaint_id = create_response.json()["id"]

    # Try to commit (status is pending, not review)
    commit_response = await client.post(f"/api/v1/complaints/{complaint_id}/commit")
    assert commit_response.status_code == 409


@pytest.mark.asyncio
async def test_get_complaint_not_found(client: AsyncClient):
    """Test getting non-existent complaint returns 404."""
    response = await client.get("/api/v1/complaints/nonexistent-id")

    assert response.status_code == 404


@pytest.mark.asyncio
async def test_initialize_database(client: AsyncClient):
    """Test database initialization endpoint."""
    response = await client.post("/api/v1/complaints/initialize-db")

    assert response.status_code == 200
    assert response.json()["status"] == "success"
