"""QPilot Backend - Extraction Prompt."""

EXTRACTION_PROMPT = """Extract complaint information from the following text and return as JSON.
Return null for fields that are not provided or cannot be determined.

Text: {text}

Return a JSON object with these fields:
- complaint_source: The SOURCE TYPE of the complaint — one of: "Pharmacy", "Hospital", "Distributor", "Patient", "Regulatory". Do NOT put the customer name here. Example: if the complaint is from "Apollo Pharmacy", this field should be "Pharmacy".
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
