# QPilot — Agent Instructions

## Project Context

QPilot is an AI-powered Customer Complaint Management System for pharmaceutical manufacturing. It functions as a copilot for quality personnel, converting unstructured customer complaints into structured QMS complaint records. The system does NOT replace QA personnel or make autonomous regulatory decisions.

## Before Starting Any Task

1. Read `SPECTS.md` for requirements and schemas.
2. Read `DESIGN.md` for UI/UX specifications.
3. Read `IMPLEMENTATION_PLAN.md` for phased approach.
4. Read `TESTING.md` for testing strategy and conventions.
5. Read `TODO.md` for current task status.
6. Read `SKILL_MAP.md` for which skill to use for each task type.
7. Read existing code before making changes.
8. Understand existing patterns before introducing new ones.

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16+, React 19+, TypeScript, Redux Toolkit, Tailwind CSS v4 |
| UI Components | shadcn/ui |
| Animations | motion.dev (Framer Motion) |
| Backend | Python 3.11+, FastAPI, LangGraph |
| LLM | OpenAI-compatible API (Groq default, swappable via env vars) |
| Database (Dev) | SQLite via Prisma 7 (file-based, no server needed) |
| Database (Prod) | PostgreSQL 15+ via Prisma 7 |
| ORM | Prisma 7 with driver adapters |
| Testing | Playwright (E2E), pytest (backend) |
| Font | Geist (default Next.js font) |

## Architecture Constraints

### Frontend/Backend Separation

- Next.js handles UI only. No AI logic in Next.js.
- FastAPI handles all business logic, AI orchestration, and database access.
- Next.js communicates with FastAPI exclusively via HTTP REST API.
- Do NOT use Next.js API routes for business logic.

### AI Constraints

- All AI outputs must use structured Pydantic schemas. No raw text into state.
- Validate AI output before applying to application state.
- The LLM MUST NOT execute SQL or write to the database directly.
- The LLM MUST NOT commit complaints to QMS directly.
- The LLM MUST NOT fabricate information for missing fields. Use `null` or `"not provided"`.
- The LLM is an intelligence layer, not the system of record.
- Human review is mandatory before any QMS commit.
- Use OpenAI-compatible API format (Groq, OpenAI, Together, etc.).
- LLM provider swappable by changing 3 env vars: LLM_URL, LLM_API_KEY, LLM_MODEL_NAME.
- Streaming via SSE for live UI updates (backend streams to frontend).

### LangGraph Constraints

- LangGraph is the workflow engine, not a single LLM call wrapper.
- State must use typed Pydantic models, not unrestricted dicts.
- Every node must have a clear, non-redundant purpose.
- Transitions must be explicit and documented.
- Streaming: each node can yield partial results for live UI updates.

## Coding Conventions

### General

- Use meaningful variable and function names.
- Keep functions focused on a single responsibility.
- Write code that is interview-defensible: clear, simple, explainable.
- Avoid premature optimization or unnecessary abstractions.

### TypeScript/Frontend

- Use TypeScript strict mode.
- Prefer named exports over default exports.
- Components: PascalCase. Files: kebab-case.
- Redux slices: one per domain area (complaint, copilot, upload, ui).
- Keep components small and composable.

### Python/Backend

- Follow PEP 8.
- Use Pydantic v2 models for all request/response/state schemas.
- Services layer for business logic. Repositories for database access.
- Type hints on all function signatures.
- Async/await for I/O-bound operations.

### Database

- Use Prisma 7 for ORM (not Alembic for frontend).
- SQLite for development (file-based, zero config).
- PostgreSQL for production (swap via DATABASE_URL env var).
- Never edit migrations after they are applied.
- Use transactions for multi-step operations.
- Primary keys: CUID (Prisma default). Timestamps: UTC.
- Foreign keys with explicit ON DELETE behavior.
- JSON fields for complex AI outputs (flexible schema).

## Testing Conventions

See `TESTING.md` for complete testing strategy.

### Unit Tests

- Test individual functions and services.
- Mock external dependencies (LLM, database).
- Aim for high coverage on business logic.
- Write tests alongside implementation (not deferred).

### Integration Tests

- Test API endpoints with test database.
- Test LangGraph workflow execution.
- Test database operations through repository layer.

### End-to-End Tests

- Test critical user journeys.
- Complaint intake → extraction → review → commit.
- Use Playwright for browser automation.

### AI Reliability Tests

- Mock LLM for most tests (deterministic).
- Test hallucination prevention (missing fields → null).
- Test malformed output handling.
- Test prompt injection resilience.
- Live AI tests optional, separated in `tests/ai_live/`.

### Running Tests

```bash
# Backend
cd backend && pytest

# Backend with coverage
cd backend && pytest --cov=app --cov-report=html

# Frontend lint
cd frontend && npm run lint

# E2E
cd frontend && npx playwright test
```

### Test Conventions

- Backend tests use `pytest` with mocked LLM calls and isolated SQLite test data.
- Frontend unit tests use Vitest and Testing Library; assert public behavior rather than implementation details.
- Playwright tests cover the browser workflow with deterministic API mocks, including PDF upload, AI analysis, correction, review, and commit.
- Run `npx tsc --noEmit` and `npm run build` for frontend release verification.
- Live AI tests are opt-in and must never be required for CI.

### Database Commands

```bash
# Run Prisma migrations
cd frontend && npx prisma migrate dev

# Generate Prisma Client
cd frontend && npx prisma generate

# Open Prisma Studio (visual DB editor)
cd frontend && npx prisma studio

# Reset database (development only)
cd frontend && npx prisma migrate reset
```

## Security Rules

- API keys: server-side only. Never in client JavaScript.
- `.env` files: always in `.gitignore`. Never committed.
- `.env.example`: always committed with placeholder values.
- Input validation on all API endpoints.
- File upload: validate type and size. Use safe filenames.
- No arbitrary SQL from user input or LLM output.
- No secrets in Redux state or browser storage.

## Committing Code

- Do NOT commit unless explicitly asked.
- Before committing: run `pytest` (backend) and `npm test` (frontend).
- Write clear commit messages explaining what changed and why.
- Do not commit `.env`, node_modules, `__pycache__`, or database files.

## Agent Behavior Rules

1. Read documentation before coding.
2. Understand existing code before changing it.
3. Make incremental, focused changes.
4. Run tests after changes.
5. Avoid unrelated refactors.
6. Explain significant architectural changes before implementing.
7. Never silently change core architecture.
8. If unsure about a requirement, check `SPECTS.md` first.
9. Prefer extending existing patterns over inventing new ones.
10. Ask before introducing new dependencies.

## What NOT To Do

- Do not create microservices, Kubernetes, Kafka, Redis, or complex distributed systems.
- Do not add vector databases unless specifically required.
- Do not implement enterprise IAM or multi-tenant architecture.
- Do not build production-grade OCR.
- Do not add features from P2/P3 before completing P0.
- Do not use the LLM to validate whether a simple required field is null.
- Do not let the AI make final regulatory decisions.
- Do not create pixel-perfect UI duplication — functionality and general workflow match is sufficient.
