"""Tests for Correction Service."""

import json
import pytest
from unittest.mock import AsyncMock, MagicMock, patch

from app.services.correction_service import apply_correction


@pytest.fixture
def mock_db():
    db = AsyncMock()
    db.add = MagicMock()
    db.commit = AsyncMock()
    return db


@pytest.fixture
def mock_repo():
    repo = AsyncMock()
    complaint = MagicMock()
    complaint.id = "test-123"
    complaint.raw_input = "Product arrived broken"
    complaint.input_type = "text"
    complaint.status = "review"
    complaint.extraction_json = json.dumps({
        "product_name": "Aspirin",
        "batch_lot_number": "BATCH-001",
        "customer_name": "Test Customer",
    })
    complaint.classification_json = json.dumps({"category": "product_defect"})
    complaint.risk_assessment_json = json.dumps({"severity": "major"})
    complaint.completeness_json = json.dumps({"score": 0.8})
    return repo, complaint


@pytest.mark.asyncio
@patch("app.services.correction_service.ComplaintRepository")
@patch("app.services.correction_service.correction_workflow")
async def test_apply_correction_updates_fields(mock_workflow, mock_repo_cls, mock_db, mock_repo):
    repo, complaint = mock_repo
    mock_repo_cls.return_value = repo
    repo.get_by_id.return_value = complaint

    # Mock workflow result
    final_state = {
        "extraction": {"product_name": "Aspirin", "batch_lot_number": "BATCH-002"},
        "classification": {"category": "product_defect"},
        "risk_assessment": {"severity": "critical"},
        "completeness": {"score": 0.9},
    }
    mock_workflow.ainvoke = AsyncMock(return_value=final_state)
    repo.update.return_value = complaint

    result = await apply_correction("test-123", "Change batch to BATCH-002", mock_db)

    repo.update.assert_called_once()
    mock_db.add.assert_called_once()
    mock_db.commit.assert_called_once()


@pytest.mark.asyncio
@patch("app.services.correction_service.ComplaintRepository")
async def test_apply_correction_complaint_not_found(mock_repo_cls, mock_db):
    mock_repo_cls.return_value = AsyncMock()
    mock_repo_cls.return_value.get_by_id.return_value = None

    with pytest.raises(ValueError, match="not found"):
        await apply_correction("nonexistent", "fix this", mock_db)


@pytest.mark.asyncio
@patch("app.services.correction_service.ComplaintRepository")
@patch("app.services.correction_service.correction_workflow")
async def test_apply_correction_creates_audit_event(mock_workflow, mock_repo_cls, mock_db, mock_repo):
    repo, complaint = mock_repo
    mock_repo_cls.return_value = repo
    repo.get_by_id.return_value = complaint
    mock_workflow.ainvoke = AsyncMock(return_value={
        "extraction": {"product_name": "Updated"},
        "classification": {"category": "product_defect"},
        "risk_assessment": {"severity": "major"},
        "completeness": {"score": 0.7},
    })
    repo.update.return_value = complaint

    await apply_correction("test-123", "Update product name", mock_db)

    # Verify audit event was added
    audit_call = mock_db.add.call_args[0][0]
    assert audit_call.event_type == "correction_applied"
    assert "correction" in audit_call.details
