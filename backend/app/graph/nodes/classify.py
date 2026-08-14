"""QPilot Backend - Classify Node."""

from ...schemas.complaint import ComplaintExtraction
from ...schemas.classification import ComplaintClassification
from ...services.llm_service import llm_service
from ..state import ComplaintState


async def classify(state: ComplaintState) -> ComplaintState:
    """Classify the complaint."""
    try:
        extraction = ComplaintExtraction(**state.extraction) if state.extraction else ComplaintExtraction()
        classification = await llm_service.classify_complaint(state.raw_input, extraction)
        state.classification = classification.model_dump()
        state.current_step = "classify"
    except Exception as e:
        state.error = f"Classification failed: {str(e)}"
        state.status = "error"

    return state
