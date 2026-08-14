"""QPilot Backend - LLM Service Tests."""

import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from app.services.llm_service import LLMService
from app.schemas.complaint import ComplaintExtraction
from app.schemas.classification import ComplaintClassification
from app.schemas.risk import RiskAssessment


@pytest.fixture
def llm_service():
    """Create LLM service instance."""
    with patch("app.services.llm_service.get_settings") as mock_settings:
        mock_settings.return_value = MagicMock(
            LLM_URL="http://localhost:11434/v1",
            LLM_API_KEY="ollama",
            LLM_MODEL_NAME="gemma4:31b-cloud",
        )
        service = LLMService()
        service.client = AsyncMock()
        return service


@pytest.mark.asyncio
async def test_extract_complaint_success(llm_service):
    """Test successful complaint extraction."""
    mock_response = MagicMock()
    mock_response.choices = [MagicMock()]
    mock_response.choices[0].message.content = '{"complaint_source": "Phone", "customer_name": "John"}'
    llm_service.client.chat.completions.create = AsyncMock(return_value=mock_response)

    result = await llm_service.extract_complaint("Test complaint")

    assert isinstance(result, ComplaintExtraction)
    assert result.complaint_source == "Phone"
    assert result.customer_name == "John"


@pytest.mark.asyncio
async def test_extract_complaint_invalid_json(llm_service):
    """Test extraction with invalid JSON response."""
    mock_response = MagicMock()
    mock_response.choices = [MagicMock()]
    mock_response.choices[0].message.content = "invalid json"
    llm_service.client.chat.completions.create = AsyncMock(return_value=mock_response)

    result = await llm_service.extract_complaint("Test complaint")

    assert isinstance(result, ComplaintExtraction)
    assert result.complaint_source is None


@pytest.mark.asyncio
async def test_classify_complaint_success(llm_service):
    """Test successful complaint classification."""
    mock_response = MagicMock()
    mock_response.choices = [MagicMock()]
    mock_response.choices[0].message.content = '{"category": "Product Quality", "confidence": 0.9}'
    llm_service.client.chat.completions.create = AsyncMock(return_value=mock_response)

    extraction = ComplaintExtraction(product_name="Aspirin")
    result = await llm_service.classify_complaint("Test complaint", extraction)

    assert isinstance(result, ComplaintClassification)
    assert result.category == "Product Quality"
    assert result.confidence == 0.9


@pytest.mark.asyncio
async def test_assess_risk_success(llm_service):
    """Test successful risk assessment."""
    mock_response = MagicMock()
    mock_response.choices = [MagicMock()]
    mock_response.choices[0].message.content = '{"overall_severity": "high", "risk_score": 0.8}'
    llm_service.client.chat.completions.create = AsyncMock(return_value=mock_response)

    extraction = ComplaintExtraction(product_name="Aspirin")
    classification = ComplaintClassification(category="Product Quality", confidence=0.9)
    result = await llm_service.assess_risk(extraction, classification)

    assert isinstance(result, RiskAssessment)
    assert result.overall_severity == "high"
    assert result.risk_score == 0.8


@pytest.mark.asyncio
async def test_chat_success(llm_service):
    """Test successful chat."""
    mock_response = MagicMock()
    mock_response.choices = [MagicMock()]
    mock_response.choices[0].message.content = "Hello! How can I help?"
    llm_service.client.chat.completions.create = AsyncMock(return_value=mock_response)

    messages = [{"role": "user", "content": "Hello"}]
    result = await llm_service.chat(messages)

    assert result == "Hello! How can I help?"


@pytest.mark.asyncio
async def test_chat_with_context(llm_service):
    """Test chat with context."""
    mock_response = MagicMock()
    mock_response.choices = [MagicMock()]
    mock_response.choices[0].message.content = "Based on the complaint data..."
    llm_service.client.chat.completions.create = AsyncMock(return_value=mock_response)

    messages = [{"role": "user", "content": "Tell me about this complaint"}]
    context = {"extraction": {"product_name": "Aspirin"}}
    result = await llm_service.chat(messages, context)

    assert "complaint data" in result
