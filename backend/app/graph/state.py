"""QPilot Backend - Complaint State for LangGraph."""

from pydantic import BaseModel, Field


class ComplaintState(BaseModel):
    """State object for LangGraph workflow."""

    # ─── Input ──────────────────────────────────────────────────────────
    complaint_id: str = ""
    raw_input: str = ""
    input_type: str = "text"  # text or document

    # ─── AI Outputs ─────────────────────────────────────────────────────
    extraction: dict | None = None
    classification: dict | None = None
    risk_assessment: dict | None = None
    completeness: dict | None = None

    # ─── Workflow Status ────────────────────────────────────────────────
    current_step: str = "receive_input"
    status: str = "pending"  # pending, processing, review, ready_to_commit, committed
    error: str | None = None

    # ─── User Interaction ───────────────────────────────────────────────
    messages: list[dict[str, str]] = Field(default_factory=list)

    # ─── Metadata ───────────────────────────────────────────────────────
    created_at: str = ""
    updated_at: str = ""
