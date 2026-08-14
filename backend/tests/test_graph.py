"""QPilot Backend - Graph Workflow Tests."""

import pytest
from app.graph.state import ComplaintState
from app.graph.nodes.completeness import calculate_completeness


def test_complaint_state_initial():
    """Test initial complaint state."""
    state = ComplaintState()
    assert state.complaint_id == ""
    assert state.raw_input == ""
    assert state.status == "pending"
    assert state.current_step == "receive_input"
    assert state.extraction is None
    assert state.classification is None
    assert state.risk_assessment is None
    assert state.completeness is None


def test_complaint_state_with_data():
    """Test complaint state with data."""
    state = ComplaintState(
        complaint_id="test-123",
        raw_input="Test complaint",
        status="processing",
    )
    assert state.complaint_id == "test-123"
    assert state.raw_input == "Test complaint"
    assert state.status == "processing"


def test_calculate_completeness_empty():
    """Test completeness calculation with empty extraction."""
    result = calculate_completeness({})
    assert result["score"] == 0.0
    assert result["present_fields"] == 0
    assert len(result["missing_fields"]) > 0


def test_calculate_completeness_full():
    """Test completeness calculation with all fields present."""
    extraction = {
        "complaint_source": "Phone",
        "customer_name": "John Doe",
        "product_name": "Aspirin",
        "batch_lot_number": "B12345",
        "complaint_type": "Quality",
        "complaint_date": "2024-01-15",
        "detailed_description": "Product was defective",
        "product_strength_grade": "100mg",
        "manufacturing_date": "2024-01-01",
        "expiry_date": "2025-01-01",
        "quantity_affected": "100",
        "initial_severity": "high",
        "priority": "urgent",
    }
    result = calculate_completeness(extraction)
    assert result["score"] == 1.0
    assert result["present_fields"] == 13
    assert len(result["missing_fields"]) == 0


def test_calculate_completeness_partial():
    """Test completeness calculation with some fields present."""
    extraction = {
        "complaint_source": "Phone",
        "customer_name": "John Doe",
        "product_name": "Aspirin",
    }
    result = calculate_completeness(extraction)
    assert 0.0 < result["score"] < 1.0
    assert result["present_fields"] == 3
    assert len(result["missing_fields"]) > 0


def test_calculate_completeness_whitespace_only():
    """Test completeness calculation with whitespace-only fields."""
    extraction = {
        "complaint_source": "  ",
        "customer_name": "",
        "product_name": None,
    }
    result = calculate_completeness(extraction)
    assert result["score"] == 0.0
