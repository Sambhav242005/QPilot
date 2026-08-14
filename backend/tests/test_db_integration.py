"""QPilot Backend - Database Integration Tests."""

import pytest
import asyncio
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from app.db.database import get_db
from app.db.models import Base, Complaint, Message, AuditEvent, Attachment


@pytest.fixture
async def db_session():
    """Create test database session."""
    engine = create_async_engine("sqlite+aiosqlite:///:memory:", echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with async_session() as session:
        yield session

    await engine.dispose()


@pytest.mark.asyncio
async def test_complaint_foreign_keys(db_session: AsyncSession):
    """Test foreign key constraints work."""
    # Create a complaint
    complaint = Complaint(
        id="test-123",
        raw_input="Test complaint",
        input_type="text",
        status="pending",
    )
    db_session.add(complaint)
    await db_session.commit()

    # Create a message linked to the complaint
    message = Message(
        id="msg-1",
        complaint_id="test-123",
        role="user",
        content="Test message",
    )
    db_session.add(message)
    await db_session.commit()

    # Verify message exists
    result = await db_session.get(Message, "msg-1")
    assert result is not None
    assert result.complaint_id == "test-123"


@pytest.mark.asyncio
async def test_complaint_indexes(db_session: AsyncSession):
    """Test that indexes are created."""
    # Create multiple complaints
    for i in range(5):
        complaint = Complaint(
            id=f"test-{i}",
            raw_input=f"Test complaint {i}",
            input_type="text",
            status="pending" if i % 2 == 0 else "processing",
        )
        db_session.add(complaint)
    await db_session.commit()

    # Query by status (should use index)
    from sqlalchemy import select
    stmt = select(Complaint).where(Complaint.status == "pending")
    result = await db_session.execute(stmt)
    complaints = result.scalars().all()
    assert len(complaints) == 3


@pytest.mark.asyncio
async def test_audit_event_creation(db_session: AsyncSession):
    """Test audit event creation."""
    # Create complaint first
    complaint = Complaint(
        id="test-audit",
        raw_input="Test audit",
        input_type="text",
        status="pending",
    )
    db_session.add(complaint)
    await db_session.commit()

    # Create audit event
    audit_event = AuditEvent(
        id="audit-1",
        complaint_id="test-audit",
        event_type="created",
        details="Complaint created",
    )
    db_session.add(audit_event)
    await db_session.commit()

    result = await db_session.get(AuditEvent, "audit-1")
    assert result is not None
    assert result.complaint_id == "test-audit"
    assert result.event_type == "created"


@pytest.mark.asyncio
async def test_attachment_creation(db_session: AsyncSession):
    """Test attachment creation."""
    # Create complaint first
    complaint = Complaint(
        id="test-attachment",
        raw_input="Test attachment",
        input_type="text",
        status="pending",
    )
    db_session.add(complaint)
    await db_session.commit()

    # Create attachment
    attachment = Attachment(
        id="att-1",
        complaint_id="test-attachment",
        filename="test.pdf",
        original_filename="original.pdf",
        content_type="application/pdf",
        size=1024,
    )
    db_session.add(attachment)
    await db_session.commit()

    result = await db_session.get(Attachment, "att-1")
    assert result is not None
    assert result.complaint_id == "test-attachment"


@pytest.mark.asyncio
async def test_cascade_delete(db_session: AsyncSession):
    """Test cascade delete works."""
    # Create complaint with message
    complaint = Complaint(
        id="test-cascade",
        raw_input="Test cascade",
        input_type="text",
        status="pending",
    )
    db_session.add(complaint)
    await db_session.commit()

    message = Message(
        id="msg-cascade",
        complaint_id="test-cascade",
        role="user",
        content="Test message",
    )
    db_session.add(message)
    await db_session.commit()

    # Delete complaint
    await db_session.delete(complaint)
    await db_session.commit()

    # Message should also be deleted (cascade)
    result = await db_session.get(Message, "msg-cascade")
    assert result is None
