"""QPilot Backend - V1 API Router."""

from fastapi import APIRouter

from .complaints import router as complaints_router
from .health import router as health_router

router = APIRouter(prefix="/api/v1")

router.include_router(health_router, tags=["health"])
router.include_router(complaints_router, tags=["complaints"])
