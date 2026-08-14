# QPilot — Task Tracker

> Master checklist for implementation + testing.
> Check off tasks as completed. Status: `[ ]` pending, `[x]` done.

---

## Phase 0 — Repository Setup

- [x] Create monorepo root with `frontend/` and `backend/`
- [x] Initialize Next.js project (TypeScript, Tailwind, App Router)
- [x] Initialize Python project (FastAPI, uvicorn, Pydantic v2)
- [x] Create `docker-compose.yml` with PostgreSQL 15
- [x] Create root `.env.example` with all variables
- [x] Create root `.gitignore`
- [x] Set up Alembic in `backend/`
- [x] Install/configure ESLint + Prettier (frontend)
- [x] Install/configure Ruff + mypy (backend)
- [x] Verify both apps start without errors

---

## Phase 1 — Domain Model (Backend Schemas)

- [x] `backend/app/schemas/complaint.py` — ComplaintExtraction
- [x] `backend/app/schemas/risk.py` — RiskAssessment
- [x] `backend/app/schemas/classification.py` — ComplaintClassification
- [x] `backend/app/schemas/completeness.py` — CompletenessResult
- [x] `backend/app/schemas/state.py` — ComplaintState (LangGraph)
- [x] `backend/app/schemas/api.py` — Request/Response schemas
- [x] Unit tests: schema validation (valid data)
- [x] Unit tests: schema validation (missing optional fields)
- [x] Unit tests: schema validation (invalid types rejected)
- [x] Unit tests: boundary values (empty string, 0, null, large numbers)

---

## Phase 2 — Database

- [x] `backend/app/db/database.py` — async SQLAlchemy engine
- [x] ORM model: complaints
- [x] ORM model: risk_assessments
- [x] ORM model: messages
- [x] ORM model: attachments
- [x] ORM model: audit_events
- [x] Initial Alembic migration
- [x] `backend/app/repositories/complaint_repository.py`
- [x] `backend/app/repositories/attachment_repository.py`
- [x] Integration tests: CRUD for each model
- [x] Integration tests: foreign key constraints
- [x] Integration tests: indexes created
- [x] Test database isolation (no dev data corruption)

---

## Phase 3 — FastAPI Foundation

- [x] `backend/app/main.py` — FastAPI app + CORS
- [x] `backend/app/config.py` — settings from env
- [x] `backend/app/dependencies.py` — DI
- [x] `backend/app/api/v1/router.py` — versioned router
- [x] `backend/app/api/v1/health.py` — health endpoint
- [x] `backend/app/api/v1/complaints.py` — all endpoints (stubs)
- [x] Global error handlers
- [x] Integration tests: health endpoint
- [x] Integration tests: all endpoints respond
- [x] Integration tests: CORS headers
- [x] Integration tests: error response format
- [x] OpenAPI docs accessible at `/docs`

---

## Phase 4 — LangGraph Workflow Shell

- [x] `backend/app/graph/state.py` — ComplaintState definition
- [x] `backend/app/graph/workflow.py` — StateGraph
- [x] Stub nodes: receive_input, extract_fields, validate, classify, risk, completeness, prepare_review
- [x] Explicit transitions between nodes
- [x] Unit tests: graph compiles
- [x] Unit tests: state transitions execute
- [x] Unit tests: each node returns expected shape

---

## Phase 5 — Complaint Extraction (Core AI)

- [x] `backend/app/services/llm_service.py` — OpenAI-compatible client (uses LLM_URL, LLM_API_KEY, LLM_MODEL_NAME)
- [x] Implement streaming support via SSE
- [x] Extraction prompt template
- [x] `backend/app/graph/nodes/extract_fields.py` — implement
- [x] Output validation against ComplaintExtraction schema
- [x] LLM failure handling (timeout, API error, rate limit)
- [x] `backend/app/prompts/extraction.py`
- [x] Unit tests: valid complaint produces valid extraction
- [x] Unit tests: missing fields are null (not hallucinated)
- [x] Unit tests: LLM failure returns error state
- [x] Unit tests: malformed output caught by validation
- [x] Unit tests: streaming yields partial results correctly
- [x] Mock LLM scenarios: successful extraction, missing fields, malformed JSON, timeout

---

## Phase 6 — Complaint Classification

- [x] Classification prompt template
- [x] `backend/app/graph/nodes/classify.py` — implement
- [x] Output validation against ComplaintClassification schema
- [x] `backend/app/prompts/classification.py`
- [x] Unit tests: valid category returned
- [x] Unit tests: subcategory present when applicable
- [x] Unit tests: reasoning grounded in complaint data
- [x] Unit tests: unknown category handled gracefully

---

## Phase 7 — Risk Assessment

- [x] Risk assessment prompt template
- [x] `backend/app/graph/nodes/risk.py` — implement
- [x] Output validation against RiskAssessment schema
- [x] `backend/app/graph/nodes/completeness.py` — implement
- [x] Deterministic completeness calculation
- [x] `backend/app/prompts/risk.py`
- [x] Unit tests: severity + factors + reasoning returned
- [x] Unit tests: completeness score calculated correctly
- [x] Unit tests: missing fields identified deterministically
- [x] Unit tests: AI does not invent risk factors
- [x] Unit tests: confidence in valid range

---

## Phase 8 — Next.js UI Foundation

- [x] App layout (header, main, copilot panel)
- [x] `AppShell` component
- [x] `Header` component with QPilot branding
- [x] Panel layout (60/40 split)
- [x] Tailwind config with design tokens (colors, spacing)
- [x] Base UI components: Button, Input, Select, Badge, Card, Textarea
- [x] Geist font loaded
- [x] Unit tests: components render

---

## Phase 9 — Redux Integration

- [x] `frontend/store/store.ts` — configured store
- [x] `frontend/features/complaint/complaintSlice.ts`
- [x] `frontend/features/copilot/copilotSlice.ts`
- [x] `frontend/features/upload/uploadSlice.ts`
- [x] `frontend/features/ui/uiSlice.ts`
- [x] Typed hooks: useAppDispatch, useAppSelector
- [x] `frontend/types/index.ts` — TypeScript interfaces
- [x] Unit tests: store initializes
- [x] Unit tests: each slice dispatches/reduces correctly
- [x] Unit tests: selectors return expected state

---

## Phase 10 — Complaint Form UI

- [x] `ComplaintForm` component
- [x] `ComplaintField` component (empty/populated/missing/edited states)
- [x] `CompletenessBadge` component
- [x] `ComplaintStatus` badge component
- [x] Connect form to Redux complaint slice
- [x] Field edit handling (via ComplaintField + dispatch)
- [x] Unit tests: form renders all fields
- [x] Unit tests: fields show correct states
- [x] Unit tests: edit updates Redux state
- [x] Unit tests: completeness badge displays correctly

---

## Phase 11 — AI Copilot UI

- [x] `CopilotPanel` component
- [x] `ChatMessage` component
- [x] `ChatComposer` component
- [x] `RiskAssessmentCard` component
- [x] `ClassificationBadge` component
- [x] `RecommendationList` component
- [x] Connect to Redux copilot slice
- [x] Unit tests: all states render (empty, loading, success, error)
- [x] Unit tests: risk card shows severity/factors/reasoning
- [x] Unit tests: classification displays correctly

---

## Phase 12 — API Integration

- [x] `frontend/services/api.ts` — typed API client
- [x] `frontend/hooks/useComplaintApi.ts`
- [x] Complaint creation flow
- [x] Complaint processing flow (AiAssistantPanel calls process)
- [x] Message sending flow (AiAssistantPanel calls sendMessage/correct)
- [x] Complaint fetch flow
- [x] Loading states in UI
- [x] Error states in UI
- [x] Integration tests: API client sends correct requests
- [x] Integration tests: loading/error states display

---

## Phase 13 — User Corrections

- [x] `backend/app/graph/nodes/apply_correction.py`
- [x] `backend/app/services/correction_service.py`
- [x] Parse correction intent from user message
- [x] Update specific fields in complaint state
- [x] Trigger re-analysis when relevant fields change (correction_workflow)
- [x] Correction messages added to conversation history
- [x] Unit tests: single field correction
- [x] Unit tests: multiple fields in one message
- [x] Unit tests: correction triggers re-classification
- [x] Unit tests: unrelated fields remain unchanged
- [x] Unit tests: corrections do not create new complaints

---

## Phase 14 — PDF Ingestion

- [x] `backend/app/services/file_service.py` — file handling
- [x] PDF text extraction (PyMuPDF or pdfplumber)
- [x] Upload endpoint implementation
- [x] File validation (type, size)
- [x] Safe filename generation (UUID-based)
- [x] File metadata stored in database
- [x] Extracted text feeds into extraction pipeline
- [x] `backend/app/graph/nodes/extract_document_text.py`
- [x] Unit tests: valid PDF uploads and extracts text
- [x] Unit tests: empty PDF returns error
- [x] Unit tests: invalid file type rejected
- [x] Unit tests: file size limit enforced
- [x] Unit tests: dangerous filenames sanitized
- [x] Unit tests: extracted text feeds into pipeline

---

## Phase 15 — Human Review & QMS Commit

- [x] `ReviewPanel` component
- [x] `CommitButton` component
- [x] Review state transitions
- [x] Commit endpoint in FastAPI
- [x] Audit event on commit (complaint_service.py)
- [x] Confirmation modal for commit
- [x] Post-commit state
- [x] `backend/app/services/complaint_service.py` — commit logic
- [x] Unit tests: review panel shows all AI content
- [x] Unit tests: commit only available when READY_TO_COMMIT
- [x] Unit tests: commit stores in database
- [x] Unit tests: audit event created
- [x] Unit tests: status transitions correctly
- [x] Unit tests: double-commit prevented (idempotency)

---

## Phase 16 — Completeness Checker (P1)

- [x] Required fields list (configurable)
- [x] Deterministic completeness calculation
- [x] Optional LLM explanation for missing fields
- [x] Integrate with complaint form UI
- [x] Unit tests: 100% score when all fields present
- [x] Unit tests: correct missing fields identified
- [x] Unit tests: score matches missing field count

---

## Phase 17 — Duplicate Detection (P2)

- [x] Deterministic candidate filtering (product, batch, date range)
- [x] Description similarity calculation
- [x] Potential duplicate scoring
- [x] Display in copilot panel
- [x] Unit tests: same product + batch detected
- [x] Unit tests: different product not flagged
- [x] Unit tests: score threshold appropriate
- [x] Unit tests: result labeled "Potential Duplicate" not "Confirmed"

---

## Phase 18 — LangGraph Integration Tests

- [x] Happy path: input → extraction → classification → risk → review
- [x] Missing information: incomplete complaint → system identifies gaps
- [x] User correction: batch A → corrected to batch B → state updates
- [x] PDF input: upload → text extraction → processing
- [x] Error handling: LLM failure → safe recovery
- [x] State isolation: two complaints do not contaminate each other

---

## Phase 19 — API Integration Tests

- [x] POST /api/v1/complaints — create with valid text
- [x] POST /api/v1/complaints — reject empty text (400)
- [x] POST /api/v1/complaints/{id}/process — full processing
- [x] POST /api/v1/complaints/{id}/message — correction flow
- [x] POST /api/v1/complaints/{id}/upload — valid PDF
- [x] POST /api/v1/complaints/{id}/upload — invalid file (400)
- [x] GET /api/v1/complaints/{id} — retrieve complaint
- [x] GET /api/v1/complaints/{id} — not found (404)
- [x] PATCH /api/v1/complaints/{id} — update fields
- [x] POST /api/v1/complaints/{id}/review — approve
- [x] POST /api/v1/complaints/{id}/commit — commit to QMS
- [x] POST /api/v1/complaints/{id}/commit — invalid status (409)

---

## Phase 20 — Frontend Integration Tests

- [x] Complaint form populates from Redux state
- [x] Copilot panel displays messages from Redux
- [x] Risk assessment card renders from API response
- [x] File upload triggers processing flow
- [x] Error states display on API failure
- [x] Loading states display during processing

---

## Phase 21 — E2E Tests (Playwright)

- [x] complaint-workflow.spec.ts — full happy path
- [x] correction-workflow.spec.ts — user corrects a field
- [x] pdf-upload-workflow.spec.ts — PDF processing
- [x] failure-recovery.spec.ts — AI unavailable, retry works
- [x] accessibility.spec.ts — keyboard nav, ARIA labels

---

## Phase 22 — Security Tests

- [x] API key not exposed in frontend
- [x] .env not committed (verify .gitignore)
- [x] File upload type validation
- [x] File upload size limit
- [x] Input validation on all endpoints
- [x] Prompt injection: complaint text cannot bypass controls
- [x] Dangerous filename sanitized

---

## Phase 23 — AI Hallucination Tests

- [x] Missing batch → system returns null, not invented
- [x] Missing dates → system returns null, not fake dates
- [x] Missing quantity → system returns null, not guessed
- [x] Ambiguous input → system asks for clarification
- [x] Contradictory input → system flags inconsistency
- [x] Malformed LLM output → validation catches it
- [x] LLM output with wrong types → validation catches it

---

## Phase 24 — AI Live Tests (Optional)

- [x] Smoke test: real LLM extraction (any provider)
- [x] Prompt validation: structured output compatible
- [x] Model integration: end-to-end with real LLM
- [x] Provider swap test: change LLM_URL/LLM_API_KEY/LLM_MODEL_NAME
- [x] Marked as non-CI (require API key)

---

## Phase 25 — Testing Documentation

- [x] TESTING.md — testing strategy (created)
- [x] TEST_REPORT.md — after test execution
- [x] Update README.md with test commands
- [x] Update AGENTS.md with test conventions

---

## Phase 26 — UX Polish & Final

- [x] Loading skeletons
- [x] Empty states
- [x] Error states (network, processing, validation)
- [x] Toast notifications
- [x] Responsive behavior (tablet, mobile)
- [x] Accessibility audit (keyboard, ARIA, contrast)
- [x] Performance check (no obvious lag)

---

## Phase 27 — Demo Preparation

- [x] Seed data for demo complaint
- [x] All P0 features work end-to-end
- [x] Architecture walkthrough prepared
- [x] ADR documents for key decisions
- [x] Known limitations documented
- [x] Screenshot placeholders in README

---

## Summary Counts

| Category | Total Tasks | Done | Remaining |
|----------|-------------|------|-----------|
| Phase 0-7 (Backend Core) | 50 | 50 | 0 |
| Phase 8-12 (Frontend Core) | 37 | 37 | 0 |
| Phase 13-17 (Features) | 40 | 40 | 0 |
| Phase 18-24 (Testing) | 55 | 55 | 0 |
| Phase 25-27 (Docs & Polish) | 16 | 16 | 0 |
| **Total** | **198** | **198** | **0** |

---

## Priority Order

Execute phases in order. Within each phase, implement then test before moving on.

**Critical path**: Phase 0 → 1 → 2 → 3 → 4 → 5 → 8 → 9 → 10 → 11 → 12 → 15

**Testing can begin**: Phase 1 (schemas are testable immediately)

**Full E2E possible**: After Phase 15
