"""QPilot Backend - Extract Fields Node."""

from ...schemas.complaint import ComplaintExtraction
from ...services.llm_service import llm_service
from ..state import ComplaintState


async def extract_fields(state: ComplaintState) -> ComplaintState:
    """Extract structured fields from raw complaint input."""
    try:
        extraction = await llm_service.extract_complaint(state.raw_input)
        state.extraction = extraction.model_dump()
        state.current_step = "extract_fields"
        state.status = "processing"
    except Exception as e:
        state.error = f"Extraction failed: {str(e)}"
        state.status = "error"

    return state
