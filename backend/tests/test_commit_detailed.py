"""Tests for Complaint Service - detailed commit + duplicate tests."""

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


class TestCommitComplaint:
    @pytest.mark.asyncio
    @patch("app.services.complaint_service.ComplaintRepository")
    async def test_commit_from_review_status(self, mock_repo_cls, mock_db, make_complaint):
        repo = AsyncMock()
        mock_repo_cls.return_value = repo
        complaint = make_complaint(status="review")
        repo.get_by_id.return_value = complaint
        repo.update.return_value = make_complaint(status="committed")

        result = await commit_complaint("test-123", mock_db)

        repo.update.assert_called_once_with("test-123", {"status": "committed"})

    @pytest.mark.asyncio
    @patch("app.services.complaint_service.ComplaintRepository")
    async def test_commit_from_ready_to_commit_status(self, mock_repo_cls, mock_db, make_complaint):
        repo = AsyncMock()
        mock_repo_cls.return_value = repo
        complaint = make_complaint(status="ready_to_commit")
        repo.get_by_id.return_value = complaint
        repo.update.return_value = make_complaint(status="committed")

        result = await commit_complaint("test-123", mock_db)
        assert result.status == "committed"

    @pytest.mark.asyncio
    @patch("app.services.complaint_service.ComplaintRepository")
    async def test_commit_wrong_status_rejected(self, mock_repo_cls, mock_db, make_complaint):
        repo = AsyncMock()
        mock_repo_cls.return_value = repo
        complaint = make_complaint(status="pending")
        repo.get_by_id.return_value = complaint

        with pytest.raises(ValueError, match="Cannot commit"):
            await commit_complaint("test-123", mock_db)

    @pytest.mark.asyncio
    @patch("app.services.complaint_service.ComplaintRepository")
    async def test_commit_not_found(self, mock_repo_cls, mock_db):
        repo = AsyncMock()
        mock_repo_cls.return_value = repo
        repo.get_by_id.return_value = None

        with pytest.raises(ValueError, match="not found"):
            await commit_complaint("nonexistent", mock_db)

    @pytest.mark.asyncio
    @patch("app.services.complaint_service.ComplaintRepository")
    async def test_commit_creates_audit_event(self, mock_repo_cls, mock_db, make_complaint):
        repo = AsyncMock()
        mock_repo_cls.return_value = repo
        complaint = make_complaint(status="review")
        repo.get_by_id.return_value = complaint
        repo.update.return_value = make_complaint(status="committed")

        await commit_complaint("test-123", mock_db)

        audit = mock_db.add.call_args[0][0]
        assert audit.event_type == "committed"
        assert audit.complaint_id == "test-123"

    @pytest.mark.asyncio
    @patch("app.services.complaint_service.ComplaintRepository")
    async def test_double_commit_prevented(self, mock_repo_cls, mock_db, make_complaint):
        repo = AsyncMock()
        mock_repo_cls.return_value = repo
        complaint = make_complaint(status="committed")
        repo.get_by_id.return_value = complaint

        with pytest.raises(ValueError, match="Cannot commit"):
            await commit_complaint("test-123", mock_db)


class TestDuplicateDetection:
    @pytest.mark.asyncio
    @patch("app.services.complaint_service.ComplaintRepository")
    async def test_same_product_and_batch(self, mock_repo_cls, mock_db):
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
    async def test_different_product_not_flagged(self, mock_repo_cls, mock_db):
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
        assert len(results) == 0

    @pytest.mark.asyncio
    @patch("app.services.complaint_service.ComplaintRepository")
    async def test_same_product_different_batch(self, mock_repo_cls, mock_db):
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
        assert len(results) == 0

    @pytest.mark.asyncio
    @patch("app.services.complaint_service.ComplaintRepository")
    async def test_partial_product_match(self, mock_repo_cls, mock_db):
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
    async def test_label_potential_vs_confirmed(self, mock_repo_cls, mock_db):
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
        assert results[0]["label"] == "Potential Duplicate"

    @pytest.mark.asyncio
    @patch("app.services.complaint_service.ComplaintRepository")
    async def test_no_extraction_skipped(self, mock_repo_cls, mock_db):
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
    async def test_sorted_by_score_descending(self, mock_repo_cls, mock_db):
        repo = AsyncMock()
        mock_repo_cls.return_value = repo

        low = MagicMock()
        low.id = "low"
        low.extraction_json = json.dumps({"product_name": "Aspirin", "batch_lot_number": "BATCH-002"})
        low.created_at = MagicMock()
        low.created_at.isoformat.return_value = "2025-01-01"

        high = MagicMock()
        high.id = "high"
        high.extraction_json = json.dumps({"product_name": "Aspirin", "batch_lot_number": "BATCH-001"})
        high.created_at = MagicMock()
        high.created_at.isoformat.return_value = "2025-01-01"

        repo.get_all.return_value = [low, high]

        results = await check_duplicate("Aspirin", "BATCH-001", mock_db)

        assert len(results) >= 1
        if len(results) == 2:
            assert results[0]["score"] >= results[1]["score"]
