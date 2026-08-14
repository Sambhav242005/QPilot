"""QPilot Backend - Classification Schema."""

from pydantic import BaseModel, Field


class ComplaintClassification(BaseModel):
    """Classification of a complaint."""

    category: str = Field(
        ..., description="Main complaint category (e.g., Product Quality, Packaging, Labeling)"
    )
    subcategory: str | None = Field(None, description="More specific subcategory")
    reasoning: str = Field("", description="Why this classification was chosen")
    confidence: float = Field(
        0.0, ge=0.0, le=1.0, description="Classification confidence"
    )
