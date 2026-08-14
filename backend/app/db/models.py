"""QPilot Backend - SQLAlchemy ORM Models."""

import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import DeclarativeBase, relationship


class Base(DeclarativeBase):
    """Base class for all ORM models."""
    pass


def generate_id() -> str:
    """Generate a unique ID."""
    return str(uuid.uuid4())


def utc_now() -> datetime:
    """Return current UTC time as naive datetime (for TIMESTAMP WITHOUT TIME ZONE)."""
    return datetime.now(timezone.utc).replace(tzinfo=None)


class Complaint(Base):
    """Complaint model."""

    __tablename__ = "complaints"

    id = Column(String, primary_key=True, default=generate_id)
    raw_input = Column(Text, nullable=False)
    input_type = Column(String, default="text")
    status = Column(String, default="pending")

    # AI outputs stored as JSON strings
    extraction_json = Column(Text, nullable=True)
    classification_json = Column(Text, nullable=True)
    risk_assessment_json = Column(Text, nullable=True)
    completeness_json = Column(Text, nullable=True)

    # Metadata
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    # Relationships
    messages = relationship("Message", back_populates="complaint", cascade="all, delete-orphan")
    audit_events = relationship("AuditEvent", back_populates="complaint", cascade="all, delete-orphan")
    attachments = relationship("Attachment", back_populates="complaint", cascade="all, delete-orphan")


class Message(Base):
    """Message model for conversation history."""

    __tablename__ = "messages"

    id = Column(String, primary_key=True, default=generate_id)
    complaint_id = Column(String, ForeignKey("complaints.id"), nullable=False)
    role = Column(String, nullable=False)  # user, assistant, system
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=utc_now)

    complaint = relationship("Complaint", back_populates="messages")


class AuditEvent(Base):
    """Audit event model for tracking changes."""

    __tablename__ = "audit_events"

    id = Column(String, primary_key=True, default=generate_id)
    complaint_id = Column(String, ForeignKey("complaints.id"), nullable=False)
    event_type = Column(String, nullable=False)
    details = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utc_now)

    complaint = relationship("Complaint", back_populates="audit_events")


class Attachment(Base):
    """Attachment model for uploaded files."""

    __tablename__ = "attachments"

    id = Column(String, primary_key=True, default=generate_id)
    complaint_id = Column(String, ForeignKey("complaints.id"), nullable=False)
    filename = Column(String, nullable=False)
    original_filename = Column(String, nullable=False)
    content_type = Column(String, nullable=False)
    size = Column(Integer, nullable=False)
    extracted_text = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utc_now)

    complaint = relationship("Complaint", back_populates="attachments")
