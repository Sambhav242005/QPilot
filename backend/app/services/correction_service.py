"""QPilot Backend - Correction Service."""

import json

from ..db.models import AuditEvent
from ..graph.state import ComplaintState
from ..graph.workflow import correction_workflow
from ..repositories.complaint_repository import ComplaintRepository


async def apply_correction(complaint_id: str, correction_text: str, db) -> Complaint:
    """Apply a user correction to a complaint and re-analyze.

    1. Load complaint from DB
    2. Run correction workflow (apply_correction → extract → classify → risk → completeness)
    3. Persist updated fields
    4. Create audit event
    5. Return updated complaint
    """
    repo = ComplaintRepository(db)
    complaint = await repo.get_by_id(complaint_id)

    if not complaint:
        raise ValueError(f"Complaint {complaint_id} not found")

    # Build current state from DB
    state = ComplaintState(
        complaint_id=complaint_id,
        raw_input=complaint.raw_input,
        input_type=complaint.input_type,
        status=complaint.status,
        extraction=json.loads(complaint.extraction_json) if complaint.extraction_json else None,
        classification=json.loads(complaint.classification_json) if complaint.classification_json else None,
        risk_assessment=json.loads(complaint.risk_assessment_json) if complaint.risk_assessment_json else None,
        completeness=json.loads(complaint.completeness_json) if complaint.completeness_json else None,
        messages=[{"role": "user", "content": correction_text}],
    )

    # Run correction workflow
    final_state = await correction_workflow.ainvoke(state)

    # Persist updated fields
    update_fields = {}
    if final_state.get("extraction"):
        update_fields["extraction_json"] = json.dumps(final_state["extraction"])
    if final_state.get("classification"):
        update_fields["classification_json"] = json.dumps(final_state["classification"])
    if final_state.get("risk_assessment"):
        update_fields["risk_assessment_json"] = json.dumps(final_state["risk_assessment"])
    if final_state.get("completeness"):
        update_fields["completeness_json"] = json.dumps(final_state["completeness"])

    complaint = await repo.update(complaint_id, update_fields)

    # Create audit event
    audit = AuditEvent(
        complaint_id=complaint_id,
        event_type="correction_applied",
        details=json.dumps({
            "correction": correction_text,
            "fields_updated": list(update_fields.keys()),
        }),
    )
    db.add(audit)
    await db.commit()

    return complaint
