"""QPilot Backend - Complaint State Schema (LangGraph)."""

from pydantic import BaseModel, Field

from .classification import ComplaintClassification
from .complaint import ComplaintExtraction
from .completeness import CompletenessResult
from .risk import RiskAssessment


class ComplaintState(BaseModel):
    """State object for LangGraph workflow."""

    # ─── Input ──────────────────────────────────────────────────────────
    complaint_id: str = ""
    raw_input: str = ""
    input_type: str = "text"  # text or document

    # ─── AI Outputs ─────────────────────────────────────────────────────
    extraction: ComplaintExtraction | None = None
    classification: ComplaintClassification | None = None
    risk_assessment: RiskAssessment | None = None
    completeness: CompletenessResult | None = None

    # ─── Workflow Status ────────────────────────────────────────────────
    current_step: str = "receive_input"
    status: str = "pending"  # pending, processing, review, ready_to_commit, committed
    error: str | None = None

    # ─── User Interaction ───────────────────────────────────────────────
    messages: list[dict[str, str]] = Field(default_factory=list)
    user_corrections: list[dict[str, str]] = Field(default_factory=list)

    # ─── Metadata ───────────────────────────────────────────────────────
    created_at: str = ""
    updated_at: str = ""
