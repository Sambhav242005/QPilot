# QPilot

**AI Complaint Intelligence for Pharmaceutical Quality**

QPilot is an AI-powered Customer Complaint Management System for pharmaceutical manufacturing. It serves as an intelligent copilot that converts unstructured customer complaints into structured QMS complaint records.

## Start Here

The detailed installation and usage guide is in [docs/USER_GUIDE.md](docs/USER_GUIDE.md). The shortest local setup is:

```powershell
# Terminal 1 - backend
cd backend
py -3 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# Terminal 2 - frontend
cd frontend
npm install
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000), upload `backend/uploads/sample_complaint.pdf` or paste complaint text, review the extracted form and AI Copilot risk assessment, correct anything necessary, and complete the human review before committing to QMS.

## Documentation

- [Complete user guide](docs/USER_GUIDE.md)
- [Architecture walkthrough](docs/ARCHITECTURE_WALKTHROUGH.md)
- [Known limitations](docs/KNOWN_LIMITATIONS.md)
- [Test report](docs/TEST_REPORT.md)
- [Testing strategy](docs/TESTING.md)
- [Technical specification](docs/SPECTS.md)
- [UI/UX design](docs/DESIGN.md)
- [Implementation plan](docs/IMPLEMENTATION_PLAN.md)
- [Task tracker](docs/TODO.md)
- [Architecture decision records](docs/adr/)

## Screenshots / Demo

```
/screenshots/dashboard.png      — Main complaint workspace
/screenshots/complaint.png      — Complaint form with AI extraction
/screenshots/risk-assessment.png — AI risk assessment card
```

Screenshots are intentionally left as review placeholders for the final demo capture. Add the final images under `docs/screenshots/` when they are available.

The reproducible demo source is `backend/uploads/sample_complaint.pdf`. Its expected values and the walkthrough are documented in [docs/ARCHITECTURE_WALKTHROUGH.md](docs/ARCHITECTURE_WALKTHROUGH.md).

## Features

### Core

- AI complaint extraction from natural language
- Complaint classification (Product Defect, Packaging Issue, etc.)
- Explainable AI risk assessment with severity, factors, and reasoning
- Conversational correction of extracted fields
- PDF document upload and text extraction
- Human review before QMS commit
- QMS commit with persistent database storage
- Deterministic completeness scoring
- Audit trail for all actions

### Bonus

- Duplicate complaint detection
- Complaint summary generation
- Root cause recommendations (P3)
- CAPA suggestions (P3)

## Architecture

```
Next.js UI (React, TypeScript, Redux, Tailwind)
                 │ REST API + SSE
                 ▼
FastAPI backend (Pydantic, SQLAlchemy)
        ┌────────┴────────┐
        ▼                 ▼
SQLite/PostgreSQL     LangGraph workflow
via DATABASE_URL              │
                              ▼
                OpenAI-compatible LLM provider
```

### Key Design Decisions

- **Next.js**: React-based frontend with clean separation from Python backend
- **Redux Toolkit**: Centralized state for complaint data and copilot state
- **SQLAlchemy 2 + Alembic**: Backend ORM and migrations driven by `DATABASE_URL`
- **FastAPI**: Python backend for AI workflow and business logic
- **LangGraph**: Multi-step stateful AI workflow, not a single prompt
- **OpenAI-compatible API**: LLM provider swappable via 3 env vars (LLM_URL, LLM_API_KEY, LLM_MODEL_NAME)
- **Streaming**: SSE for live AI responses in UI
- **PostgreSQL**: Supported through `asyncpg` and `DATABASE_URL` for Docker/production
- **Human review**: AI recommends, human decides
- **Structured outputs**: Pydantic schemas validate all AI output

## Local Development

### Prerequisites

- Node.js 18+
- Python 3.11+
- An OpenAI-compatible LLM provider (Groq, OpenAI, Together, Ollama, or another compatible provider)

### Environment Variables

```powershell
# Copy the example for the backend (PowerShell)
if (-not (Test-Path backend/.env)) { Copy-Item .env.example backend/.env }

# LLM (OpenAI-compatible; keep the key server-side)
LLM_URL=http://localhost:11434/v1
LLM_API_KEY=ollama
LLM_MODEL_NAME=your-model-name

# Optional
NEXT_PUBLIC_API_URL=http://localhost:8000
ENABLE_STREAMING=true
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:3000`.

### Backend Setup

```powershell
cd backend
py -3 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Backend runs at `http://localhost:8000`.

### Database Setup

**Development (SQLite - no server needed):**

The FastAPI backend creates the local SQLite tables on startup. Start the backend as described above; no PostgreSQL container or separate migration command is required for the normal demo. The local database file is `backend/qpilot.db` and should not be committed.

**PostgreSQL (Docker or production):**

The backend reads `DATABASE_URL` for its runtime engine and Alembic migrations. To run the complete containerized stack:

```powershell
docker compose up --build
```

For a host-run backend connected to the Docker database, set this in `backend/.env`:

```env
DATABASE_URL=postgresql+asyncpg://qpilot:qpilot@localhost:5432/qpilot
```

### Running the Application

```powershell
# Terminal 1: Backend
cd backend
uvicorn app.main:app --reload --port 8000

# Terminal 2: Frontend
cd frontend
npm run dev
```

## Testing

See [docs/TESTING.md](docs/TESTING.md) for complete testing strategy.

```bash
# Backend - all tests
cd backend && pytest

# Backend - unit only
cd backend && pytest tests/unit/

# Backend - integration only
cd backend && pytest tests/integration/

# Backend - with coverage
cd backend && pytest --cov=app --cov-report=html

# Backend - lint
cd backend && ruff check .
cd backend && mypy app/

# Frontend - all tests
cd frontend && npm test

# Frontend - watch mode
cd frontend && npm test -- --watch

# Frontend - lint
cd frontend && npm run lint

# E2E - all
cd frontend && npm run test:e2e

# E2E - specific
cd frontend && npx playwright test e2e/pdf-upload-workflow.spec.ts --workers=1

# Frontend typecheck and production build
cd frontend && npx tsc --noEmit
cd frontend && npm run build

# Seed one local demo complaint (idempotent)
cd backend && py -3 seed_demo.py
```

## Project Structure

```
QPilot/
├── AGENTS.md              # Coding agent instructions
├── README.md              # This file
├── .env.example           # Environment variables template
├── docker-compose.yml     # PostgreSQL container
│
├── docs/                  # Project documentation
│   ├── USER_GUIDE.md
│   ├── SPECTS.md
│   ├── DESIGN.md
│   ├── IMPLEMENTATION_PLAN.md
│   ├── TESTING.md
│   ├── SKILL_MAP.md
│   ├── TODO.md
│   └── adr/
│
├── frontend/              # Next.js application
│   ├── src/app/           # Next.js App Router UI
│   ├── src/components/    # React components
│   ├── src/services/      # FastAPI API client
│   ├── src/store/         # Redux store and slices
│   ├── src/hooks/         # Custom React hooks
│   └── e2e/               # Playwright tests
│
├── backend/               # FastAPI application
│   ├── app/
│   │   ├── main.py        # FastAPI entry point
│   │   ├── config.py      # Settings
│   │   ├── api/           # API routes
│   │   ├── db/            # SQLAlchemy models and database engine
│   │   ├── schemas/       # Pydantic schemas
│   │   ├── services/      # Business logic
│   │   ├── repositories/  # Database access
│   │   ├── graph/         # LangGraph workflow
│   ├── alembic/           # Migrations
│   ├── tests/             # Test suite
│   │   └── fixtures/      # Test fixtures
│   └── requirements.txt   # Python dependencies
```

## Source-Verified PDF Demo

Use `backend/uploads/sample_complaint.pdf` for the main demonstration:

1. Start the backend and frontend.
2. Upload the PDF at `http://localhost:3000`.
3. Confirm the processing message.
4. Compare the populated form values against the PDF itself.
5. Review the AI Copilot sections: complaint type, classification, initial severity, risk factors, evidence, recommended next action, missing information, and review status.
6. Correct any field that needs attention.
7. Open Review & Commit and commit only after human QA review and confirmation.

The source PDF contains Greenfield Pharmacy, Amoxicillin 500 mg Capsules, batch `AMX-2026-B147`, manufacturing date March 2026, expiry date March 2028, and 120 affected capsules. Always verify extracted values against the source document rather than relying on an example.

`100% Complete` refers to required complaint-field completeness. It does not mean that AI analysis is complete or that QA has approved the complaint. The Copilot assessment remains a recommendation for human review.

## Demo Workflow (Pasted Text Example)

### End-to-End Complaint Processing

1. **Start**: Open QPilot at `http://localhost:3000`
2. **Input**: Upload `backend/uploads/sample_complaint.pdf` or paste a complaint:
   ```
   Apollo Pharmacy reported discolored capsules in Amoxicillin Capsules 500 mg.
   The affected batch is BMX240602 and approximately 48 capsules were reported affected.
   ```
3. **AI Extraction**: System extracts structured fields:
   - Customer: Apollo Pharmacy
   - Product: Amoxicillin Capsules
   - Strength: 500 mg
   - Batch: BMX240602
   - Quantity: 48 capsules
   - Category: Product Defect — Discoloration
4. **Risk Assessment**: AI generates:
   - Severity: Major
   - Risk factors: Product defect, batch identified
   - Recommended action: Route to QA investigation
5. **Correction**: User says "Actually, the batch is BMX240603" → system updates
6. **Review**: User reviews all AI output
7. **Commit**: User clicks "Commit to QMS" after human confirmation; the local development database records the complaint and audit information.

For the complete installation, correction, risk-assessment, and troubleshooting instructions, see [docs/USER_GUIDE.md](docs/USER_GUIDE.md).

## AI Architecture

### LangGraph Workflow

QPilot uses LangGraph as a multi-step stateful workflow engine:

```
START
  ↓
receive_input
  ↓
extract_complaint_fields (LLM, streaming)
  ↓
validate_complaint (deterministic)
  ↓
classify_complaint (LLM, streaming)
  ↓
assess_risk (LLM, streaming)
  ↓
check_completeness (deterministic)
  ↓
prepare_review
  ↓
END
```

### Streaming

AI responses stream live to the UI via Server-Sent Events (SSE):
- User sees extraction happening in real-time
- Classification appears as it's generated
- Risk assessment builds progressively
- More natural, responsive feel

### OpenAI-Compatible LLM

LLM provider is swappable by changing 3 env vars:
```bash
LLM_URL=https://api.Groq.com/openai/v1    # or OpenAI, Together, etc.
LLM_API_KEY=your_key
LLM_MODEL_NAME=google/gemma-2-9b-it        # or any compatible model
```

Works with: Groq, OpenAI, Together AI, Fireworks, local vLLM, and any OpenAI-compatible API.

### Structured Output

All AI outputs use Pydantic schemas:

```python
class ComplaintExtraction(BaseModel):
    product_name: str | None = None
    batch_number: str | None = None
    # ... more fields
```

This ensures:
- No raw text enters application state
- Missing fields are `null`, never hallucinated
- Output is validated before use

### Human Review

AI output is a recommendation, not the final record:

```
AI extraction → Human review → Accept/Edit → Commit to QMS
```

The LLM never directly writes to the database or commits complaints.

## Design Philosophy

QPilot is built on the principle that **AI should assist, not replace, human judgment** in pharmaceutical quality management.

- AI extracts, classifies, and recommends
- Human reviews, edits, and decides
- System persists, tracks, and audits

This separation ensures:
- Regulatory compliance
- Audit trail integrity
- Human accountability
- AI transparency

## Limitations

See [docs/KNOWN_LIMITATIONS.md](docs/KNOWN_LIMITATIONS.md) for the current MVP boundary and demo/test assumptions.

## License

Internal use only. Not for production deployment without further development.
