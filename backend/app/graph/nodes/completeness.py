"""QPilot Backend - Completeness Check Node."""

from ..state import ComplaintState

# Required fields for a complete complaint
REQUIRED_FIELDS = [
    "complaint_source",
    "customer_name",
    "product_name",
    "batch_lot_number",
    "complaint_type",
    "complaint_date",
    "detailed_description",
]

# Important fields (not required but improve completeness)
IMPORTANT_FIELDS = [
    "product_strength_grade",
    "manufacturing_date",
    "expiry_date",
    "quantity_affected",
    "initial_severity",
    "priority",
]


def calculate_completeness(extraction: dict) -> dict:
    """Deterministically calculate completeness score."""
    total_required = len(REQUIRED_FIELDS)
    total_important = len(IMPORTANT_FIELDS)
    total_weight = total_required * 2 + total_important  # Required fields weighted 2x

    score = 0.0
    present_fields = []
    missing_fields = []
    field_status = {}

    # Check required fields (worth 2 points each)
    for field in REQUIRED_FIELDS:
        value = extraction.get(field)
        if value and str(value).strip():
            score += 2
            present_fields.append(field)
            field_status[field] = True
        else:
            missing_fields.append(field)
            field_status[field] = False

    # Check important fields (worth 1 point each)
    for field in IMPORTANT_FIELDS:
        value = extraction.get(field)
        if value and str(value).strip():
            score += 1
            present_fields.append(field)
            field_status[field] = True
        else:
            field_status[field] = False

    # Normalize to 0-1 range
    normalized_score = score / total_weight if total_weight > 0 else 0.0

    return {
        "score": round(normalized_score, 2),
        "total_fields": total_required + total_important,
        "present_fields": len(present_fields),
        "missing_fields": missing_fields,
        "field_status": field_status,
    }


async def check_completeness(state: ComplaintState) -> ComplaintState:
    """Check completeness of extracted fields."""
    try:
        extraction = state.extraction or {}
        completeness = calculate_completeness(extraction)
        state.completeness = completeness
        state.current_step = "completeness"

        # Move to review if completeness is acceptable
        if completeness["score"] >= 0.5:
            state.status = "review"
        else:
            state.status = "incomplete"

    except Exception as e:
        state.error = f"Completeness check failed: {str(e)}"
        state.status = "error"

    return state
