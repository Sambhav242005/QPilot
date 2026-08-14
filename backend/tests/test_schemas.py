"""QPilot Backend - Schema Validation Tests."""

import pytest
from pydantic import ValidationError

from app.schemas.classification import ComplaintClassification
from app.schemas.completeness import CompletenessResult
from app.schemas.complaint import ComplaintExtraction
from app.schemas.risk import RiskAssessment, RiskFactor


def test_complaint_extraction_valid():
    """Test valid complaint extraction."""
    extraction = ComplaintExtraction(
        complaint_source="Phone",
        customer_name="John Doe",
        product_name="Aspirin",
    )
    assert extraction.complaint_source == "Phone"
    assert extraction.customer_name == "John Doe"
    assert extraction.product_name == "Aspirin"


def test_complaint_extraction_optional_fields():
    """Test extraction with optional fields."""
    extraction = ComplaintExtraction()
    assert extraction.complaint_source is None
    assert extraction.customer_name is None
    assert extraction.completeness_score == 0.0


def test_risk_assessment_valid():
    """Test valid risk assessment."""
    risk = RiskAssessment(
        overall_severity="high",
        risk_score=0.8,
        risk_factors=[
            RiskFactor(factor="Batch issue", severity="high", reasoning="Related to batch")
        ],
    )
    assert risk.overall_severity == "high"
    assert risk.risk_score == 0.8
    assert len(risk.risk_factors) == 1


def test_classification_valid():
    """Test valid classification."""
    classification = ComplaintClassification(
        category="Product Quality",
        subcategory="Contamination",
        confidence=0.9,
    )
    assert classification.category == "Product Quality"
    assert classification.confidence == 0.9


def test_completeness_result():
    """Test completeness result."""
    result = CompletenessResult(
        score=0.75,
        total_fields=8,
        present_fields=6,
        missing_fields=["batch_lot_number", "expiry_date"],
    )
    assert result.score == 0.75
    assert result.missing_fields == ["batch_lot_number", "expiry_date"]
