"""Seed one draft complaint for a local QPilot demonstration.

Run from the backend directory with: ``py -3 seed_demo.py``.
The script is intentionally idempotent for the same raw input.
"""

import asyncio

from sqlalchemy import select

from app.db.database import async_session, engine
from app.db.models import Base, Complaint
from demo_data import SAMPLE_COMPLAINT_TEXT


async def seed_demo() -> str:
    """Create the demo complaint if it does not already exist."""
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)

    async with async_session() as session:
        existing = await session.scalar(
            select(Complaint).where(Complaint.raw_input == SAMPLE_COMPLAINT_TEXT)
        )
        if existing:
            return existing.id

        complaint = Complaint(raw_input=SAMPLE_COMPLAINT_TEXT, input_type="document")
        session.add(complaint)
        await session.commit()
        await session.refresh(complaint)
        return complaint.id


if __name__ == "__main__":
    print(f"Demo complaint id: {asyncio.run(seed_demo())}")
