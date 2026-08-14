"""Tests for backend configuration normalization."""

import pytest

from app.config import get_async_database_url


@pytest.mark.parametrize(
    ("configured_url", "expected_url"),
    [
        (
            "postgresql://qpilot:qpilot@localhost:5432/qpilot",
            "postgresql+asyncpg://qpilot:qpilot@localhost:5432/qpilot",
        ),
        (
            "postgres://qpilot:qpilot@localhost:5432/qpilot",
            "postgresql+asyncpg://qpilot:qpilot@localhost:5432/qpilot",
        ),
        (
            "sqlite:///./qpilot.db",
            "sqlite+aiosqlite:///./qpilot.db",
        ),
        (
            "postgresql+asyncpg://qpilot:qpilot@localhost:5432/qpilot",
            "postgresql+asyncpg://qpilot:qpilot@localhost:5432/qpilot",
        ),
    ],
)
def test_database_url_is_normalized_for_async_sqlalchemy(
    configured_url: str,
    expected_url: str,
) -> None:
    """Supported database URLs resolve to async SQLAlchemy driver URLs."""
    assert get_async_database_url(configured_url) == expected_url
