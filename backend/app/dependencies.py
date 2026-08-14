"""QPilot Backend - FastAPI Dependencies."""

from sqlalchemy.ext.asyncio import AsyncSession

from .db.database import get_db


async def get_database() -> AsyncSession:
    """Dependency for getting database session."""
    async for session in get_db():
        yield session
