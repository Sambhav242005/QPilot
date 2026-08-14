"""Tests for AI hallucination - ambiguous and contradictory input."""

import json
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from app.services.llm_service import LLMService
from app.schemas.complaint import ComplaintExtraction


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
async def test_ambiguous_input_returns_null_not_guessed(llm_service):
    """Ambiguous input should return null for unclear fields."""
    mock_response = MagicMock()
    mock_response.choices = [MagicMock()]
    # LLM correctly returns null for ambiguous info
    mock_response.choices[0].message.content = json.dumps({
        "product_name": None,
        "batch_lot_number": None,
        "detailed_description": "Something went wrong with the order",
    })
    llm_service.client.chat.completions.create = AsyncMock(return_value=mock_response)

    result = await llm_service.extract_complaint("Something went wrong with the order")

    # Should not guess product or batch from vague input
    assert result.product_name is None
    assert result.batch_lot_number is None


@pytest.mark.asyncio
async def test_contradictory_input_handled(llm_service):
    """Contradictory input should not crash the system."""
    mock_response = MagicMock()
    mock_response.choices = [MagicMock()]
    # LLM returns whatever it can extract from contradictory text
    mock_response.choices[0].message.content = json.dumps({
        "product_name": "Aspirin",
        "detailed_description": "The Ibuprofen was broken",
    })
    llm_service.client.chat.completions.create = AsyncMock(return_value=mock_response)

    result = await llm_service.extract_complaint("The Aspirin Ibuprofen was broken")

    # Should not crash, returns what it can
    assert isinstance(result, ComplaintExtraction)


@pytest.mark.asyncio
async def test_empty_input_returns_empty(llm_service):
    """Empty input should return empty extraction."""
    mock_response = MagicMock()
    mock_response.choices = [MagicMock()]
    mock_response.choices[0].message.content = json.dumps({})
    llm_service.client.chat.completions.create = AsyncMock(return_value=mock_response)

    result = await llm_service.extract_complaint("")

    assert isinstance(result, ComplaintExtraction)
    assert result.product_name is None
    assert result.customer_name is None


@pytest.mark.asyncio
async def test_non_complaint_text_handled(llm_service):
    """Non-complaint text should not crash extraction."""
    mock_response = MagicMock()
    mock_response.choices = [MagicMock()]
    mock_response.choices[0].message.content = json.dumps({
        "detailed_description": "Hello, how are you today?",
    })
    llm_service.client.chat.completions.create = AsyncMock(return_value=mock_response)

    result = await llm_service.extract_complaint("Hello, how are you today?")

    assert isinstance(result, ComplaintExtraction)
