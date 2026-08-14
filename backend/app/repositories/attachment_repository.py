"""QPilot Backend - Attachment Repository."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..db.models import Attachment


class AttachmentRepository:
    """Repository for attachment CRUD operations."""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_by_complaint_id(self, complaint_id: str) -> list[Attachment]:
        """Get all attachments for a complaint."""
        result = await self.session.execute(
            select(Attachment)
            .where(Attachment.complaint_id == complaint_id)
            .order_by(Attachment.created_at.desc())
        )
        return list(result.scalars().all())

    async def get_by_id(self, attachment_id: str) -> Attachment | None:
        """Get attachment by ID."""
        result = await self.session.execute(
            select(Attachment).where(Attachment.id == attachment_id)
        )
        return result.scalar_one_or_none()

    async def create(
        self,
        complaint_id: str,
        filename: str,
        original_filename: str,
        content_type: str,
        size: int,
        extracted_text: str | None = None,
    ) -> Attachment:
        """Create a new attachment."""
        attachment = Attachment(
            complaint_id=complaint_id,
            filename=filename,
            original_filename=original_filename,
            content_type=content_type,
            size=size,
            extracted_text=extracted_text,
        )
        self.session.add(attachment)
        await self.session.commit()
        await self.session.refresh(attachment)
        return attachment

    async def update(self, attachment_id: str, fields: dict) -> Attachment | None:
        """Update attachment fields."""
        attachment = await self.get_by_id(attachment_id)
        if not attachment:
            return None

        for key, value in fields.items():
            if hasattr(attachment, key):
                setattr(attachment, key, value)

        await self.session.commit()
        await self.session.refresh(attachment)
        return attachment

    async def delete(self, attachment_id: str) -> bool:
        """Delete an attachment."""
        attachment = await self.get_by_id(attachment_id)
        if not attachment:
            return False

        await self.session.delete(attachment)
        await self.session.commit()
        return True

    async def delete_by_complaint_id(self, complaint_id: str) -> int:
        """Delete all attachments for a complaint."""
        attachments = await self.get_by_complaint_id(complaint_id)
        count = 0
        for attachment in attachments:
            await self.session.delete(attachment)
            count += 1
        await self.session.commit()
        return count
