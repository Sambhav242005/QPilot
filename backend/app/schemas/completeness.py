"""QPilot Backend - Completeness Result Schema."""

from pydantic import BaseModel, Field


class CompletenessResult(BaseModel):
    """Result of completeness check."""

    score: float = Field(0.0, ge=0.0, le=1.0, description="Completeness score 0-1")
    total_fields: int = Field(0, description="Total number of fields")
    present_fields: int = Field(0, description="Number of present fields")
    missing_fields: list[str] = Field(default_factory=list)
    field_status: dict[str, bool] = Field(default_factory=dict)
