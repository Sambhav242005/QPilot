"""QPilot Backend - Complaint Extraction Schema."""

from pydantic import BaseModel, Field


class ComplaintExtraction(BaseModel):
    """Structured extraction of a customer complaint."""

    # ─── Origin & Customer Details ──────────────────────────────────────
    complaint_source: str | None = Field(None, description="Source of the complaint")
    customer_name: str | None = Field(None, description="Customer name")

    # ─── Product & Batch Identification ─────────────────────────────────
    product_name: str | None = Field(None, description="Product name")
    product_strength_grade: str | None = Field(None, description="Product strength/grade")
    batch_lot_number: str | None = Field(None, description="Batch/lot number")
    manufacturing_date: str | None = Field(None, description="Manufacturing date")
    expiry_date: str | None = Field(None, description="Expiry date")
    quantity_affected: str | None = Field(None, description="Quantity affected")

    # ─── Complaint Details ──────────────────────────────────────────────
    complaint_type: str | None = Field(None, description="Type/category of complaint")
    complaint_date: str | None = Field(None, description="Date of complaint")
    detailed_description: str | None = Field(None, description="Detailed description")

    # ─── Initial Assessment ─────────────────────────────────────────────
    initial_severity: str | None = Field(None, description="Initial severity assessment")
    priority: str | None = Field(None, description="Priority level")

    # ─── Completeness ───────────────────────────────────────────────────
    completeness_score: float = Field(0.0, ge=0.0, le=1.0)
    missing_fields: list[str] = Field(default_factory=list)
