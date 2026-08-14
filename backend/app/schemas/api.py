"""QPilot Backend - API Request/Response Schemas."""

from pydantic import BaseModel, Field


class ComplaintCreateRequest(BaseModel):
    """Request to create a complaint."""

    raw_input: str = Field(..., description="Raw complaint text or document content")
    input_type: str = Field("text", description="Input type: text or document")


class ComplaintUpdateRequest(BaseModel):
    """Request to update complaint fields."""

    fields: dict[str, str] = Field(..., description="Fields to update")


class ComplaintResponse(BaseModel):
    """Response for a complaint."""

    id: str
    raw_input: str
    status: str
    extraction: dict | None = None
    classification: dict | None = None
    risk_assessment: dict | None = None
    completeness: dict | None = None
    created_at: str
    updated_at: str


class ComplaintListResponse(BaseModel):
    """Response for list of complaints."""

    complaints: list[ComplaintResponse]
    total: int


class CommitResponse(BaseModel):
    """Response for commit action."""

    success: bool
    complaint_id: str
    message: str


class ErrorResponse(BaseModel):
    """Error response."""

    error: str
    detail: str = ""


class HealthResponse(BaseModel):
    """Health check response."""

    status: str
    version: str
