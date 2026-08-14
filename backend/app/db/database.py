"""QPilot Backend - Database Configuration."""

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from ..config import get_async_database_url, get_settings

settings = get_settings()

# Use the configured database. SQLite remains the default for local development;
# Docker Compose supplies a PostgreSQL URL for the containerized deployment.
DATABASE_URL = get_async_database_url(settings.DATABASE_URL)

# Create async engine
engine = create_async_engine(
    DATABASE_URL,
    echo=False,
    future=True,
)

# Create session factory
async_session = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def get_db() -> AsyncSession:
    """Dependency for getting async database session."""
    async with async_session() as session:
        try:
            yield session
        finally:
            await session.close()
