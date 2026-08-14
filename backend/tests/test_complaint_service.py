"""Tests for Complaint Service (commit + duplicate detection)."""

import json
import pytest
from unittest.mock import AsyncMock, MagicMock, patch

from app.services.complaint_service import commit_complaint, check_duplicate


@pytest.fixture
def mock_db():
    db = AsyncMock()
    db.add = MagicMock()
    db.commit = AsyncMock()
    return db


@pytest.fixture
def make_complaint():
    def _make(status="review", extraction=None):
        c = MagicMock()
        c.id = "test-123"
        c.status = status
        c.raw_input = "Test complaint"
        c.extraction_json = json.dumps(extraction) if extraction else None
        c.classification_json = None
        c.risk_assessment_json = None
        c.completeness_json = None
        c.created_at = MagicMock()
        c.created_at.isoformat.return_value = "2025-01-01T00:00:00"
        return c
    return _make


# ── Commit Tests ────────────────────────────────────────────────────


@pytest.mark.asyncio
@patch("app.services.complaint_service.ComplaintRepository")
async def test_commit_complaint_success(mock_repo_cls, mock_db, make_complaint):
    repo = AsyncMock()
    mock_repo_cls.return_value = repo
    complaint = make_complaint(status="review")
    repo.get_by_id.return_value = complaint
    committed = make_complaint(status="committed")
    repo.update.return_value = committed

    result = await commit_complaint("test-123", mock_db)

    repo.update.assert_called_once_with("test-123", {"status": "committed"})
    mock_db.add.assert_called_once()
    mock_db.commit.assert_called_once()


@pytest.mark.asyncio
@patch("app.services.complaint_service.ComplaintRepository")
async def test_commit_complaint_ready_to_commit_status(mock_repo_cls, mock_db, make_complaint):
    repo = AsyncMock()
    mock_repo_cls.return_value = repo
    complaint = make_complaint(status="ready_to_commit")
    repo.get_by_id.return_value = complaint
    repo.update.return_value = make_complaint(status="committed")

    result = await commit_complaint("test-123", mock_db)
    assert result.status == "committed"


@pytest.mark.asyncio
@patch("app.services.complaint_service.ComplaintRepository")
async def test_commit_complaint_wrong_status(mock_repo_cls, mock_db, make_complaint):
    repo = AsyncMock()
    mock_repo_cls.return_value = repo
    complaint = make_complaint(status="pending")
    repo.get_by_id.return_value = complaint

    with pytest.raises(ValueError, match="Cannot commit"):
        await commit_complaint("test-123", mock_db)


@pytest.mark.asyncio
@patch("app.services.complaint_service.ComplaintRepository")
async def test_commit_complaint_not_found(mock_repo_cls, mock_db):
    repo = AsyncMock()
    mock_repo_cls.return_value = repo
    repo.get_by_id.return_value = None

    with pytest.raises(ValueError, match="not found"):
        await commit_complaint("nonexistent", mock_db)


@pytest.mark.asyncio
@patch("app.services.complaint_service.ComplaintRepository")
async def test_commit_creates_audit_event(mock_repo_cls, mock_db, make_complaint):
    repo = AsyncMock()
    mock_repo_cls.return_value = repo
    complaint = make_complaint(status="review")
    repo.get_by_id.return_value = complaint
    repo.update.return_value = make_complaint(status="committed")

    await commit_complaint("test-123", mock_db)

    audit = mock_db.add.call_args[0][0]
    assert audit.event_type == "committed"
    assert audit.complaint_id == "test-123"


# ── Duplicate Detection Tests ────────────────────────────────────────


@pytest.mark.asyncio
@patch("app.services.complaint_service.ComplaintRepository")
async def test_check_duplicate_same_product_and_batch(mock_repo_cls, mock_db):
    repo = AsyncMock()
    mock_repo_cls.return_value = repo

    existing = MagicMock()
    existing.id = "existing-1"
    existing.extraction_json = json.dumps({
        "product_name": "Aspirin 200mg",
        "batch_lot_number": "BATCH-001",
    })
    existing.created_at = MagicMock()
    existing.created_at.isoformat.return_value = "2025-01-01"

    repo.get_all.return_value = [existing]

    results = await check_duplicate("Aspirin 200mg", "BATCH-001", mock_db)

    assert len(results) == 1
    assert results[0]["score"] == 1.0
    assert results[0]["label"] == "Confirmed Match"
    assert "exact_product_match" in results[0]["reasons"]
    assert "exact_batch_match" in results[0]["reasons"]


@pytest.mark.asyncio
@patch("app.services.complaint_service.ComplaintRepository")
async def test_check_duplicate_different_product(mock_repo_cls, mock_db):
    repo = AsyncMock()
    mock_repo_cls.return_value = repo

    existing = MagicMock()
    existing.id = "existing-1"
    existing.extraction_json = json.dumps({
        "product_name": "Ibuprofen",
        "batch_lot_number": "BATCH-001",
    })

    repo.get_all.return_value = [existing]

    results = await check_duplicate("Aspirin", "BATCH-001", mock_db)

    # Different product, same batch — should not match on product filter
    assert len(results) == 0


@pytest.mark.asyncio
@patch("app.services.complaint_service.ComplaintRepository")
async def test_check_duplicate_same_product_different_batch(mock_repo_cls, mock_db):
    repo = AsyncMock()
    mock_repo_cls.return_value = repo

    existing = MagicMock()
    existing.id = "existing-1"
    existing.extraction_json = json.dumps({
        "product_name": "Aspirin 200mg",
        "batch_lot_number": "BATCH-002",
    })

    repo.get_all.return_value = [existing]

    results = await check_duplicate("Aspirin 200mg", "BATCH-001", mock_db)

    # Same product but different batch — filtered out by batch check
    assert len(results) == 0


@pytest.mark.asyncio
@patch("app.services.complaint_service.ComplaintRepository")
async def test_check_duplicate_no_extraction(mock_repo_cls, mock_db):
    repo = AsyncMock()
    mock_repo_cls.return_value = repo

    existing = MagicMock()
    existing.id = "existing-1"
    existing.extraction_json = None

    repo.get_all.return_value = [existing]

    results = await check_duplicate("Aspirin", "BATCH-001", mock_db)
    assert len(results) == 0


@pytest.mark.asyncio
@patch("app.services.complaint_service.ComplaintRepository")
async def test_check_duplicate_partial_product_match(mock_repo_cls, mock_db):
    repo = AsyncMock()
    mock_repo_cls.return_value = repo

    existing = MagicMock()
    existing.id = "existing-1"
    existing.extraction_json = json.dumps({
        "product_name": "Aspirin 200mg Tablets",
        "batch_lot_number": "BATCH-001",
    })

    repo.get_all.return_value = [existing]

    results = await check_duplicate("Aspirin", "BATCH-001", mock_db)

    assert len(results) == 1
    assert results[0]["score"] == 0.8
    assert "partial_product_match" in results[0]["reasons"]


@pytest.mark.asyncio
@patch("app.services.complaint_service.ComplaintRepository")
async def test_check_duplicate_label_potential(mock_repo_cls, mock_db):
    repo = AsyncMock()
    mock_repo_cls.return_value = repo

    existing = MagicMock()
    existing.id = "existing-1"
    existing.extraction_json = json.dumps({
        "product_name": "Aspirin 200mg Tablets",
        "batch_lot_number": "BATCH-001",
    })

    repo.get_all.return_value = [existing]

    results = await check_duplicate("Aspirin", "BATCH-001", mock_db)

    # 0.3 (partial product) + 0.5 (exact batch) = 0.8 → Potential Duplicate
    assert results[0]["label"] == "Potential Duplicate"
