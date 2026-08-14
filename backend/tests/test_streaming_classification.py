"""QPilot Backend - Streaming and Classification Tests."""

import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from app.services.llm_service import LLMService
from app.schemas.complaint import ComplaintExtraction
from app.schemas.classification import ComplaintClassification


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
async def test_extract_stream_yields_chunks(llm_service):
    """Test that streaming extraction yields chunks."""
    # Mock streaming response
    async def mock_stream():
        yield '{"complaint_source": "Phone",'
        yield ' "customer_name": "John"}'

    llm_service._call_llm_stream = MagicMock(return_value=mock_stream())

    chunks = []
    async for chunk in llm_service.extract_complaint_stream("Test complaint"):
        chunks.append(chunk)

    assert len(chunks) > 0
    full_response = "".join(chunks)
    assert "Phone" in full_response
    assert "John" in full_response


@pytest.mark.asyncio
async def test_classify_complaint_with_subcategory(llm_service):
    """Test classification returns subcategory when applicable."""
    mock_response = MagicMock()
    mock_response.choices = [MagicMock()]
    mock_response.choices[0].message.content = '{"category": "Product Quality", "subcategory": "Defective Product", "confidence": 0.9}'
    llm_service.client.chat.completions.create = AsyncMock(return_value=mock_response)

    extraction = ComplaintExtraction(product_name="Aspirin")
    result = await llm_service.classify_complaint("Test complaint", extraction)

    assert isinstance(result, ComplaintClassification)
    assert result.category == "Product Quality"
    assert result.subcategory == "Defective Product"
    assert result.confidence == 0.9


@pytest.mark.asyncio
async def test_classify_complaint_grounding(llm_service):
    """Test classification reasoning is grounded in complaint data."""
    mock_response = MagicMock()
    mock_response.choices = [MagicMock()]
    mock_response.choices[0].message.content = '{"category": "Packaging", "reasoning": "Complaint mentions damaged box", "confidence": 0.8}'
    llm_service.client.chat.completions.create = AsyncMock(return_value=mock_response)

    extraction = ComplaintExtraction(product_name="Aspirin")
    result = await llm_service.classify_complaint("Box arrived damaged", extraction)

    assert result.category == "Packaging"
    assert result.reasoning is not None
    assert "damaged" in result.reasoning.lower()


@pytest.mark.asyncio
async def test_classify_complaint_unknown_category(llm_service):
    """Test unknown category is handled gracefully."""
    mock_response = MagicMock()
    mock_response.choices = [MagicMock()]
    mock_response.choices[0].message.content = '{"category": "Unknown Category", "confidence": 0.3}'
    llm_service.client.chat.completions.create = AsyncMock(return_value=mock_response)

    extraction = ComplaintExtraction(product_name="Aspirin")
    result = await llm_service.classify_complaint("Something unusual", extraction)

    assert isinstance(result, ComplaintClassification)
    # Should still return a valid result
    assert result.category is not None


@pytest.mark.asyncio
async def test_chat_stream_yields_chunks(llm_service):
    """Test chat streaming yields chunks."""
    class MockStream:
        def __init__(self, chunks):
            self._chunks = chunks
            self._index = 0
        def __aiter__(self):
            return self
        async def __anext__(self):
            if self._index >= len(self._chunks):
                raise StopAsyncIteration
            chunk = self._chunks[self._index]
            self._index += 1
            return chunk

    mock_response = MagicMock()
    mock_response.choices = [MagicMock()]
    mock_response.choices[0].delta = MagicMock()
    mock_response.choices[0].delta.content = "Hello! How can I help?"

    llm_service.client.chat.completions.create = AsyncMock(
        return_value=MockStream([mock_response])
    )

    chunks = []
    async for chunk in llm_service.chat_stream([{"role": "user", "content": "Hi"}]):
        chunks.append(chunk)

    assert len(chunks) > 0
    full_response = "".join(chunks)
    assert "Hello" in full_response


@pytest.mark.asyncio
async def test_llm_timeout_error_handled(llm_service):
    """Test LLM timeout error is handled gracefully."""
    from openai import APITimeoutError

    llm_service.client.chat.completions.create = AsyncMock(
        side_effect=APITimeoutError(request=MagicMock())
    )

    with pytest.raises(Exception, match="timed out"):
        await llm_service.extract_complaint("Test complaint")


@pytest.mark.asyncio
async def test_llm_rate_limit_error_handled(llm_service):
    """Test LLM rate limit error is handled gracefully."""
    from openai import RateLimitError

    llm_service.client.chat.completions.create = AsyncMock(
        side_effect=RateLimitError(
            message="Rate limit exceeded",
            response=MagicMock(status_code=429, headers={}),
            body=None,
        )
    )

    with pytest.raises(Exception, match="Rate limit"):
        await llm_service.extract_complaint("Test complaint")
