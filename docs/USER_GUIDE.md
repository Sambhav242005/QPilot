# QPilot User Guide

This guide explains how to install, run, and use QPilot for the complete complaint workflow:

```text
Complaint document or text
        |
        v
AI extraction and validation
        |
        v
Complaint form + AI risk assessment
        |
        v
Human correction and review
        |
        v
Optional QMS commit and audit trail
```

QPilot is an AI assistant for pharmaceutical quality personnel. It helps structure complaint information and prepares an initial assessment. It does not replace QA judgment, approve a complaint autonomously, or make final regulatory decisions.

## Prerequisites

- Python 3.11 or newer
- Node.js and npm
- An OpenAI-compatible LLM provider, such as Groq, OpenAI, Together, or a local provider
- PowerShell on Windows, or an equivalent shell on macOS/Linux

The normal local demo uses SQLite. PostgreSQL is also supported through `DATABASE_URL` and Docker Compose.

## Configuration

1. From the repository root, copy the environment template for the backend:

   ```powershell
   if (-not (Test-Path backend/.env)) { Copy-Item .env.example backend/.env }
   ```

2. Configure the server-side LLM values in `backend/.env` or the environment used by the backend:

   ```env
   LLM_URL=http://localhost:11434/v1
   LLM_API_KEY=ollama
   LLM_MODEL_NAME=your-model-name
   ```

   For a hosted provider, replace these values with that provider's OpenAI-compatible base URL, API key, and model name.

3. Set the frontend API URL only when the backend is not using its default address:

   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8000
   ```

4. For PostgreSQL, use the Docker stack or set the backend database URL explicitly:

   ```env
   DATABASE_URL=postgresql+asyncpg://qpilot:qpilot@localhost:5432/qpilot
   ```

   The backend uses this URL for both its runtime engine and Alembic migrations. The default remains SQLite when this variable is not changed.

   Or start the complete containerized stack from the repository root:

   ```powershell
   docker compose up --build
   ```

Never put an LLM API key in frontend code, Redux state, or browser storage. Keep secrets server-side and do not commit `.env` files.

## Installation

Open two PowerShell windows from the repository root.

### Backend

```powershell
cd backend
py -3 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
```

If PowerShell blocks activation, run the backend with the virtual-environment interpreter directly or adjust the local execution-policy setting according to your machine's policy.

### Frontend

```powershell
cd frontend
npm install
```

## Start QPilot

In the backend window:

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
uvicorn app.main:app --reload --port 8000
```

In the frontend window:

```powershell
cd frontend
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The backend API is available at [http://localhost:8000](http://localhost:8000).

## How to Use the Application

### 1. Provide a complaint

Use the intake area to either:

- upload a PDF, DOCX, or TXT complaint document, or
- paste complaint text into the text input.

The current upload limit is 10 MB. Wait for the processing confirmation before reviewing the result.

### 2. Review extracted fields

QPilot extracts information into the complaint form. Review every populated field rather than accepting the extraction automatically. Important fields can include:

- source and customer
- product and strength
- batch or lot number
- manufacturing and expiry dates
- affected quantity
- complaint type and description
- patient or product impact

Missing information should remain clearly marked as missing. The AI must not invent values that are not present in the source.

### 3. Review the AI Copilot analysis

After processing, the Copilot should provide an assessment alongside the form. Review:

- **Complaint Type** - the broad type of complaint
- **Classification** - for example, Product Defect or Packaging Issue
- **Initial Severity** - an initial AI recommendation such as Minor, Major, or Critical
- **Risk Factors** - the facts that increase or reduce concern
- **Evidence and Reasoning** - the source-based explanation for the assessment
- **Recommended Next Action** - the proposed QA follow-up
- **Missing Information** - facts needed before the record is complete
- **Status** - normally `Ready for Review`, not an indication that QA review is finished

The risk assessment is an aid to triage. It is not a final regulatory decision.

### 4. Correct the complaint

You can edit fields directly in the form. You can also use the Copilot chat to request a correction, for example:

```text
The affected quantity is 120 capsules, not 100.
```

After a correction, verify that the form, classification, risk factors, missing-information list, and completeness status still agree with the source and with one another.

### 5. Review before committing

Open the **Review & Commit** area and check:

1. the extracted fields,
2. the AI analysis and recommended next action,
3. the missing-information warnings,
4. the completeness indicator, and
5. the audit summary.

`100% Complete` means the required complaint fields are present. It does not mean that the AI has finished analysis or that QA has approved the complaint. If important details are absent, keep the record in human review and resolve or acknowledge the missing information.

### 6. Commit to QMS

Commit only after a qualified reviewer has checked the record and selected the required confirmation. The AI does not commit complaints directly. The application records the commit and audit information after the human confirmation.

## Reproducible PDF Demo

The repository includes [`backend/uploads/sample_complaint.pdf`](../backend/uploads/sample_complaint.pdf). Use it to demonstrate document extraction and Copilot risk assessment:

1. Start the backend and frontend.
2. Upload `backend/uploads/sample_complaint.pdf`.
3. Wait for the success message.
4. Compare the populated fields against the PDF itself.
5. Review the Copilot's classification, severity, risk factors, evidence, recommended action, and missing information.
6. Correct a field if needed, then open Review & Commit.

The PDF contains complaint information including Greenfield Pharmacy, Amoxicillin 500 mg Capsules, batch `AMX-2026-B147`, manufacturing date March 2026, expiry date March 2028, and 120 affected capsules. These values are a test expectation only; always verify them against the source document during a demo.

The important validation path is:

```text
PDF source
  -> extracted structured data
  -> complaint form and AI assessment
  -> compare with the source
  -> human review
```

## Optional Seed Data

To create one local draft complaint for development, run:

```powershell
cd backend
py -3 seed_demo.py
```

The script is intended for local development and is idempotent. It is separate from uploading the sample PDF.

## Testing

Run the backend tests:

```powershell
cd backend
py -3 -m pytest -q
```

Run frontend tests and checks:

```powershell
cd frontend
npm test
npm run lint
npx tsc --noEmit
npm run build
```

Run the Playwright end-to-end suite:

```powershell
cd frontend
npx playwright install
npm run test:e2e -- --workers=1
```

For the focused PDF workflow:

```powershell
cd frontend
npx playwright test e2e/pdf-upload-workflow.spec.ts --workers=1
```

See [`TESTING.md`](TESTING.md) for the testing strategy and [`TEST_REPORT.md`](TEST_REPORT.md) for the latest verification record.

## Troubleshooting

### The frontend cannot reach the backend

Confirm that the backend is running on port 8000 and that `NEXT_PUBLIC_API_URL` points to the same address. Restart the Next.js dev server after changing frontend environment variables.

### The AI request fails

Check `LLM_URL`, `LLM_API_KEY`, and `LLM_MODEL_NAME` in the backend environment. Confirm that the selected model supports the configured OpenAI-compatible endpoint. The API key must be available to the backend process, not the browser.

### Upload processing fails

Use a non-empty PDF, DOCX, or TXT file under 10 MB. For the demo, use the committed `backend/uploads/sample_complaint.pdf`.

### A port is already in use

Start FastAPI on another port, for example `uvicorn app.main:app --reload --port 8001`, then set `NEXT_PUBLIC_API_URL=http://localhost:8001` before starting the frontend.

### The browser tests cannot start

Install the Playwright browsers with `npx playwright install`, then rerun the suite with one worker.

## Related Documentation

- [Root README](../README.md) - project overview and quick start
- [Specifications](SPECTS.md) - requirements and schemas
- [Design](DESIGN.md) - UI and UX decisions
- [Implementation plan](IMPLEMENTATION_PLAN.md) - delivery phases
- [Testing strategy](TESTING.md) - test conventions
- [Architecture walkthrough](ARCHITECTURE_WALKTHROUGH.md) - implementation tour
- [Known limitations](KNOWN_LIMITATIONS.md) - current MVP boundaries
- [Test report](TEST_REPORT.md) - verification results
- [Architecture decision records](adr/) - important design decisions

## Safety and Scope

QPilot is a development and demonstration system. Do not use it as the sole basis for a product-quality, patient-safety, regulatory, or release decision. A qualified human reviewer remains responsible for validating the complaint record and deciding the appropriate QMS action.
