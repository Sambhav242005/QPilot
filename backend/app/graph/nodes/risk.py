"""QPilot Backend - Risk Assessment Node."""

from ...schemas.complaint import ComplaintExtraction
from ...schemas.classification import ComplaintClassification
from ...schemas.risk import RiskAssessment
from ...services.llm_service import llm_service
from ..state import ComplaintState


async def assess_risk(state: ComplaintState) -> ComplaintState:
    """Assess risk of the complaint."""
    try:
        extraction = ComplaintExtraction(**state.extraction) if state.extraction else ComplaintExtraction()
        classification = ComplaintClassification(**state.classification) if state.classification else ComplaintClassification(category="Other", confidence=0.0)
        risk = await llm_service.assess_risk(extraction, classification)
        state.risk_assessment = risk.model_dump()
        state.current_step = "risk"
    except Exception as e:
        state.error = f"Risk assessment failed: {str(e)}"
        state.status = "error"

    return state
