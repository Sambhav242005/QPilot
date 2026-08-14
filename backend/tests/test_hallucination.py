"""QPilot Backend - AI Hallucination Tests."""

import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from app.services.llm_service import LLMService
from app.schemas.complaint import ComplaintExtraction
from app.graph.nodes.completeness import calculate_completeness


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
async def test_missing_batch_returns_null(llm_service):
    """Test that missing batch number returns null, not invented."""
    mock_response = MagicMock()
    mock_response.choices = [MagicMock()]
    # LLM might return null for missing fields
    mock_response.choices[0].message.content = '{"batch_lot_number": null}'
    llm_service.client.chat.completions.create = AsyncMock(return_value=mock_response)

    result = await llm_service.extract_complaint("Complaint without batch number")

    # Should not invent a batch number
    assert result.batch_lot_number is None


@pytest.mark.asyncio
async def test_missing_dates_returns_null(llm_service):
    """Test that missing dates return null, not fake dates."""
    mock_response = MagicMock()
    mock_response.choices = [MagicMock()]
    mock_response.choices[0].message.content = '{"manufacturing_date": null, "expiry_date": null}'
    llm_service.client.chat.completions.create = AsyncMock(return_value=mock_response)

    result = await llm_service.extract_complaint("Complaint without dates")

    assert result.manufacturing_date is None
    assert result.expiry_date is None


@pytest.mark.asyncio
async def test_missing_quantity_returns_null(llm_service):
    """Test that missing quantity returns null, not guessed."""
    mock_response = MagicMock()
    mock_response.choices = [MagicMock()]
    mock_response.choices[0].message.content = '{"quantity_affected": null}'
    llm_service.client.chat.completions.create = AsyncMock(return_value=mock_response)

    result = await llm_service.extract_complaint("Complaint without quantity")

    assert result.quantity_affected is None


@pytest.mark.asyncio
async def test_malformed_llm_output_handled(llm_service):
    """Test that malformed LLM output is caught by validation."""
    mock_response = MagicMock()
    mock_response.choices = [MagicMock()]
    mock_response.choices[0].message.content = "This is not JSON"
    llm_service.client.chat.completions.create = AsyncMock(return_value=mock_response)

    result = await llm_service.extract_complaint("Test complaint")

    # Should return empty extraction, not crash
    assert isinstance(result, ComplaintExtraction)


@pytest.mark.asyncio
async def test_wrong_types_handled(llm_service):
    """Test that wrong types in LLM output are handled."""
    mock_response = MagicMock()
    mock_response.choices = [MagicMock()]
    # Return number instead of string
    mock_response.choices[0].message.content = '{"complaint_source": 123}'
    llm_service.client.chat.completions.create = AsyncMock(return_value=mock_response)

    result = await llm_service.extract_complaint("Test complaint")

    # Should handle gracefully
    assert isinstance(result, ComplaintExtraction)


def test_completeness_deterministic():
    """Test that completeness calculation is deterministic."""
    extraction = {
        "complaint_source": "Phone",
        "customer_name": "John Doe",
        "product_name": "Aspirin",
    }

    # Run multiple times
    results = [calculate_completeness(extraction) for _ in range(10)]

    # All results should be identical
    for result in results[1:]:
        assert result == results[0]


def test_completeness_no_false_positives():
    """Test that completeness doesn't count empty fields as present."""
    extraction = {
        "complaint_source": "",
        "customer_name": "  ",
        "product_name": None,
    }

    result = calculate_completeness(extraction)

    assert result["present_fields"] == 0
    assert result["score"] == 0.0
