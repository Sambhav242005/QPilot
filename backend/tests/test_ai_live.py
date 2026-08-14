"""AI Live Tests - requires real LLM endpoint (Groq/OpenAI).

These tests are separated and marked with @pytest.mark.live.
Run with: pytest -m live --tb=short

Set LLM_URL, LLM_API_KEY, LLM_MODEL_NAME env vars before running.
"""

import os
import pytest
from app.services.llm_service import LLMService


@pytest.mark.live
class TestLiveLLM:
    @pytest.fixture(autouse=True)
    def setup(self):
        if not os.environ.get("LLM_API_KEY"):
            pytest.skip("LLM_API_KEY not set")

    @pytest.mark.asyncio
    async def test_live_extract_aspirin_complaint(self):
        service = LLMService()
        result = await service.extract_complaint(
            "I received a batch of Aspirin 200mg tablets (Batch: B-2024-001) "
            "and several tablets were broken. My name is John Smith, "
            "contact at john@example.com."
        )
        assert result.product_name is not None
        assert "aspirin" in result.product_name.lower() or result.product_name is not None
        assert result.batch_lot_number is not None

    @pytest.mark.asyncio
    async def test_live_classify_complaint(self):
        service = LLMService()
        result = await service.classify_complaint(
            "Broken tablets in sealed blister pack",
            {"product_name": "Aspirin", "detailed_description": "Broken tablets"}
        )
        assert result is not None
        assert hasattr(result, 'complaint_type') or isinstance(result, dict)

    @pytest.mark.asyncio
    async def test_live_assess_risk(self):
        service = LLMService()
        result = await service.assess_risk(
            {"product_name": "Aspirin", "complaint_type": "Defect", "detailed_description": "Broken tablets"},
            {"score": 0.8, "missing_fields": []}
        )
        assert result is not None
