"""QPilot Backend - Prompts module."""

from .classification import CLASSIFICATION_PROMPT
from .extraction import EXTRACTION_PROMPT
from .risk import RISK_PROMPT

__all__ = ["EXTRACTION_PROMPT", "CLASSIFICATION_PROMPT", "RISK_PROMPT"]
