"""QPilot Backend - Classification Prompt."""

CLASSIFICATION_PROMPT = """Classify this complaint based on the extracted information.

Raw complaint: {text}
Extracted data: {extraction}

Return a JSON object with:
- category: Main category (Product Quality, Packaging, Labeling, Documentation, Delivery, Other)
- subcategory: More specific subcategory
- reasoning: Why this classification
- confidence: 0.0 to 1.0

JSON:"""
