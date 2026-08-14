"""QPilot Backend - Complaint Repository."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..db.models import Complaint


class ComplaintRepository:
    """Repository for complaint CRUD operations."""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_all(self, limit: int = 100, offset: int = 0) -> list[Complaint]:
        """Get all complaints."""
        result = await self.session.execute(
            select(Complaint).order_by(Complaint.created_at.desc()).limit(limit).offset(offset)
        )
        return list(result.scalars().all())

    async def get_by_id(self, complaint_id: str) -> Complaint | None:
        """Get complaint by ID."""
        result = await self.session.execute(select(Complaint).where(Complaint.id == complaint_id))
        return result.scalar_one_or_none()

    async def create(self, raw_input: str, input_type: str = "text") -> Complaint:
        """Create a new complaint."""
        complaint = Complaint(raw_input=raw_input, input_type=input_type)
        self.session.add(complaint)
        await self.session.commit()
        await self.session.refresh(complaint)
        return complaint

    async def update(self, complaint_id: str, fields: dict) -> Complaint | None:
        """Update complaint fields."""
        complaint = await self.get_by_id(complaint_id)
        if not complaint:
            return None

        for key, value in fields.items():
            if hasattr(complaint, key):
                setattr(complaint, key, value)

        await self.session.commit()
        await self.session.refresh(complaint)
        return complaint

    async def delete(self, complaint_id: str) -> bool:
        """Delete a complaint."""
        complaint = await self.get_by_id(complaint_id)
        if not complaint:
            return False

        await self.session.delete(complaint)
        await self.session.commit()
        return True

    async def count(self) -> int:
        """Count total complaints."""
        from sqlalchemy import func

        result = await self.session.execute(select(func.count()).select_from(Complaint))
        return result.scalar() or 0
