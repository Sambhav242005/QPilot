"""QPilot Backend - Risk Assessment Schema."""

from pydantic import BaseModel, Field


class RiskFactor(BaseModel):
    """A single risk factor."""

    factor: str = Field(..., description="Risk factor name")
    severity: str = Field(..., description="Severity: low, medium, high, critical")
    reasoning: str = Field(..., description="Why this factor is relevant")


class RiskAssessment(BaseModel):
    """Risk assessment for a complaint."""

    overall_severity: str = Field(
        ..., description="Overall severity: low, medium, high, critical"
    )
    risk_score: float = Field(0.0, ge=0.0, le=1.0, description="Risk score 0-1")
    risk_factors: list[RiskFactor] = Field(default_factory=list)
    reasoning: str = Field("", description="Overall risk reasoning")
    recommended_action: str = Field(
        "", description="Recommended next action"
    )
    confidence: str | None = Field(
        None, description="Confidence in the assessment: low, medium, high"
    )
