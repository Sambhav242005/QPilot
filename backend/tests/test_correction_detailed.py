"""Tests for Correction Service - detailed unit tests."""

import json
import pytest
from unittest.mock import AsyncMock, MagicMock, patch, ANY

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
        "complaint_type": "Product Defect",
    })
    complaint.classification_json = json.dumps({"category": "Product Defect"})
    complaint.risk_assessment_json = json.dumps({"severity": "major"})
    complaint.completeness_json = json.dumps({"score": 0.8})
    return repo, complaint


@pytest.mark.asyncio
@patch("app.services.correction_service.ComplaintRepository")
@patch("app.services.correction_service.correction_workflow")
async def test_single_field_correction(mock_workflow, mock_repo_cls, mock_db, mock_repo):
    """Test correcting a single field."""
    repo, complaint = mock_repo
    mock_repo_cls.return_value = repo
    repo.get_by_id.return_value = complaint

    final_state = {
        "extraction": {"product_name": "Aspirin", "batch_lot_number": "BATCH-999"},
        "classification": {"category": "Product Defect"},
        "risk_assessment": {"severity": "major"},
        "completeness": {"score": 0.8},
    }
    mock_workflow.ainvoke = AsyncMock(return_value=final_state)
    repo.update.return_value = complaint

    result = await apply_correction("test-123", "Batch is actually BATCH-999", mock_db)

    repo.update.assert_called_once()
    update_data = repo.update.call_args[0][1]
    assert "extraction_json" in update_data


@pytest.mark.asyncio
@patch("app.services.correction_service.ComplaintRepository")
@patch("app.services.correction_service.correction_workflow")
async def test_multiple_fields_correction(mock_workflow, mock_repo_cls, mock_db, mock_repo):
    """Test correcting multiple fields in one message."""
    repo, complaint = mock_repo
    mock_repo_cls.return_value = repo
    repo.get_by_id.return_value = complaint

    final_state = {
        "extraction": {
            "product_name": "Ibuprofen",
            "batch_lot_number": "BATCH-NEW",
            "customer_name": "New Customer",
        },
        "classification": {"category": "Product Defect"},
        "risk_assessment": {"severity": "critical"},
        "completeness": {"score": 0.9},
    }
    mock_workflow.ainvoke = AsyncMock(return_value=final_state)
    repo.update.return_value = complaint

    result = await apply_correction(
        "test-123",
        "Product is Ibuprofen not Aspirin, batch is BATCH-NEW, customer is New Customer",
        mock_db,
    )

    repo.update.assert_called_once()


@pytest.mark.asyncio
@patch("app.services.correction_service.ComplaintRepository")
@patch("app.services.correction_service.correction_workflow")
async def test_correction_triggers_reclassification(mock_workflow, mock_repo_cls, mock_db, mock_repo):
    """Test that correction workflow re-runs classification."""
    repo, complaint = mock_repo
    mock_repo_cls.return_value = repo
    repo.get_by_id.return_value = complaint

    final_state = {
        "extraction": {"product_name": "Aspirin"},
        "classification": {"category": "Packaging"},  # Changed category
        "risk_assessment": {"severity": "low"},
        "completeness": {"score": 0.7},
    }
    mock_workflow.ainvoke = AsyncMock(return_value=final_state)
    repo.update.return_value = complaint

    result = await apply_correction("test-123", "Actually this is a packaging issue", mock_db)

    # Verify workflow was called (which re-runs classification)
    mock_workflow.ainvoke.assert_called_once()


@pytest.mark.asyncio
@patch("app.services.correction_service.ComplaintRepository")
@patch("app.services.correction_service.correction_workflow")
async def test_unrelated_fields_unchanged(mock_workflow, mock_repo_cls, mock_db, mock_repo):
    """Test that unrelated fields remain unchanged."""
    repo, complaint = mock_repo
    mock_repo_cls.return_value = repo
    repo.get_by_id.return_value = complaint

    # Only batch changes, other fields stay same
    final_state = {
        "extraction": {
            "product_name": "Aspirin",  # unchanged
            "batch_lot_number": "BATCH-NEW",  # changed
            "customer_name": "Test Customer",  # unchanged
        },
        "classification": {"category": "Product Defect"},
        "risk_assessment": {"severity": "major"},
        "completeness": {"score": 0.8},
    }
    mock_workflow.ainvoke = AsyncMock(return_value=final_state)
    repo.update.return_value = complaint

    result = await apply_correction("test-123", "Batch is BATCH-NEW", mock_db)

    # Workflow receives original state + correction
    call_args = mock_workflow.ainvoke.call_args[0][0]
    assert call_args.raw_input == "Product arrived broken"


@pytest.mark.asyncio
@patch("app.services.correction_service.ComplaintRepository")
@patch("app.services.correction_service.correction_workflow")
async def test_correction_does_not_create_new_complaint(mock_workflow, mock_repo_cls, mock_db, mock_repo):
    """Test that corrections update existing complaint, not create new."""
    repo, complaint = mock_repo
    mock_repo_cls.return_value = repo
    repo.get_by_id.return_value = complaint

    final_state = {
        "extraction": {"product_name": "Updated"},
        "classification": {"category": "Product Defect"},
        "risk_assessment": {"severity": "major"},
        "completeness": {"score": 0.8},
    }
    mock_workflow.ainvoke = AsyncMock(return_value=final_state)
    repo.update.return_value = complaint

    await apply_correction("test-123", "Fix this", mock_db)

    # Should call update, not create
    repo.update.assert_called_once_with("test-123", ANY)
    repo.create.assert_not_called()


@pytest.mark.asyncio
@patch("app.services.correction_service.ComplaintRepository")
@patch("app.services.correction_service.correction_workflow")
async def test_correction_creates_audit_event(mock_workflow, mock_repo_cls, mock_db, mock_repo):
    """Test that correction creates audit event."""
    repo, complaint = mock_repo
    mock_repo_cls.return_value = repo
    repo.get_by_id.return_value = complaint

    final_state = {
        "extraction": {"product_name": "Aspirin"},
        "classification": {"category": "Product Defect"},
        "risk_assessment": {"severity": "major"},
        "completeness": {"score": 0.8},
    }
    mock_workflow.ainvoke = AsyncMock(return_value=final_state)
    repo.update.return_value = complaint

    await apply_correction("test-123", "Update product", mock_db)

    audit = mock_db.add.call_args[0][0]
    assert audit.event_type == "correction_applied"
    assert audit.complaint_id == "test-123"
