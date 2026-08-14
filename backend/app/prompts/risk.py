"""QPilot Backend - Risk Prompt."""

RISK_PROMPT = """Assess the risk of this complaint.

Extraction: {extraction}
Classification: {classification}

Return a JSON object with:
- overall_severity: low, medium, high, critical
- risk_score: 0.0 to 1.0
- risk_factors: Array of objects with factor, severity, reasoning
- reasoning: Overall reasoning
- recommended_action: What to do next
- confidence: low, medium, or high based on the evidence available in the complaint

JSON:"""
