"""QPilot Backend - Complaint Service for commit logic."""

import json
from datetime import datetime, timezone

from ..db.models import AuditEvent
from ..repositories.complaint_repository import ComplaintRepository


COMMITTABLE_STATUSES = {"review", "ready_to_commit"}


async def commit_complaint(complaint_id: str, db) -> Complaint:
    """Commit a complaint to QMS.

    1. Validate status is committable
    2. Update status to 'committed'
    3. Create audit event
    4. Return updated complaint
    """
    repo = ComplaintRepository(db)
    complaint = await repo.get_by_id(complaint_id)

    if not complaint:
        raise ValueError(f"Complaint {complaint_id} not found")

    if complaint.status not in COMMITTABLE_STATUSES:
        raise ValueError(
            f"Cannot commit complaint in '{complaint.status}' status. "
            f"Must be one of: {COMMITTABLE_STATUSES}"
        )

    # Update status
    complaint = await repo.update(complaint_id, {"status": "committed"})

    # Create audit event
    audit = AuditEvent(
        complaint_id=complaint_id,
        event_type="committed",
        details=json.dumps({
            "committed_at": datetime.now(timezone.utc).isoformat(),
            "previous_status": complaint.status,
        }),
    )
    db.add(audit)
    await db.commit()

    return complaint


async def check_duplicate(
    product_name: str | None,
    batch_number: str | None,
    db,
) -> list[dict]:
    """Check for potential duplicate complaints.

    Filters by product name and/or batch number, then scores similarity.
    Returns list of potential duplicates sorted by score descending.
    """
    repo = ComplaintRepository(db)
    all_complaints = await repo.get_all(limit=1000)

    candidates = []
    for c in all_complaints:
        if not c.extraction_json:
            continue

        extraction = json.loads(c.extraction_json)
        candidate_product = extraction.get("product_name")
        candidate_batch = extraction.get("batch_lot_number")

        # Filter: must match product name if provided
        if product_name and candidate_product:
            if product_name.lower() not in candidate_product.lower() and \
               candidate_product.lower() not in product_name.lower():
                continue
        elif product_name and not candidate_product:
            continue

        # Filter: must match batch if both provided
        if batch_number and candidate_batch:
            if batch_number.lower() != candidate_batch.lower():
                continue
        elif batch_number and not candidate_batch:
            continue

        # Score
        score = 0.0
        reasons = []

        if product_name and candidate_product:
            p1 = product_name.lower().strip()
            p2 = candidate_product.lower().strip()
            if p1 == p2:
                score += 0.5
                reasons.append("exact_product_match")
            elif p1 in p2 or p2 in p1:
                score += 0.3
                reasons.append("partial_product_match")

        if batch_number and candidate_batch:
            if batch_number.lower() == candidate_batch.lower():
                score += 0.5
                reasons.append("exact_batch_match")

        if score > 0:
            candidates.append({
                "complaint_id": c.id,
                "product_name": candidate_product,
                "batch_number": candidate_batch,
                "score": round(score, 2),
                "label": "Potential Duplicate" if score < 1.0 else "Confirmed Match",
                "reasons": reasons,
                "created_at": c.created_at.isoformat() if c.created_at else "",
            })

    # Sort by score descending
    candidates.sort(key=lambda x: x["score"], reverse=True)
    return candidates
