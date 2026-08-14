# QPilot — Implementation Plan

## Overview

This document defines a phased implementation approach for QPilot. Each phase has clear objectives, prerequisites, tasks, and acceptance criteria. The plan is ordered to build foundational layers first and incrementally add features.

## Phase 0 — Repository Setup

### Objective
Establish project structure, tooling, and configuration.

### Prerequisites
None.

### Tasks
1. Initialize monorepo with `frontend/` and `backend/` directories
2. Initialize Next.js project with TypeScript, Tailwind CSS
3. Initialize Python project with FastAPI, uvicorn
4. Create the root `.env.example`; backend and frontend use local ignored `.env` files when needed
5. Create `.gitignore` covering node_modules, __pycache__, .env, .next, dist
6. Create `docker-compose.yml` with PostgreSQL service
7. Set up Alembic in `backend/`
8. Install and configure ESLint, Prettier for frontend
9. Install and configure Ruff, Black for backend
10. Verify both applications start successfully

### Files/Modules
```
/
├── frontend/           # Next.js app
├── backend/            # FastAPI app
├── docker-compose.yml
├── .env.example
├── .gitignore
└── README.md
```

### Tests
- `docker-compose up` starts PostgreSQL
- `cd frontend && npm run dev` starts frontend
- `cd backend && uvicorn app.main:app` starts backend

### Acceptance Criteria
- Both applications start without errors
- PostgreSQL container runs
- `.env.example` contains all required variables

### Failure Modes
- Port conflicts → use configurable ports
- Missing Python version → document Python 3.11+ requirement

---

## Phase 1 — Domain Model

### Objective
Define core Pydantic models and data schemas used across the system.

### Prerequisites
Phase 0 complete.

### Tasks
1. Create `backend/app/schemas/complaint.py` with `ComplaintExtraction`
2. Create `backend/app/schemas/risk.py` with `RiskAssessment`
3. Create `backend/app/schemas/classification.py` with `ComplaintClassification`
4. Create `backend/app/schemas/completeness.py` with `CompletenessResult`
5. Create `backend/app/schemas/state.py` with `ComplaintState` (LangGraph state)
6. Create `backend/app/schemas/api.py` with request/response schemas
7. Write unit tests for all schemas

### Files/Modules
```
backend/app/schemas/
├── complaint.py
├── risk.py
├── classification.py
├── completeness.py
├── state.py
└── api.py
```

### Tests
- Schema validation passes for valid data
- Schema rejects invalid data
- Nullable fields accept null
- List fields accept empty lists

### Acceptance Criteria
- All schemas defined per SPECTS.md section 7
- Unit tests pass

### Failure Modes
- Schema version conflicts → pin Pydantic v2

---

## Phase 2 — Database

### Objective
Set up PostgreSQL with Alembic migrations and repository layer.

### Prerequisites
Phase 0 complete.

### Tasks
1. Create `backend/app/db/database.py` with SQLAlchemy async engine
2. Create ORM models for: complaints, risk_assessments, messages, attachments, audit_events
3. Create initial Alembic migration
4. Create `backend/app/repositories/complaint_repository.py`
5. Create `backend/app/repositories/attachment_repository.py`
6. Write repository tests with test database

### Files/Modules
```
backend/app/db/
├── database.py
├── models/
│   ├── complaint.py
│   ├── risk_assessment.py
│   ├── message.py
│   ├── attachment.py
│   └── audit_event.py
├── repositories/
│   ├── complaint_repository.py
│   └── attachment_repository.py
└── migrations/
    └── versions/
```

### Tests
- Migration applies cleanly
- CRUD operations work for each model
- Foreign key constraints enforced
- Indexes created

### Acceptance Criteria
- Database schema matches SPECTS.md section 14
- All tables created via migration
- Repository layer provides typed access

### Failure Modes
- Migration conflicts → never edit applied migrations
- Connection issues → configure connection pooling

---

## Phase 3 — FastAPI Foundation

### Objective
Establish FastAPI application with routing, error handling, and basic endpoints.

### Prerequisites
Phase 2 complete.

### Tasks
1. Create `backend/app/main.py` with FastAPI app
2. Create `backend/app/config.py` with settings from environment
3. Create `backend/app/dependencies.py` for DI
4. Create `backend/app/api/v1/router.py` with versioned router
5. Create `backend/app/api/v1/complaints.py` with all endpoints (stub implementations)
6. Create `backend/app/api/v1/health.py`
7. Add CORS middleware
8. Add global error handlers
9. Write API tests

### Files/Modules
```
backend/app/
├── main.py
├── config.py
├── dependencies.py
├── api/v1/
│   ├── router.py
│   ├── complaints.py
│   └── health.py
```

### Tests
- Health endpoint returns 200
- All complaint endpoints respond (even with stubs)
- CORS headers present
- Error responses follow schema

### Acceptance Criteria
- All endpoints from SPECTS.md section 15.1 implemented
- OpenAPI docs accessible at `/docs`

### Failure Modes
- Import errors → verify all dependencies installed
- CORS issues → configure allowed origins

---

## Phase 4 — LangGraph State and Workflow Shell

### Objective
Set up LangGraph workflow with typed state and node structure.

### Prerequisites
Phase 1 complete.

### Tasks
1. Create `backend/app/graph/state.py` with `ComplaintState` definition
2. Create `backend/app/graph/workflow.py` with StateGraph
3. Create stub nodes for all workflow steps
4. Define explicit transitions between nodes
5. Add basic state persistence (in-memory for now)
6. Write workflow unit tests

### Files/Modules
```
backend/app/graph/
├── state.py
├── workflow.py
└── nodes/
    ├── __init__.py
    ├── receive_input.py
    ├── extract_fields.py
    ├── validate.py
    ├── classify.py
    ├── risk.py
    ├── completeness.py
    └── prepare_review.py
```

### Tests
- Workflow graph compiles
- State transitions execute without error
- Each node returns expected state shape

### Acceptance Criteria
- LangGraph workflow defined with explicit transitions
- State model matches SPECTS.md section 10.1
- Workflow runs end-to-end (stub nodes)

### Failure Modes
- LangGraph version issues → pin version
- State type errors → use strict Pydantic models

---

## Phase 5 — Complaint Extraction

### Objective
Implement AI-powered extraction of structured complaint fields from text with streaming support.

### Prerequisites
Phase 1, Phase 4 complete.

### Tasks
1. Create `backend/app/services/llm_service.py` with OpenAI-compatible client (uses `LLM_URL`, `LLM_API_KEY`, `LLM_MODEL_NAME` env vars)
2. Implement streaming support via SSE (Server-Sent Events)
3. Create extraction prompt template
4. Implement `extract_complaint_fields` node with structured output
5. Add output validation against `ComplaintExtraction` schema
6. Handle LLM failures gracefully (timeout, rate limit, malformed output)
7. Write unit tests with mocked LLM responses

### Files/Modules
```
backend/app/services/
├── llm_service.py

backend/app/graph/nodes/
└── extract_fields.py  (implement)

backend/app/prompts/
└── extraction.py
```

### Tests
- Valid complaint text produces valid extraction
- Missing fields are null, not hallucinated
- LLM failure returns error state
- Schema validation catches malformed output
- Streaming yields partial results correctly

### Acceptance Criteria
- Extraction produces `ComplaintExtraction` from natural language
- All fields from SPECTS.md section 7.1 supported
- Output validated before state update
- Streaming works: UI shows live extraction progress

### Failure Modes
- LLM API key missing → clear error message
- Rate limiting → retry with backoff
- Malformed output → validation error handling
- Streaming connection drops → graceful fallback to batch

---

## Phase 6 — Complaint Classification

### Objective
Implement AI complaint categorization.

### Prerequisites
Phase 5 complete.

### Tasks
1. Create classification prompt template
2. Implement `classify_complaint` node
3. Validate output against `ComplaintClassification` schema
4. Map to defined categories from SPECTS.md section 8
5. Write unit tests

### Files/Modules
```
backend/app/graph/nodes/
└── classify.py  (implement)

backend/app/prompts/
└── classification.py
```

### Tests
- Classification returns valid category
- Subcategory present when applicable
- Reasoning is grounded in complaint data

### Acceptance Criteria
- Classification matches SPECTS.md section 8 categories
- Output includes reasoning

### Failure Modes
- Unknown category → handle gracefully
- LLM returns invalid category → validation + fallback

---

## Phase 7 — Risk Assessment

### Objective
Implement explainable AI risk assessment.

### Prerequisites
Phase 5, Phase 6 complete.

### Tasks
1. Create risk assessment prompt template
2. Implement `assess_risk` node
3. Validate output against `RiskAssessment` schema
4. Ensure reasoning is grounded in complaint data
5. Implement completeness check node
6. Write unit tests

### Files/Modules
```
backend/app/graph/nodes/
├── risk.py  (implement)
└── completeness.py  (implement)

backend/app/prompts/
└── risk.py
```

### Tests
- Risk assessment returns severity, factors, reasoning
- Completeness score calculated correctly
- Missing fields identified deterministically

### Acceptance Criteria
- Risk assessment matches SPECTS.md section 7.2
- Completeness check is deterministic (no LLM for field presence)
- AI explanation is optional enhancement only

### Failure Modes
- LLM invents risk factors → prompt constraint + validation
- Completeness logic error → thorough test coverage

---

## Phase 8 — Next.js UI Foundation

### Objective
Set up Next.js frontend with layout, routing, and base components.

### Prerequisites
Phase 0 complete.

### Tasks
1. Create app layout with header, main content area, copilot panel
2. Create `AppShell` component
3. Create `Header` component with QPilot branding
4. Create base panel layout (60/40 split)
5. Set up Tailwind CSS configuration with design tokens
6. Create base UI components: Button, Input, Select, Badge, Card
7. Configure Inter font

### Files/Modules
```
frontend/app/
├── layout.tsx
├── page.tsx
└── globals.css

frontend/components/
├── layout/
│   ├── AppShell.tsx
│   ├── Header.tsx
│   └── PanelLayout.tsx
└── ui/
    ├── Button.tsx
    ├── Input.tsx
    ├── Select.tsx
    ├── Badge.tsx
    ├── Card.tsx
    └── Textarea.tsx
```

### Tests
- Components render without errors
- Layout matches design spec dimensions
- All UI components accessible

### Acceptance Criteria
- Layout matches DESIGN.md section 2
- Design tokens from DESIGN.md section 20-21 configured
- Inter font loaded

### Failure Modes
- Font loading issues → use system font fallback
- Tailwind config errors → validate config

---

## Phase 9 — Redux Integration

### Objective
Set up Redux Toolkit with complaint, copilot, upload, and UI slices.

### Prerequisites
Phase 8 complete.

### Tasks
1. Create `frontend/store/store.ts` with configured store
2. Create `frontend/features/complaint/complaintSlice.ts`
3. Create `frontend/features/copilot/copilotSlice.ts`
4. Create `frontend/features/upload/uploadSlice.ts`
5. Create `frontend/features/ui/uiSlice.ts`
6. Create typed hooks: `useAppDispatch`, `useAppSelector`
7. Create `frontend/types/index.ts` with TypeScript interfaces

### Files/Modules
```
frontend/store/
└── store.ts

frontend/features/
├── complaint/
│   ├── complaintSlice.ts
│   └── complaintSelectors.ts
├── copilot/
│   ├── copilotSlice.ts
│   └── copilotSelectors.ts
├── upload/
│   ├── uploadSlice.ts
│   └── uploadSelectors.ts
└── ui/
    ├── uiSlice.ts
    └── uiSelectors.ts

frontend/hooks/
├── useAppDispatch.ts
└── useAppSelector.ts

frontend/types/
└── index.ts
```

### Tests
- Store initializes correctly
- Slices dispatch and reduce correctly
- Selectors return expected state

### Acceptance Criteria
- Redux state matches SPECTS.md section 12
- State boundaries per DESIGN.md / SPECTS.md

### Failure Modes
- TypeScript errors → strict mode catches early

---

## Phase 10 — Complaint Form UI

### Objective
Build the complaint form with all fields and AI-populated states.

### Prerequisites
Phase 8, Phase 9 complete.

### Tasks
1. Create `ComplaintForm` component
2. Create `ComplaintField` component with states (empty, populated, missing, edited)
3. Create `CompletenessBadge` component
4. Create `ComplaintStatus` badge component
5. Connect form to Redux complaint slice
6. Implement field edit handling
7. Implement form layout per DESIGN.md section 4

### Files/Modules
```
frontend/components/complaint/
├── ComplaintForm.tsx
├── ComplaintField.tsx
├── ComplaintStatus.tsx
└── CompletenessBadge.tsx
```

### Tests
- Form renders all fields
- Fields show correct states
- Edit updates Redux state
- Completeness badge displays correctly

### Acceptance Criteria
- Form matches DESIGN.md section 4
- All field states per section 4.2 work
- Completeness badge per section 4.4

### Failure Modes
- Field state management complexity → keep state in Redux, UI local only for focus

---

## Phase 11 — AI Copilot UI

### Objective
Build the copilot panel with chat, risk assessment, and classification display.

### Prerequisites
Phase 8, Phase 9, Phase 7 complete.

### Tasks
1. Create `CopilotPanel` component
2. Create `ChatMessage` component
3. Create `ChatComposer` component
4. Create `RiskAssessmentCard` component
5. Create `ClassificationBadge` component
6. Create `RecommendationList` component
7. Connect to Redux copilot slice

### Files/Modules
```
frontend/components/copilot/
├── CopilotPanel.tsx
├── ChatMessage.tsx
├── ChatComposer.tsx
├── RiskAssessmentCard.tsx
├── ClassificationBadge.tsx
└── RecommendationList.tsx
```

### Tests
- Copilot panel renders states correctly
- Chat messages display properly
- Risk card shows severity, factors, reasoning

### Acceptance Criteria
- All states from DESIGN.md section 5 implemented
- Risk card matches section 10
- Classification matches section 11

### Failure Modes
- Message rendering performance → virtualize if needed

---

## Phase 12 — API Integration

### Objective
Connect frontend to FastAPI backend.

### Prerequisites
Phase 3, Phase 9, Phase 10, Phase 11 complete.

### Tasks
1. Create `frontend/services/api.ts` with typed API client
2. Implement complaint creation flow
3. Implement complaint processing flow
4. Implement message sending flow
5. Implement complaint fetch flow
6. Handle loading states in UI
7. Handle error states in UI
8. Write integration tests

### Files/Modules
```
frontend/services/
└── api.ts

frontend/hooks/
└── useComplaintApi.ts
```

### Tests
- API client sends correct requests
- Loading states display during processing
- Error states display on failure
- Complaint data flows from API to Redux to UI

### Acceptance Criteria
- Full complaint intake flow works end-to-end
- API contract matches SPECTS.md section 15

### Failure Modes
- Network errors → retry logic + error UI
- API contract mismatch → validate with types

---

## Phase 13 — User Corrections

### Objective
Implement conversational correction of extracted fields.

### Prerequisites
Phase 5, Phase 12 complete.

### Tasks
1. Implement `apply_correction` node in LangGraph
2. Parse correction intent from user message
3. Update specific fields in complaint state
4. Trigger re-analysis of dependent assessments
5. Update UI to reflect corrections
6. Add correction messages to conversation history
7. Write tests

### Files/Modules
```
backend/app/graph/nodes/
└── apply_correction.py

backend/app/services/
└── correction_service.py
```

### Tests
- Single field correction updates correctly
- Multiple field correction in one message
- Correction triggers re-classification when category-related
- Conversation history preserved

### Acceptance Criteria
- Corrections per SPECTS.md FR-040 to FR-044
- UI updates immediately after correction

### Failure Modes
- Ambiguous corrections → ask for clarification
- Correction to non-existent field → error message

---

## Phase 14 — PDF Ingestion

### Objective
Implement PDF upload and text extraction.

### Prerequisites
Phase 3, Phase 5 complete.

### Tasks
1. Create `backend/app/services/file_service.py` for file handling
2. Implement PDF text extraction (using PyMuPDF or pdfplumber)
3. Create upload endpoint implementation
4. Handle file validation (type, size)
5. Generate safe filenames
6. Store file metadata in database
7. Pipe extracted text through complaint extraction
8. Write tests

### Files/Modules
```
backend/app/services/
└── file_service.py

backend/app/graph/nodes/
└── extract_document_text.py
```

### Tests
- Valid PDF uploads and extracts text
- Empty PDF returns appropriate error
- Invalid file type rejected
- File size limit enforced
- Extracted text feeds into extraction pipeline

### Acceptance Criteria
- Upload flow matches DESIGN.md section 7
- Text extraction works for text-based PDFs
- Errors handled gracefully

### Failure Modes
- Scanned PDFs → warn user, no OCR for MVP
- Large files → enforce 10MB limit
- Corrupted files → catch and report

---

## Phase 15 — Human Review & QMS Commit

### Objective
Implement review workflow and final QMS commit.

### Prerequisites
Phase 10, Phase 12, Phase 13 complete.

### Tasks
1. Create `ReviewPanel` component
2. Create `CommitButton` component
3. Implement review state transitions
4. Implement commit endpoint in FastAPI
5. Add audit event on commit
6. Add confirmation modal for commit
7. Implement post-commit state
8. Write tests

### Files/Modules
```
frontend/components/review/
├── ReviewPanel.tsx
└── CommitButton.tsx

backend/app/services/
└── complaint_service.py  (implement commit logic)
```

### Tests
- Review panel shows all AI content
- Commit only available when READY_TO_COMMIT
- Commit stores in database
- Audit event created
- Status transitions correctly

### Acceptance Criteria
- Review flow per DESIGN.md section 14
- Commit flow per section 15
- Committed complaint in PostgreSQL

### Failure Modes
- Double-commit → idempotency check
- Database error → transaction rollback

---

## Phase 16 — Completeness Checker

### Objective
Implement deterministic completeness scoring.

### Prerequisites
Phase 2, Phase 5 complete.

### Tasks
1. Define required fields list
2. Implement deterministic completeness calculation
3. Add optional LLM explanation for missing fields
4. Integrate with complaint form UI
5. Write tests

### Files/Modules
```
backend/app/services/
└── completeness_service.py

frontend/components/complaint/
└── CompletenessBadge.tsx
```

### Tests
- 100% score when all fields present
- Correct missing fields identified
- Score matches missing field count

### Acceptance Criteria
- Completeness per SPECTS.md FR-050 to FR-053
- Badge per DESIGN.md section 4.4

### Failure Modes
- Required field list maintenance → keep configurable

---

## Phase 17 — Duplicate Detection (Bonus)

### Objective
Implement potential duplicate identification.

### Prerequisites
Phase 2, Phase 5 complete.

### Tasks
1. Implement deterministic candidate filtering (product, batch, date range)
2. Calculate description similarity
3. Score potential duplicates
4. Display in copilot panel
5. Write tests

### Files/Modules
```
backend/app/services/
└── duplicate_service.py
```

### Tests
- Same product + batch detected
- Different product not flagged
- Score threshold appropriate

### Acceptance Criteria
- Detection per SPECTS.md FR-060 to FR-063
- Results labeled "Potential Duplicate"

### Failure Modes
- False positives → conservative threshold
- Performance → index on product + batch

---

## Phase 18 — Testing (Distributed)

### Objective
Comprehensive test coverage across all phases.

### Testing Approach
Tests are written alongside each phase, not deferred to a single phase. Each implementation phase includes its own test tasks. Phase 18 covers integration, E2E, and cross-cutting tests that require the full system.

### Backend Test Framework
- pytest + pytest-asyncio + httpx + pytest-cov
- ruff + mypy for static checks

### Frontend Test Framework
- Vitest + React Testing Library + @testing-library/jest-dom
- ESLint + TypeScript for static checks

### E2E Framework
- Playwright

### Test Database
- Separate PostgreSQL instance for tests
- Alembic migrations applied to test DB
- Tests use isolated transactions (rollback after each test)

### Mock LLM Strategy
- `MockLLM` class with predefined scenarios
- Scenarios: successful extraction, missing fields, malformed JSON, timeout, rate limit, hallucinated fields
- Live Groq tests separated in `tests/ai_live/` (require API key, not run in CI)

### Tasks
1. Backend unit tests (schemas, services, business rules)
2. Backend integration tests (API, DB, LangGraph)
3. Frontend unit tests (Redux, components)
4. E2E tests (Playwright)
5. Security tests (prompt injection, file upload, input validation)
6. AI reliability tests (hallucination, malformed output)
7. Accessibility tests (keyboard nav, ARIA)
8. Coverage reports (>80% backend, >75% frontend)

### Files/Modules
```
backend/tests/
├── unit/
│   ├── test_complaint_schema.py
│   ├── test_risk_schema.py
│   ├── test_classification_schema.py
│   ├── test_completeness_schema.py
│   ├── test_state_schema.py
│   ├── test_llm_service.py
│   ├── test_extraction_service.py
│   ├── test_status_transitions.py
│   ├── test_file_validation.py
│   └── test_completeness_calc.py
├── integration/
│   ├── test_workflow_happy_path.py
│   ├── test_workflow_missing_info.py
│   ├── test_workflow_correction.py
│   ├── test_complaint_repository.py
│   ├── test_create_complaint.py
│   ├── test_process_complaint.py
│   ├── test_send_message.py
│   ├── test_upload_file.py
│   └── test_commit_complaint.py
├── ai_live/
│   └── test_groq_extraction.py
└── mocks/
    ├── mock_llm.py
    └── scenarios/

frontend/__tests__/
├── features/
│   ├── complaintSlice.test.ts
│   ├── copilotSlice.test.ts
│   ├── uploadSlice.test.ts
│   └── uiSlice.test.ts
├── components/
│   ├── ComplaintForm.test.tsx
│   ├── CopilotPanel.test.tsx
│   ├── RiskAssessmentCard.test.tsx
│   └── FileUpload.test.tsx

tests/e2e/
├── complaint-workflow.spec.ts
├── correction-workflow.spec.ts
├── pdf-upload-workflow.spec.ts
├── failure-recovery.spec.ts
└── accessibility.spec.ts
```

### Tests
- TEST-001 through TEST-008 from SPECTS.md
- Schema validation (valid, missing, invalid, boundary)
- Status transition valid/invalid paths
- AI hallucination prevention
- Malformed output handling
- Prompt injection resilience
- File security (oversized, wrong type, dangerous filename)

### Acceptance Criteria
- All test scenarios from SPECTS.md section 19 covered
- Backend coverage >80%
- Frontend coverage >75%
- E2E happy path passes
- Tests pass in CI

### Failure Modes
- Flaky tests → isolate external dependencies
- LLM-dependent tests → use mocks, live tests optional
- DB test isolation → use transactions + rollback

---

## Phase 19 — UX Polish

### Objective
Refine UI to match DESIGN.md specifications.

### Prerequisites
Phase 10, Phase 11, Phase 12 complete.

### Tasks
1. Implement loading skeletons
2. Implement empty states
3. Implement error states
4. Add toast notifications
5. Refine spacing and typography
6. Add animations (subtle, professional)
7. Implement responsive behavior
8. Add keyboard navigation
9. Accessibility audit

### Files/Modules
Various component files.

### Tests
- Visual regression tests (if available)
- Accessibility tests
- Keyboard navigation tests

### Acceptance Criteria
- All states from DESIGN.md sections 16-18 implemented
- Accessibility per section 24

### Failure Modes
- Animation performance → keep subtle

---

## Phase 20 — Demo Preparation

### Objective
Prepare for demonstration and interview.

### Prerequisites
Phase 18, Phase 19 complete.

### Tasks
1. Create seed data for demo complaint
2. Ensure all P0 features work end-to-end
3. Practice walkthrough of architecture
4. Prepare ADR documents for key decisions
5. Document known limitations
6. Create screenshot placeholders
7. Test full demo flow

### Files/Modules
```
docs/
├── adr/
│   ├── 001-nextjs-frontend.md
│   ├── 002-redux-state.md
│   ├── 003-fastapi-backend.md
│   ├── 004-langgraph-workflow.md
│   ├── 005-postgresql-database.md
│   ├── 006-human-review.md
│   ├── 007-structured-output.md
│   └── 008-llm-not-database.md
└── demo/
    └── seed_data.json
```

### Tests
- Full demo flow works
- Architecture decisions defensible

### Acceptance Criteria
- Demo complaint processes successfully
- Developer can explain all architecture decisions

### Failure Modes
- Demo data issues → prepare multiple scenarios

---

## Deferred Features

The following are explicitly deferred and should NOT be implemented before P0 is complete:

| Feature | Phase | Reason |
|---------|-------|--------|
| Authentication | Post-MVP | Single-user sufficient for demo |
| Complaint list/dashboard | Post-MVP | Single complaint focus |
| Export (CSV/PDF) | Post-MVP | Not required for core workflow |
| Image input | Post-MVP | Not required for MVP |
| Streaming AI | Post-MVP | Batch sufficient |
| Root cause recommendations | P3 | Bonus only |
| CAPA suggestions | P3 | Bonus only |

## Implementation Order Summary

```
Phase 0  → Setup
Phase 1  → Domain model              + schema unit tests
Phase 2  → Database                  + repository integration tests
Phase 3  → FastAPI                   + API endpoint tests
Phase 4  → LangGraph shell           + workflow unit tests
Phase 5  → Extraction (core AI)      + extraction tests (mocked LLM) + streaming
Phase 6  → Classification            + classification tests
Phase 7  → Risk assessment           + risk + completeness tests
Phase 8  → Next.js UI                + component render tests
Phase 9  → Redux                     + slice unit tests
Phase 10 → Complaint form            + form state tests
Phase 11 → Copilot UI                + copilot component tests
Phase 12 → API integration           + frontend integration tests
Phase 13 → User corrections          + correction flow tests
Phase 14 → PDF ingestion             + file handling tests
Phase 15 → Review & commit           + commit flow tests
Phase 16 → Completeness (P1)         + completeness tests
Phase 17 → Duplicate detection (P2)  + duplicate tests
Phase 18 → Testing (integration, E2E, security, AI reliability)
Phase 19 → UX polish                 + accessibility tests
Phase 20 → Demo prep                 + demo flow verification
```

**Testing is embedded in each phase, not deferred to Phase 18.**
Phase 18 covers cross-cutting tests that require the full system.
