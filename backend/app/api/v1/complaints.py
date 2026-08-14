"""QPilot Backend - Complaints API Endpoints."""

import json
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from ...db.database import get_db
from ...repositories.complaint_repository import ComplaintRepository
from ...schemas.api import (
    CommitResponse,
    ComplaintCreateRequest,
    ComplaintListResponse,
    ComplaintResponse,
    ComplaintUpdateRequest,
)
from ...schemas.state import ComplaintState
from ...graph.workflow import complaint_workflow
from ...services.llm_service import llm_service

router = APIRouter()


@router.get("/complaints", response_model=ComplaintListResponse)
async def get_complaints(
    limit: int = 100,
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
) -> ComplaintListResponse:
    """Get all complaints."""
    repo = ComplaintRepository(db)
    complaints = await repo.get_all(limit=limit, offset=offset)
    total = await repo.count()

    return ComplaintListResponse(
        complaints=[
            ComplaintResponse(
                id=c.id,
                raw_input=c.raw_input,
                status=c.status,
                extraction=json.loads(c.extraction_json) if c.extraction_json else None,
                classification=json.loads(c.classification_json) if c.classification_json else None,
                risk_assessment=json.loads(c.risk_assessment_json) if c.risk_assessment_json else None,
                completeness=json.loads(c.completeness_json) if c.completeness_json else None,
                created_at=c.created_at.isoformat() if c.created_at else "",
                updated_at=c.updated_at.isoformat() if c.updated_at else "",
            )
            for c in complaints
        ],
        total=total,
    )


@router.get("/complaints/{complaint_id}", response_model=ComplaintResponse)
async def get_complaint(
    complaint_id: str,
    db: AsyncSession = Depends(get_db),
) -> ComplaintResponse:
    """Get a single complaint."""
    repo = ComplaintRepository(db)
    complaint = await repo.get_by_id(complaint_id)

    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    return ComplaintResponse(
        id=complaint.id,
        raw_input=complaint.raw_input,
        status=complaint.status,
        extraction=json.loads(complaint.extraction_json) if complaint.extraction_json else None,
        classification=json.loads(complaint.classification_json) if complaint.classification_json else None,
        risk_assessment=json.loads(complaint.risk_assessment_json) if complaint.risk_assessment_json else None,
        completeness=json.loads(complaint.completeness_json) if complaint.completeness_json else None,
        created_at=complaint.created_at.isoformat() if complaint.created_at else "",
        updated_at=complaint.updated_at.isoformat() if complaint.updated_at else "",
    )


@router.post("/complaints", response_model=ComplaintResponse, status_code=201)
async def create_complaint(
    request: ComplaintCreateRequest,
    db: AsyncSession = Depends(get_db),
) -> ComplaintResponse:
    """Create a new complaint."""
    # Validate input
    if not request.raw_input or not request.raw_input.strip():
        raise HTTPException(status_code=400, detail="Raw input cannot be empty")

    repo = ComplaintRepository(db)
    complaint = await repo.create(raw_input=request.raw_input, input_type=request.input_type)

    return ComplaintResponse(
        id=complaint.id,
        raw_input=complaint.raw_input,
        status=complaint.status,
        extraction=None,
        classification=None,
        risk_assessment=None,
        completeness=None,
        created_at=complaint.created_at.isoformat() if complaint.created_at else "",
        updated_at=complaint.updated_at.isoformat() if complaint.updated_at else "",
    )


@router.patch("/complaints/{complaint_id}", response_model=ComplaintResponse)
async def update_complaint(
    complaint_id: str,
    request: ComplaintUpdateRequest,
    db: AsyncSession = Depends(get_db),
) -> ComplaintResponse:
    """Update complaint fields."""
    repo = ComplaintRepository(db)
    complaint = await repo.update(complaint_id, request.fields)

    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    return ComplaintResponse(
        id=complaint.id,
        raw_input=complaint.raw_input,
        status=complaint.status,
        extraction=json.loads(complaint.extraction_json) if complaint.extraction_json else None,
        classification=json.loads(complaint.classification_json) if complaint.classification_json else None,
        risk_assessment=json.loads(complaint.risk_assessment_json) if complaint.risk_assessment_json else None,
        completeness=json.loads(complaint.completeness_json) if complaint.completeness_json else None,
        created_at=complaint.created_at.isoformat() if complaint.created_at else "",
        updated_at=complaint.updated_at.isoformat() if complaint.updated_at else "",
    )


@router.delete("/complaints/{complaint_id}", status_code=204)
async def delete_complaint(
    complaint_id: str,
    db: AsyncSession = Depends(get_db),
) -> None:
    """Delete a complaint."""
    repo = ComplaintRepository(db)
    deleted = await repo.delete(complaint_id)

    if not deleted:
        raise HTTPException(status_code=404, detail="Complaint not found")


@router.post("/complaints/{complaint_id}/commit", response_model=CommitResponse)
async def commit_complaint(
    complaint_id: str,
    db: AsyncSession = Depends(get_db),
) -> CommitResponse:
    """Commit complaint to QMS."""
    from ...services.complaint_service import commit_complaint as do_commit

    try:
        await do_commit(complaint_id, db)
    except ValueError as e:
        status_code = 409 if "Cannot commit" in str(e) else 404
        raise HTTPException(status_code=status_code, detail=str(e))

    return CommitResponse(
        success=True,
        complaint_id=complaint_id,
        message="Complaint committed to QMS successfully",
    )


@router.post("/complaints/{complaint_id}/process")
async def process_complaint(
    complaint_id: str,
    db: AsyncSession = Depends(get_db),
) -> ComplaintResponse:
    """Process a complaint through the AI workflow."""
    repo = ComplaintRepository(db)
    complaint = await repo.get_by_id(complaint_id)

    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    # Create initial state
    state = ComplaintState(
        complaint_id=complaint_id,
        raw_input=complaint.raw_input,
        input_type=complaint.input_type,
        status="processing",
    )

    try:
        # Run workflow
        final_state = await complaint_workflow.ainvoke(state)

        # Update complaint with AI outputs
        update_fields = {
            "status": final_state.get("status", "review"),
        }

        if final_state.get("extraction"):
            update_fields["extraction_json"] = json.dumps(final_state["extraction"])
        if final_state.get("classification"):
            update_fields["classification_json"] = json.dumps(final_state["classification"])
        if final_state.get("risk_assessment"):
            update_fields["risk_assessment_json"] = json.dumps(final_state["risk_assessment"])
        if final_state.get("completeness"):
            update_fields["completeness_json"] = json.dumps(final_state["completeness"])

        complaint = await repo.update(complaint_id, update_fields)

        if not complaint:
            raise HTTPException(status_code=500, detail="Failed to update complaint")

        return ComplaintResponse(
            id=complaint.id,
            raw_input=complaint.raw_input,
            status=complaint.status,
            extraction=json.loads(complaint.extraction_json) if complaint.extraction_json else None,
            classification=json.loads(complaint.classification_json) if complaint.classification_json else None,
            risk_assessment=json.loads(complaint.risk_assessment_json) if complaint.risk_assessment_json else None,
            completeness=json.loads(complaint.completeness_json) if complaint.completeness_json else None,
            created_at=complaint.created_at.isoformat() if complaint.created_at else "",
            updated_at=complaint.updated_at.isoformat() if complaint.updated_at else "",
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Processing failed: {str(e)}")


@router.post("/complaints/{complaint_id}/process-stream")
async def process_complaint_stream(
    complaint_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Process a complaint with streaming SSE updates."""
    repo = ComplaintRepository(db)
    complaint = await repo.get_by_id(complaint_id)

    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    async def event_generator():
        """Generate SSE events during processing."""
        try:
            # Initial event
            yield f"data: {json.dumps({'type': 'status', 'status': 'processing', 'message': 'Starting complaint analysis...'})}\n\n"

            # Stream extraction
            yield f"data: {json.dumps({'type': 'step', 'step': 'extraction', 'message': 'Extracting complaint fields...'})}\n\n"

            extraction_result = ""
            async for chunk in llm_service.extract_complaint_stream(complaint.raw_input):
                extraction_result += chunk
                yield f"data: {json.dumps({'type': 'extraction_chunk', 'content': chunk})}\n\n"

            # Parse extraction
            try:
                extraction_data = json.loads(extraction_result)
                yield f"data: {json.dumps({'type': 'extraction_complete', 'data': extraction_data})}\n\n"
            except json.JSONDecodeError:
                yield f"data: {json.dumps({'type': 'error', 'message': 'Failed to parse extraction result'})}\n\n"
                return

            # Classification
            yield f"data: {json.dumps({'type': 'step', 'step': 'classification', 'message': 'Classifying complaint...'})}\n\n"

            # Risk assessment
            yield f"data: {json.dumps({'type': 'step', 'step': 'risk', 'message': 'Assessing risk...'})}\n\n"

            # Completeness
            yield f"data: {json.dumps({'type': 'step', 'step': 'completeness', 'message': 'Checking completeness...'})}\n\n"

            # Final status
            yield f"data: {json.dumps({'type': 'complete', 'status': 'review', 'message': 'Processing complete! Please review the results.'})}\n\n"

        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.post("/complaints/{complaint_id}/message")
async def send_message(
    complaint_id: str,
    message: str,
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Send a chat message about a complaint."""
    repo = ComplaintRepository(db)
    complaint = await repo.get_by_id(complaint_id)

    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    # Build context from complaint data
    context = {}
    if complaint.extraction_json:
        context["extraction"] = json.loads(complaint.extraction_json)
    if complaint.classification_json:
        context["classification"] = json.loads(complaint.classification_json)
    if complaint.risk_assessment_json:
        context["risk_assessment"] = json.loads(complaint.risk_assessment_json)

    # Get response from LLM
    messages = [{"role": "user", "content": message}]
    response = await llm_service.chat(messages, context)

    return {"role": "assistant", "content": response}


@router.post("/complaints/{complaint_id}/message-stream")
async def send_message_stream(
    complaint_id: str,
    message: str,
    db: AsyncSession = Depends(get_db),
):
    """Send a chat message with streaming response."""
    repo = ComplaintRepository(db)
    complaint = await repo.get_by_id(complaint_id)

    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    # Build context from complaint data
    context = {}
    if complaint.extraction_json:
        context["extraction"] = json.loads(complaint.extraction_json)
    if complaint.classification_json:
        context["classification"] = json.loads(complaint.classification_json)
    if complaint.risk_assessment_json:
        context["risk_assessment"] = json.loads(complaint.risk_assessment_json)

    async def event_generator():
        """Generate SSE events for chat response."""
        try:
            messages = [{"role": "user", "content": message}]
            async for chunk in llm_service.chat_stream(messages, context):
                yield f"data: {json.dumps({'type': 'chunk', 'content': chunk})}\n\n"
            yield f"data: {json.dumps({'type': 'complete'})}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.post("/complaints/initialize-db")
async def initialize_database(db: AsyncSession = Depends(get_db)):
    """Initialize database tables."""
    from ...db.models import Base

    connection = await db.connection()
    await connection.run_sync(Base.metadata.create_all)

    return {"status": "success", "message": "Database initialized"}


@router.post("/complaints/{complaint_id}/correct")
async def correct_complaint(
    complaint_id: str,
    correction: str,
    db: AsyncSession = Depends(get_db),
) -> ComplaintResponse:
    """Apply a user correction to the complaint."""
    from ...services.correction_service import apply_correction as do_correct

    try:
        complaint = await do_correct(complaint_id, correction, db)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Correction failed: {str(e)}")

    return ComplaintResponse(
        id=complaint.id,
        raw_input=complaint.raw_input,
        status=complaint.status,
        extraction=json.loads(complaint.extraction_json) if complaint.extraction_json else None,
        classification=json.loads(complaint.classification_json) if complaint.classification_json else None,
        risk_assessment=json.loads(complaint.risk_assessment_json) if complaint.risk_assessment_json else None,
        completeness=json.loads(complaint.completeness_json) if complaint.completeness_json else None,
        created_at=complaint.created_at.isoformat() if complaint.created_at else "",
        updated_at=complaint.updated_at.isoformat() if complaint.updated_at else "",
    )


@router.post("/complaints/{complaint_id}/upload")
async def upload_document(
    complaint_id: str,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
) -> ComplaintResponse:
    """Upload a document for a complaint."""
    from fastapi import UploadFile as FastAPIUploadFile
    from ...services.file_service import process_upload

    repo = ComplaintRepository(db)
    complaint = await repo.get_by_id(complaint_id)

    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    try:
        # Process the upload
        upload_result = await process_upload(file)

        # Update complaint with extracted text
        update_fields = {
            "input_type": "document",
        }

        if upload_result.get("extracted_text"):
            update_fields["raw_input"] = upload_result["extracted_text"]

        complaint = await repo.update(complaint_id, update_fields)

        if not complaint:
            raise HTTPException(status_code=500, detail="Failed to update complaint")

        return ComplaintResponse(
            id=complaint.id,
            raw_input=complaint.raw_input,
            status=complaint.status,
            extraction=json.loads(complaint.extraction_json) if complaint.extraction_json else None,
            classification=json.loads(complaint.classification_json) if complaint.classification_json else None,
            risk_assessment=json.loads(complaint.risk_assessment_json) if complaint.risk_assessment_json else None,
            completeness=json.loads(complaint.completeness_json) if complaint.completeness_json else None,
            created_at=complaint.created_at.isoformat() if complaint.created_at else "",
            updated_at=complaint.updated_at.isoformat() if complaint.updated_at else "",
        )

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")


@router.get("/complaints/{complaint_id}/duplicates")
async def check_duplicates(
    complaint_id: str,
    db: AsyncSession = Depends(get_db),
) -> list[dict]:
    """Check for potential duplicate complaints."""
    from ...services.complaint_service import check_duplicate

    repo = ComplaintRepository(db)
    complaint = await repo.get_by_id(complaint_id)

    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    extraction = json.loads(complaint.extraction_json) if complaint.extraction_json else {}
    product_name = extraction.get("product_name")
    batch_number = extraction.get("batch_lot_number")

    duplicates = await check_duplicate(product_name, batch_number, db)
    return duplicates
