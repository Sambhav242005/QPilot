# QPilot Architecture Walkthrough

## Demo path

1. Start the FastAPI backend and Next.js frontend.
2. Upload `backend/uploads/sample_complaint.pdf` in the AI Complaint Intake Assistant.
3. Confirm the extracted values in the form, especially customer, product, batch, dates, quantity, and complaint type.
4. Review the Copilot output: classification, initial severity, risk factors, evidence/reasoning, recommended action, and missing information.
5. Correct a field directly in the form or through the Copilot, then review the refreshed analysis.
6. Open the review panel, confirm the data, and commit to QMS.

## Request flow

```text
PDF or text
  -> FastAPI intake/upload
  -> LangGraph: extract -> validate -> classify -> assess risk -> completeness
  -> Pydantic-validated response
  -> Redux form + Copilot analysis
  -> human correction/review
  -> explicit QMS commit + audit event
```

## Interview points

- The AI is advisory; it never writes SQL or commits a complaint.
- Completeness is a deterministic field-coverage score, not an AI confidence score.
- Missing values are shown as missing rather than fabricated.
- The API client normalizes backend schema variants before applying them to the UI.
