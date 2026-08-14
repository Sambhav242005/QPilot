"""Tests for LangGraph integration - missing info flow + state isolation."""

import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from app.graph.state import ComplaintState
from app.graph.nodes.completeness import calculate_completeness, check_completeness


class TestMissingInformationFlow:
    def test_incomplete_complaint_flags_missing(self):
        """Incomplete complaint should identify missing fields."""
        extraction = {
            "complaint_source": "Phone",
            "customer_name": None,
            "product_name": None,
            "batch_lot_number": None,
        }

        result = calculate_completeness(extraction)

        assert result["score"] < 0.5
        assert len(result["missing_fields"]) > 0
        assert "customer_name" in result["missing_fields"]
        assert "product_name" in result["missing_fields"]

    def test_complete_complaint_passes(self):
        """Complete complaint should pass completeness check."""
        extraction = {
            "complaint_source": "Phone",
            "customer_name": "John Doe",
            "product_name": "Aspirin",
            "batch_lot_number": "BATCH-001",
            "complaint_type": "Defect",
            "complaint_date": "2025-06-15",
            "detailed_description": "Broken tablets",
        }

        result = calculate_completeness(extraction)

        assert result["score"] >= 0.5
        assert len(result["missing_fields"]) == 0

    @pytest.mark.asyncio
    async def test_check_completeness_sets_status_incomplete(self):
        """check_completeness node should set status to 'incomplete' for low scores."""
        state = ComplaintState(
            raw_input="Test",
            extraction={"complaint_source": "Phone"},
        )

        result = await check_completeness(state)

        assert result.status == "incomplete"

    @pytest.mark.asyncio
    async def test_check_completeness_sets_status_review(self):
        """check_completeness node should set status to 'review' for good scores."""
        state = ComplaintState(
            raw_input="Test",
            extraction={
                "complaint_source": "Phone",
                "customer_name": "John",
                "product_name": "Aspirin",
                "batch_lot_number": "BATCH-001",
                "complaint_type": "Defect",
                "complaint_date": "2025-06-15",
                "detailed_description": "Broken",
            },
        )

        result = await check_completeness(state)

        assert result.status == "review"


class TestStateIsolation:
    def test_two_complaints_independent(self):
        """Two complaint states should be independent."""
        state1 = ComplaintState(
            complaint_id="c1",
            raw_input="Complaint 1",
            extraction={"product_name": "Aspirin"},
        )
        state2 = ComplaintState(
            complaint_id="c2",
            raw_input="Complaint 2",
            extraction={"product_name": "Ibuprofen"},
        )

        # Mutate state1
        state1.extraction["product_name"] = "Changed"
        state1.status = "review"

        # state2 should be unaffected
        assert state2.extraction["product_name"] == "Ibuprofen"
        assert state2.status == "pending"

    def test_messages_independent(self):
        """Messages list should be independent between states."""
        state1 = ComplaintState(complaint_id="c1")
        state2 = ComplaintState(complaint_id="c2")

        state1.messages.append({"role": "user", "content": "Hello"})

        assert len(state2.messages) == 0
