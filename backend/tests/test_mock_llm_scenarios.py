"""QPilot Backend - Mock LLM Scenario Tests."""

import json
import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from app.services.llm_service import LLMService
from app.schemas.complaint import ComplaintExtraction
from app.schemas.classification import ComplaintClassification
from app.schemas.risk import RiskAssessment


@pytest.fixture
def llm_service():
    with patch("app.services.llm_service.get_settings") as mock_settings:
        mock_settings.return_value = MagicMock(
            LLM_URL="http://localhost:11434/v1",
            LLM_API_KEY="ollama",
            LLM_MODEL_NAME="test-model",
        )
        service = LLMService()
        service.client = AsyncMock()
        return service


@pytest.mark.asyncio
async def test_mock_successful_extraction(llm_service):
    """Mock: full extraction with all fields."""
    data = {
        "complaint_source": "Pharmacy",
        "customer_name": "Apollo Pharmacy",
        "product_name": "Amoxicillin",
        "product_strength_grade": "500mg",
        "batch_lot_number": "BATCH-001",
        "manufacturing_date": "2025-01-01",
        "expiry_date": "2027-01-01",
        "quantity_affected": "48 capsules",
        "complaint_type": "Product Defect",
        "complaint_date": "2025-06-15",
        "detailed_description": "Discolored capsules",
        "initial_severity": "high",
        "priority": "urgent",
    }
    mock_response = MagicMock()
    mock_response.choices = [MagicMock()]
    mock_response.choices[0].message.content = json.dumps(data)
    llm_service.client.chat.completions.create = AsyncMock(return_value=mock_response)

    result = await llm_service.extract_complaint("Discolored capsules at Apollo Pharmacy")

    assert isinstance(result, ComplaintExtraction)
    assert result.complaint_source == "Pharmacy"
    assert result.customer_name == "Apollo Pharmacy"
    assert result.product_name == "Amoxicillin"
    assert result.batch_lot_number == "BATCH-001"


@pytest.mark.asyncio
async def test_mock_missing_fields_returns_null(llm_service):
    """Mock: missing fields return null, not hallucinated."""
    data = {
        "complaint_source": "Pharmacy",
        "customer_name": None,
        "product_name": "Aspirin",
        "batch_lot_number": None,
        "manufacturing_date": None,
        "expiry_date": None,
    }
    mock_response = MagicMock()
    mock_response.choices = [MagicMock()]
    mock_response.choices[0].message.content = json.dumps(data)
    llm_service.client.chat.completions.create = AsyncMock(return_value=mock_response)

    result = await llm_service.extract_complaint("Aspirin complaint")

    assert result.customer_name is None
    assert result.batch_lot_number is None
    assert result.manufacturing_date is None
    assert result.expiry_date is None


@pytest.mark.asyncio
async def test_mock_malformed_json(llm_service):
    """Mock: malformed JSON returns empty extraction."""
    mock_response = MagicMock()
    mock_response.choices = [MagicMock()]
    mock_response.choices[0].message.content = "not json at all {{{"
    llm_service.client.chat.completions.create = AsyncMock(return_value=mock_response)

    result = await llm_service.extract_complaint("Test")

    assert isinstance(result, ComplaintExtraction)
    assert result.complaint_source is None


@pytest.mark.asyncio
async def test_mock_timeout_error(llm_service):
    """Mock: timeout returns error."""
    from openai import APITimeoutError

    llm_service.client.chat.completions.create = AsyncMock(
        side_effect=APITimeoutError(request=MagicMock())
    )

    with pytest.raises(Exception, match="timed out"):
        await llm_service.extract_complaint("Test")


@pytest.mark.asyncio
async def test_mock_rate_limit_error(llm_service):
    """Mock: rate limit returns error."""
    from openai import RateLimitError

    llm_service.client.chat.completions.create = AsyncMock(
        side_effect=RateLimitError(
            message="rate limited",
            response=MagicMock(status_code=429, headers={}),
            body=None,
        )
    )

    with pytest.raises(Exception, match="Rate limit"):
        await llm_service.extract_complaint("Test")


@pytest.mark.asyncio
async def test_mock_classification_success(llm_service):
    """Mock: classification returns valid category."""
    data = {"category": "Product Quality", "subcategory": "Discoloration", "confidence": 0.9}
    mock_response = MagicMock()
    mock_response.choices = [MagicMock()]
    mock_response.choices[0].message.content = json.dumps(data)
    llm_service.client.chat.completions.create = AsyncMock(return_value=mock_response)

    extraction = ComplaintExtraction(product_name="Aspirin")
    result = await llm_service.classify_complaint("Discolored tablets", extraction)

    assert isinstance(result, ComplaintClassification)
    assert result.category == "Product Quality"


@pytest.mark.asyncio
async def test_mock_risk_assessment_success(llm_service):
    """Mock: risk assessment returns valid severity."""
    data = {
        "overall_severity": "high",
        "risk_score": 0.8,
        "risk_factors": [{"factor": "Product defect", "severity": "high", "reasoning": "Visual defect"}],
        "reasoning": "Discoloration indicates quality issue",
        "recommended_action": "Route to QA",
    }
    mock_response = MagicMock()
    mock_response.choices = [MagicMock()]
    mock_response.choices[0].message.content = json.dumps(data)
    llm_service.client.chat.completions.create = AsyncMock(return_value=mock_response)

    extraction = ComplaintExtraction(product_name="Aspirin")
    classification = ComplaintClassification(category="Product Quality")
    result = await llm_service.assess_risk(extraction, classification)

    assert isinstance(result, RiskAssessment)
    assert result.overall_severity == "high"
