"""QPilot Backend - LLM Service."""

import json
import asyncio
from typing import AsyncGenerator

from openai import AsyncOpenAI, APIError, APITimeoutError, RateLimitError

from ..config import get_settings
from ..schemas.complaint import ComplaintExtraction
from ..schemas.classification import ComplaintClassification
from ..schemas.risk import RiskAssessment
from ..prompts.risk import RISK_PROMPT


class LLMService:
    """Service for interacting with OpenAI-compatible LLM APIs."""

    def __init__(self) -> None:
        settings = get_settings()
        self.client = AsyncOpenAI(
            api_key=settings.LLM_API_KEY,
            base_url=settings.LLM_URL,
            timeout=30.0,
            max_retries=2,
        )
        self.model = settings.LLM_MODEL_NAME

    async def _call_llm(self, prompt: str, temperature: float = 0.1) -> str:
        """Call LLM with error handling."""
        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                temperature=temperature,
                response_format={"type": "json_object"},
            )
            return response.choices[0].message.content or "{}"
        except APITimeoutError:
            raise Exception("LLM request timed out. Please try again.")
        except RateLimitError:
            raise Exception("Rate limit exceeded. Please wait and try again.")
        except APIError as e:
            raise Exception(f"LLM API error: {str(e)}")
        except Exception as e:
            raise Exception(f"Unexpected error calling LLM: {str(e)}")

    async def _call_llm_stream(
        self, prompt: str, temperature: float = 0.1
    ) -> AsyncGenerator[str, None]:
        """Call LLM with streaming."""
        try:
            stream = await self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                temperature=temperature,
                response_format={"type": "json_object"},
                stream=True,
            )
            async for chunk in stream:
                if chunk.choices[0].delta.content:
                    yield chunk.choices[0].delta.content
        except APITimeoutError:
            raise Exception("LLM request timed out. Please try again.")
        except RateLimitError:
            raise Exception("Rate limit exceeded. Please wait and try again.")
        except APIError as e:
            raise Exception(f"LLM API error: {str(e)}")

    def _clean_json(self, content: str) -> str:
        """Strip markdown fences and extract JSON from LLM response."""
        text = content.strip()
        # Remove ```json ... ``` or ``` ... ``` fences
        if text.startswith("```"):
            lines = text.split("\n")
            # Remove first and last lines (fences)
            lines = [l for l in lines if not l.strip().startswith("```")]
            text = "\n".join(lines).strip()
        return text

    async def extract_complaint(self, text: str) -> ComplaintExtraction:
        """Extract structured complaint data from text."""
        prompt = f"""Extract complaint information from the following text and return as JSON.
Return null for fields that are not provided or cannot be determined.

Text: {text}

Return a JSON object with these fields:
- complaint_source: The SOURCE TYPE of the complaint — one of: "Pharmacy", "Hospital", "Distributor", "Patient", "Regulatory". Do NOT put the customer name here.
- customer_name: The specific customer/company name (e.g., "Apollo Pharmacy", "City Hospital").
- product_name: Product name
- product_strength_grade: Product strength/grade
- batch_lot_number: Batch/lot number
- manufacturing_date: Manufacturing date in YYYY-MM-DD format (e.g., "2024-01-15")
- expiry_date: Expiry date in YYYY-MM-DD format (e.g., "2025-06-30")
- quantity_affected: Quantity affected
- complaint_type: Type/category of complaint (e.g., "Product Defect", "Packaging Issue", "Documentation", "Efficacy", "Adverse Event", "Supply")
- complaint_date: Date of complaint in YYYY-MM-DD format (e.g., "2024-03-20")
- detailed_description: Detailed description
- initial_severity: Initial severity (low, medium, high, critical)
- priority: Priority level (low, normal, high, urgent)

JSON:"""

        content = await self._call_llm(prompt)

        try:
            data = json.loads(self._clean_json(content))
            return ComplaintExtraction(**data)
        except json.JSONDecodeError:
            return ComplaintExtraction()
        except Exception as e:
            print(f"Validation error: {e}")
            return ComplaintExtraction()

    async def extract_complaint_stream(self, text: str) -> AsyncGenerator[str, None]:
        """Extract complaint data with streaming."""
        prompt = f"""Extract complaint information from the following text and return as JSON.
Return null for fields that are not provided or cannot be determined.

Text: {text}

Return a JSON object with these fields:
- complaint_source: The SOURCE TYPE of the complaint — one of: "Pharmacy", "Hospital", "Distributor", "Patient", "Regulatory". Do NOT put the customer name here.
- customer_name: The specific customer/company name (e.g., "Apollo Pharmacy", "City Hospital").
- product_name: Product name
- product_strength_grade: Product strength/grade
- batch_lot_number: Batch/lot number
- manufacturing_date: Manufacturing date in YYYY-MM-DD format (e.g., "2024-01-15")
- expiry_date: Expiry date in YYYY-MM-DD format (e.g., "2025-06-30")
- quantity_affected: Quantity affected
- complaint_type: Type/category of complaint (e.g., "Product Defect", "Packaging Issue", "Documentation", "Efficacy", "Adverse Event", "Supply")
- complaint_date: Date of complaint in YYYY-MM-DD format (e.g., "2024-03-20")
- detailed_description: Detailed description
- initial_severity: Initial severity (low, medium, high, critical)
- priority: Priority level (low, normal, high, urgent)

JSON:"""

        async for chunk in self._call_llm_stream(prompt):
            yield chunk

    async def classify_complaint(
        self, text: str, extraction: ComplaintExtraction
    ) -> ComplaintClassification:
        """Classify a complaint."""
        extraction_dict = extraction.model_dump()
        prompt = f"""Classify this complaint based on the extracted information.

Raw complaint: {text}
Extracted data: {extraction_dict}

Return a JSON object with:
- category: Main category (Product Quality, Packaging, Labeling, Documentation, Delivery, Other)
- subcategory: More specific subcategory
- reasoning: Why this classification
- confidence: 0.0 to 1.0

JSON:"""

        content = await self._call_llm(prompt)

        try:
            data = json.loads(self._clean_json(content))
            return ComplaintClassification(**data)
        except json.JSONDecodeError:
            return ComplaintClassification(category="Other", confidence=0.0)
        except Exception as e:
            print(f"Classification validation error: {e}")
            return ComplaintClassification(category="Other", confidence=0.0)

    async def assess_risk(
        self, extraction: ComplaintExtraction, classification: ComplaintClassification
    ) -> RiskAssessment:
        """Assess risk of a complaint."""
        extraction_dict = extraction.model_dump()
        classification_dict = classification.model_dump()
        prompt = RISK_PROMPT.format(
            extraction=extraction_dict,
            classification=classification_dict,
        )

        content = await self._call_llm(prompt)

        try:
            data = json.loads(self._clean_json(content))
            return RiskAssessment(**data)
        except json.JSONDecodeError:
            return RiskAssessment(overall_severity="low", risk_score=0.0)
        except Exception as e:
            print(f"Risk assessment validation error: {e}")
            return RiskAssessment(overall_severity="low", risk_score=0.0)

    async def chat(
        self, messages: list[dict[str, str]], context: dict | None = None
    ) -> str:
        """Chat with the LLM."""
        system_message = (
            "You are QPilot, an AI assistant for pharmaceutical complaint management. "
            "Help users understand and process customer complaints."
        )
        if context:
            system_message += f"\n\nContext: {context}"

        full_messages = [{"role": "system", "content": system_message}] + messages

        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=full_messages,
                temperature=0.7,
            )
            return response.choices[0].message.content or ""
        except Exception as e:
            return f"I apologize, but I encountered an error: {str(e)}"

    async def chat_stream(
        self, messages: list[dict[str, str]], context: dict | None = None
    ) -> AsyncGenerator[str, None]:
        """Chat with the LLM using streaming."""
        system_message = (
            "You are QPilot, an AI assistant for pharmaceutical complaint management. "
            "Help users understand and process customer complaints."
        )
        if context:
            system_message += f"\n\nContext: {context}"

        full_messages = [{"role": "system", "content": system_message}] + messages

        try:
            stream = await self.client.chat.completions.create(
                model=self.model,
                messages=full_messages,
                temperature=0.7,
                stream=True,
            )
            async for chunk in stream:
                if chunk.choices[0].delta.content:
                    yield chunk.choices[0].delta.content
        except Exception as e:
            yield f"I apologize, but I encountered an error: {str(e)}"


# Singleton
llm_service = LLMService()
