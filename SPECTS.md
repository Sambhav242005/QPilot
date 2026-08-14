# QPilot — Technical Specification

## 1. Product Overview

QPilot is an AI-powered Customer Complaint Management System for pharmaceutical manufacturing. It serves as an intelligent copilot that converts unstructured customer complaints into structured QMS complaint records, providing classification, risk assessment, and actionable recommendations to quality personnel.

## 2. Goals

| ID | Goal |
|----|------|
| G-001 | Convert unstructured complaint text/PDFs into structured QMS records |
| G-002 | Classify complaints by category and severity |
| G-003 | Provide explainable AI risk assessment |
| G-004 | Support conversational corrections to extracted data |
| G-005 | Enable human review before QMS commitment |
| G-006 | Maintain audit trail for compliance |
| G-007 | Deliver a professional, interview-defensible architecture |

## 3. Non-Goals

| ID | Non-Goal |
|----|----------|
| NG-001 | Replace QA personnel or make autonomous regulatory decisions |
| NG-002 | Production-grade OCR or image processing |
| NG-003 | Multi-tenant enterprise architecture |
| NG-004 | Real-time regulatory submission |
| NG-005 | Complex distributed systems (microservices, Kafka, etc.) |

## 4. Users

| User | Role | Description |
|------|------|-------------|
| Quality Analyst | Primary | Enters complaints, reviews AI extraction, commits to QMS |
| QA Manager | Secondary | Reviews committed complaints, audits |

## 5. User Stories

| ID | Story |
|----|-------|
| US-001 | As a quality analyst, I want to type a natural-language complaint so the system extracts structured fields automatically |
| US-002 | As a quality analyst, I want to upload a PDF complaint document so the system extracts text and processes it |
| US-003 | As a quality analyst, I want to see AI classification and risk assessment so I can prioritize investigation |
| US-004 | As a quality analyst, I want to correct extracted fields conversationally so the record is accurate |
| US-005 | As a quality analyst, I want to review all AI output before committing so I remain in control |
| US-006 | As a quality analyst, I want to commit a reviewed complaint to QMS so it becomes an official record |
| US-007 | As a quality analyst, I want to see processing status so I know what the system is doing |
| US-008 | As a quality analyst, I want the system to identify missing information so I can follow up |

## 6. Functional Requirements

### 6.1 Complaint Intake

| ID | Requirement |
|----|-------------|
| FR-001 | System accepts natural-language complaint text via input field |
| FR-002 | System accepts PDF document upload for complaint processing |
| FR-003 | System validates file type (PDF only for MVP) and size (max 10MB) |
| FR-004 | System displays upload progress and processing status |
| FR-005 | System handles empty/invalid documents gracefully with user-friendly error |

### 6.2 AI Extraction

| ID | Requirement |
|----|-------------|
| FR-010 | System extracts structured fields from unstructured complaint text |
| FR-011 | Extraction uses structured Pydantic output schemas |
| FR-012 | Missing fields are set to `null`, never hallucinated |
| FR-013 | Extracted fields populate the complaint form automatically |
| FR-014 | User can edit any extracted field manually |
| FR-015 | System validates AI output schema before applying to state |

### 6.3 Complaint Classification

| ID | Requirement |
|----|-------------|
| FR-020 | System classifies complaints into defined categories |
| FR-021 | Classification includes category and subcategory |
| FR-022 | Classification result is explainable (includes reasoning) |
| FR-023 | Classification uses structured output schema |

### 6.4 Risk Assessment

| ID | Requirement |
|----|-------------|
| FR-030 | System generates risk assessment for each complaint |
| FR-031 | Risk assessment includes severity level, risk factors, and reasoning |
| FR-032 | Risk assessment includes recommended next action |
| FR-033 | Risk assessment includes confidence level |
| FR-034 | Risk assessment is explainable — never just a label |

### 6.5 Conversational Corrections

| ID | Requirement |
|----|-------------|
| FR-040 | User can send follow-up messages to correct extracted data |
| FR-041 | System understands correction intent and updates specific fields |
| FR-042 | Corrected fields trigger re-analysis of dependent assessments |
| FR-043 | Conversation history is maintained per complaint |
| FR-044 | Corrections do not create new complaints |

### 6.6 Completeness Check

| ID | Requirement |
|----|-------------|
| FR-050 | System performs deterministic completeness check on required fields |
| FR-051 | Completeness score displayed as percentage |
| FR-052 | Missing fields listed explicitly |
| FR-053 | LLM used only for friendly explanation of missing info, not detection |

### 6.7 Duplicate Detection (Bonus)

| ID | Requirement |
|----|-------------|
| FR-060 | System identifies potential duplicate complaints |
| FR-061 | Duplicate detection uses product, batch, category, and date signals |
| FR-062 | Results labeled as "Potential Duplicate", never "Confirmed" |
| FR-063 | User decides whether to link or ignore duplicates |

### 6.8 Human Review

| ID | Requirement |
|----|-------------|
| FR-070 | Complaint must pass through human review before QMS commit |
| FR-071 | Review state clearly indicated in UI |
| FR-072 | User can accept, edit, or reject AI-generated content |
| FR-073 | Only reviewed complaints can be committed |

### 6.9 QMS Commit

| ID | Requirement |
|----|-------------|
| FR-080 | Commit action stores complaint in PostgreSQL |
| FR-081 | Commit is deterministic — handled by FastAPI, never LLM |
| FR-082 | Committed complaint has status "COMMITTED" |
| FR-083 | Commit creates audit event |
| FR-084 | After commit, complaint is read-only (for MVP) |

## 7. Complaint Schema

### 7.1 Core Complaint Fields

```python
class ComplaintExtraction(BaseModel):
    complaint_source: str | None = None          # "pharmacy", "hospital", "distributor", "patient"
    customer_name: str | None = None              # Name of reporting entity
    product_name: str | None = None               # "Amoxicillin Capsules"
    product_strength: str | None = None           # "500 mg"
    product_grade: str | None = None              # If applicable
    batch_number: str | None = None               # "BMX240602"
    affected_quantity: str | None = None           # "48 capsules"
    manufacturing_date: str | None = None          # "2024-06-01" or null
    expiry_date: str | None = None                 # "2026-06-01" or null
    complaint_date: str | None = None              # When complaint was received
    complaint_category: str | None = None          # Classified category
    complaint_description: str | None = None       # Original description
    complaint_subcategory: str | None = None       # More specific classification
```

### 7.2 Risk Assessment Schema

```python
class RiskAssessment(BaseModel):
    severity: str                                  # "Critical", "Major", "Minor"
    risk_factors: list[str]                        # List of contributing factors
    reasoning: str                                 # Explanation of assessment
    recommended_action: str                        # Suggested next step
    confidence: str                                # "High", "Medium", "Low"
```

### 7.3 Classification Schema

```python
class ComplaintClassification(BaseModel):
    category: str                                  # Primary category
    subcategory: str | None = None                 # Optional subcategory
    reasoning: str                                 # Why this classification
```

### 7.4 Completeness Schema

```python
class CompletenessResult(BaseModel):
    score: float                                   # 0.0 to 1.0
    required_fields: list[str]                     # All required field names
    present_fields: list[str]                      # Fields that have values
    missing_fields: list[str]                      # Fields that are null/empty
    explanation: str | None = None                 # AI explanation of gaps
```

## 8. Complaint Categories

| Category | Subcategory Examples |
|----------|---------------------|
| Product Defect | Discoloration, Contamination, Physical damage, Broken tablets |
| Packaging Issue | Labeling error, Seal failure, Wrong packaging, Damaged packaging |
| Documentation | Missing COA, Incorrect labeling, Missing information |
| Efficacy | Reduced potency, No therapeutic effect |
| Adverse Event | Side effect, Allergic reaction, Unexpected reaction |
| Supply | Shortage, Wrong product shipped, Delayed delivery |
| Other | Unclassified, General inquiry |

## 9. AI Requirements

| ID | Requirement |
|----|-------------|
| AI-001 | All AI outputs use structured Pydantic schemas |
| AI-002 | AI output validated against schema before state update |
| AI-003 | Missing information returned as null, never fabricated |
| AI-004 | AI reasoning grounded in complaint data only |
| AI-005 | AI recommends, never decides |
| AI-006 | LLM via OpenAI-compatible API (Groq, OpenAI, Together, etc.) |
| AI-007 | LangGraph workflow engine (not a single LLM call wrapper) |
| AI-008 | AI never executes SQL or writes to database |
| AI-009 | AI never commits complaints to QMS |
| AI-010 | AI outputs include confidence indicators |
| AI-011 | Streaming responses via SSE for live UI updates |
| AI-012 | Provider swappable by changing 3 env vars (LLM_URL, LLM_API_KEY, LLM_MODEL_NAME) |

## 10. LangGraph Architecture

### 10.1 State Model

```python
class ComplaintState(BaseModel):
    # Input
    raw_input: str | None = None
    input_type: str | None = None                 # "text", "pdf", "correction"
    file_path: str | None = None

    # Complaint Data
    extracted_complaint: ComplaintExtraction | None = None
    validated_complaint: ComplaintExtraction | None = None

    # Validation
    validation_results: dict | None = None
    missing_fields: list[str] = []

    # AI Analysis
    classification: ComplaintClassification | None = None
    risk_assessment: RiskAssessment | None = None
    recommendations: list[str] = []
    completeness: CompletenessResult | None = None

    # Conversation
    conversation_history: list[dict] = []

    # Status
    processing_status: str = "idle"                # idle, processing, complete, error
    review_state: str = "pending"                  # pending, approved, rejected
    commit_state: str = "draft"                    # draft, reviewing, committed

    # Errors
    errors: list[str] = []
```

### 10.2 Workflow Nodes

| Node | Purpose | Input | Output |
|------|---------|-------|--------|
| `receive_input` | Route to correct processing path | raw_input | input_type |
| `extract_document_text` | Extract text from PDF | file_path | extracted_text |
| `normalize_input` | Prepare text for extraction | raw_input or extracted_text | normalized_text |
| `extract_complaint_fields` | LLM extraction of structured fields | normalized_text | extracted_complaint |
| `validate_complaint` | Schema + rule validation | extracted_complaint | validated_complaint, validation_results |
| `request_missing_information` | Identify and surface gaps | validated_complaint | missing_fields |
| `classify_complaint` | Categorize complaint | validated_complaint | classification |
| `assess_risk` | Generate risk assessment | validated_complaint, classification | risk_assessment |
| `generate_recommendation` | Suggest next actions | risk_assessment, classification | recommendations |
| `check_completeness` | Deterministic completeness | validated_complaint | completeness |
| `prepare_review` | Package for human review | all_results | review_package |

### 10.3 Workflow Transitions

```
START
  ↓
receive_input
  ↓
classify_input_type ──→ [text] ──→ normalize_input
                    └──→ [pdf]  ──→ extract_document_text → normalize_input
                    └──→ [correction] ──→ apply_correction
  ↓
normalize_input
  ↓
extract_complaint_fields
  ↓
validate_complaint
  ├─→ [valid] ──→ classify_complaint
  └─→ [invalid] ──→ request_missing_information → end (await user input)
  ↓
classify_complaint
  ↓
assess_risk
  ↓
generate_recommendation
  ↓
check_completeness
  ↓
prepare_review
  ↓
END
```

### 10.4 Correction Flow

```
User sends correction message
  ↓
receive_input (input_type="correction")
  ↓
apply_correction
  ├─→ Update extracted_complaint
  ├─→ Re-run validate_complaint
  ├─→ Re-run classify_complaint (if relevant fields changed)
  ├─→ Re-run assess_risk
  └─→ Re-run check_completeness
  ↓
prepare_review
  ↓
END
```

## 11. Frontend Architecture

### 11.1 Technology

- Next.js 16+ (App Router)
- React 19+
- TypeScript (strict mode)
- Redux Toolkit
- Tailwind CSS v4
- shadcn/ui (components)
- motion.dev (animations)

### 11.2 Directory Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/              # shadcn/ui components
│   │   ├── layout/
│   │   │   ├── AppShell.tsx
│   │   │   └── Header.tsx
│   │   ├── complaint/
│   │   │   ├── ComplaintForm.tsx
│   │   │   ├── ComplaintField.tsx
│   │   │   ├── ComplaintStatus.tsx
│   │   │   └── CompletenessBadge.tsx
│   │   ├── copilot/
│   │   │   ├── CopilotPanel.tsx
│   │   │   ├── ChatMessage.tsx
│   │   │   ├── ChatComposer.tsx
│   │   │   ├── RiskAssessmentCard.tsx
│   │   │   ├── ClassificationBadge.tsx
│   │   │   └── RecommendationList.tsx
│   │   ├── upload/
│   │   │   └── FileUpload.tsx
│   │   └── review/
│   │       ├── ReviewPanel.tsx
│   │       └── CommitButton.tsx
│   ├── features/
│   │   ├── complaint/
│   │   │   ├── complaintSlice.ts
│   │   │   └── complaintSelectors.ts
│   │   ├── copilot/
│   │   │   ├── copilotSlice.ts
│   │   │   └── copilotSelectors.ts
│   │   ├── upload/
│   │   │   ├── uploadSlice.ts
│   │   │   └── uploadSelectors.ts
│   │   └── ui/
│   │       ├── uiSlice.ts
│   │       └── uiSelectors.ts
│   ├── services/
│   │   └── api.ts
│   ├── store/
│   │   └── store.ts
│   ├── hooks/
│   │   ├── useAppDispatch.ts
│   │   └── useAppSelector.ts
│   ├── types/
│   │   └── index.ts
│   └── lib/
│       └── utils.ts
├── public/
├── tests/                   # Playwright E2E tests
│   ├── complaint-workflow.spec.ts
│   ├── correction-workflow.spec.ts
│   └── ...
├── package.json
├── tsconfig.json
├── next.config.ts
└── tailwind.config.ts
```

### 11.3 Component Hierarchy

```
AppShell
├── Header
├── MainContent
│   ├── ComplaintForm
│   │   ├── ComplaintField (×N)
│   │   └── CompletenessBadge
│   └── FileUpload
├── CopilotPanel
│   ├── ChatMessage (×N)
│   ├── RiskAssessmentCard
│   ├── ClassificationBadge
│   ├── RecommendationList
│   └── ChatComposer
└── ReviewPanel
    └── CommitButton
```

## 12. Redux Architecture

### 12.1 Slices

| Slice | Purpose | Key State |
|-------|---------|-----------|
| `complaintSlice` | Complaint data and form state | `currentComplaint`, `complaintId`, `status` |
| `copilotSlice` | AI copilot messages and analysis | `messages`, `riskAssessment`, `classification` |
| `uploadSlice` | File upload state | `file`, `uploadProgress`, `processingStatus` |
| `uiSlice` | UI state | `sidebarOpen`, `activePanel`, `notifications` |

### 12.2 State Boundaries

| State | Location | Rationale |
|-------|----------|-----------|
| Complaint form values | Redux | Shared across form and copilot |
| Chat messages | Redux | Persisted during session |
| Input field focus | React local state | UI-only concern |
| Modal open/close | React local state | Transient UI |
| Server-side data | PostgreSQL | Source of truth |
| Auth tokens | HttpOnly cookies | Security |

## 13. FastAPI Architecture

### 13.1 Directory Structure

```
backend/
├── app/
│   ├── main.py
│   ├── config.py
│   ├── dependencies.py
│   ├── models/
│   │   ├── complaint.py
│   │   ├── classification.py
│   │   ├── risk.py
│   │   └── state.py
│   ├── schemas/
│   │   ├── complaint.py
│   │   ├── classification.py
│   │   ├── risk.py
│   │   └── api.py
│   ├── services/
│   │   ├── complaint_service.py
│   │   ├── extraction_service.py
│   │   ├── classification_service.py
│   │   ├── risk_service.py
│   │   ├── llm_service.py
│   │   └── file_service.py
│   ├── repositories/
│   │   ├── complaint_repository.py
│   │   └── attachment_repository.py
│   ├── api/
│   │   └── v1/
│   │       ├── complaints.py
│   │       ├── health.py
│   │       └── router.py
│   ├── graph/
│   │   ├── workflow.py
│   │   ├── state.py
│   │   └── nodes/
│   │       ├── receive_input.py
│   │       ├── extract_fields.py
│   │       ├── validate.py
│   │       ├── classify.py
│   │       ├── risk.py
│   │       ├── completeness.py
│   │       └── prepare_review.py
│   ├── db/
│   │   ├── database.py
│   │   └── migrations/
│   └── utils/
│       ├── file_utils.py
│       └── text_utils.py
├── alembic/
├── alembic.ini
├── requirements.txt
├── pyproject.toml
└── .env.example
```

### 13.2 Layer Responsibilities

| Layer | Responsibility |
|-------|---------------|
| API (routes) | Request/response handling, HTTP concerns |
| Services | Business logic orchestration |
| Repositories | Database queries, persistence |
| Graph | AI workflow orchestration |
| LLM Service | OpenAI-compatible API interaction (Groq, OpenAI, Together, etc.) |
| Models | Database ORM models |
| Schemas | Request/response/state Pydantic models |

## 14. Database Schema

### 14.1 ORM: Prisma 7

The frontend uses **Prisma 7** with driver adapters for database access:
- **Development**: SQLite (file-based, zero config)
- **Production**: PostgreSQL (swap via `DATABASE_URL` env var)

Prisma schema is located at `frontend/prisma/schema.prisma`.

### 14.2 Tables (Prisma Schema)

```sql
-- Core complaint record
CREATE TABLE complaints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    status VARCHAR(20) NOT NULL DEFAULT 'draft',
    complaint_source VARCHAR(100),
    customer_name VARCHAR(255),
    product_name VARCHAR(255),
    product_strength VARCHAR(100),
    product_grade VARCHAR(100),
    batch_number VARCHAR(100),
    affected_quantity VARCHAR(100),
    manufacturing_date DATE,
    expiry_date DATE,
    complaint_date DATE,
    complaint_category VARCHAR(100),
    complaint_subcategory VARCHAR(100),
    complaint_description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    committed_at TIMESTAMP WITH TIME ZONE,
    created_by VARCHAR(100),
    updated_by VARCHAR(100)
);

-- AI-generated risk assessment
CREATE TABLE risk_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    complaint_id UUID NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
    severity VARCHAR(20) NOT NULL,
    risk_factors JSONB NOT NULL DEFAULT '[]',
    reasoning TEXT NOT NULL,
    recommended_action TEXT NOT NULL,
    confidence VARCHAR(20) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Conversation messages
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    complaint_id UUID NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL,  -- "user", "assistant", "system"
    content TEXT NOT NULL,
    message_type VARCHAR(50),   -- "chat", "correction", "extraction", "error"
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- File attachments
CREATE TABLE attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    complaint_id UUID NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    extracted_text TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audit trail
CREATE TABLE audit_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    complaint_id UUID NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL,
    actor VARCHAR(100) NOT NULL,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 14.2 Indexes

```sql
CREATE INDEX idx_complaints_status ON complaints(status);
CREATE INDEX idx_complaints_batch ON complaints(batch_number);
CREATE INDEX idx_complaints_product ON complaints(product_name);
CREATE INDEX idx_complaints_customer ON complaints(customer_name);
CREATE INDEX idx_messages_complaint ON messages(complaint_id);
CREATE INDEX idx_attachments_complaint ON attachments(complaint_id);
CREATE INDEX idx_audit_complaint ON audit_events(complaint_id);
```

## 15. API Contracts

### 15.1 Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/complaints` | Create new complaint (initial text) |
| POST | `/api/v1/complaints/{id}/process` | Process complaint through AI pipeline |
| POST | `/api/v1/complaints/{id}/message` | Send follow-up/correction message |
| POST | `/api/v1/complaints/{id}/upload` | Upload PDF attachment |
| GET | `/api/v1/complaints/{id}` | Get complaint with all associated data |
| PATCH | `/api/v1/complaints/{id}` | Update complaint fields manually |
| POST | `/api/v1/complaints/{id}/review` | Submit for review / approve / reject |
| POST | `/api/v1/complaints/{id}/commit` | Commit to QMS |
| GET | `/api/v1/complaints` | List complaints (with filters) |

### 15.2 Request/Response Schemas

#### POST /api/v1/complaints

```json
// Request
{
  "complaint_text": "Apollo Pharmacy reported discolored capsules..."
}

// Response
{
  "id": "uuid",
  "status": "processing",
  "created_at": "2025-01-15T10:30:00Z"
}
```

#### POST /api/v1/complaints/{id}/process

```json
// Response
{
  "id": "uuid",
  "status": "ready_for_review",
  "complaint": {
    "complaint_source": "Pharmacy",
    "customer_name": "Apollo Pharmacy",
    "product_name": "Amoxicillin Capsules",
    "product_strength": "500 mg",
    "batch_number": "BMX240602",
    "affected_quantity": "48 capsules",
    "complaint_category": "Product Defect",
    "complaint_subcategory": "Discoloration",
    "complaint_description": "Discolored capsules reported"
  },
  "risk_assessment": {
    "severity": "Major",
    "risk_factors": ["Product defect reported", "Batch identified"],
    "reasoning": "Discoloration indicates potential quality impact",
    "recommended_action": "Route to QA investigation",
    "confidence": "High"
  },
  "classification": {
    "category": "Product Defect",
    "subcategory": "Discoloration",
    "reasoning": "Physical appearance change in solid dosage form"
  },
  "completeness": {
    "score": 0.78,
    "missing_fields": ["expiry_date", "manufacturing_date"]
  }
}
```

#### POST /api/v1/complaints/{id}/message

```json
// Request
{
  "message": "Actually, the batch number is BMX240602 and quantity is 48 capsules"
}

// Response
{
  "id": "uuid",
  "status": "ready_for_review",
  "updated_fields": ["batch_number", "affected_quantity"],
  "complaint": { ... },
  "risk_assessment": { ... }
}
```

#### POST /api/v1/complaints/{id}/upload

```json
// Multipart form data
// file: PDF file

// Response
{
  "id": "uuid",
  "status": "processing",
  "attachment_id": "uuid",
  "filename": "complaint_2025_001.pdf"
}
```

#### POST /api/v1/complaints/{id}/commit

```json
// Response
{
  "id": "uuid",
  "status": "committed",
  "committed_at": "2025-01-15T11:00:00Z"
}
```

## 16. Status Machine

### 16.1 States

| State | Description |
|-------|-------------|
| `DRAFT` | Complaint created, not yet processed |
| `PROCESSING` | AI pipeline running |
| `READY_FOR_REVIEW` | AI extraction complete, awaiting human review |
| `READY_TO_COMMIT` | Reviewed, ready for QMS commit |
| `COMMITTED` | Stored as official QMS record |
| `PROCESSING_FAILED` | AI pipeline encountered error |

### 16.2 Valid Transitions

```
DRAFT → PROCESSING
PROCESSING → READY_FOR_REVIEW
PROCESSING → PROCESSING_FAILED
READY_FOR_REVIEW → READY_TO_COMMIT
READY_FOR_REVIEW → DRAFT (user requests re-processing)
READY_TO_COMMIT → COMMITTED
PROCESSING_FAILED → PROCESSING (retry)
```

## 17. Error Handling

| Scenario | Handling |
|----------|----------|
| Empty complaint text | Return 400 with validation error |
| Invalid file type | Return 400 with supported types |
| File too large | Return 413 with size limit |
| PDF parsing failure | Return 200 with warning, continue without extraction |
| LLM API failure | Return 503 with retry suggestion |
| LLM malformed output | Log, return 500 with safe fallback |
| Database connection failure | Return 503 |
| Missing complaint | Return 404 |
| Invalid status transition | Return 409 with current status |

## 18. Security

| ID | Requirement |
|----|-------------|
| SEC-001 | GROQ_API_KEY server-side only |
| SEC-002 | `.env` in `.gitignore` |
| SEC-003 | `.env.example` committed with placeholders |
| SEC-004 | Input validation on all endpoints |
| SEC-005 | File type validation (PDF only) |
| SEC-006 | File size limit (10MB) |
| SEC-007 | Safe filenames (UUID-based) |
| SEC-008 | No SQL from LLM output |
| SEC-009 | No secrets in frontend code |
| SEC-010 | Parameterized queries only |

## 19. Testing

### 19.1 Test IDs

| ID | Scenario | Type |
|----|----------|------|
| TEST-001 | Complaint text → extraction → classification → risk → commit | E2E |
| TEST-002 | Complaint missing batch → ask user → user provides → update | E2E |
| TEST-003 | Extracted batch A → user corrects to batch B → state updates | Integration |
| TEST-004 | PDF upload → text extraction → AI extraction → form populated | E2E |
| TEST-005 | Invalid file upload → user-friendly error | Unit |
| TEST-006 | Groq unavailable → processing failure → error UI | Integration |
| TEST-007 | Malformed AI output → validation failure → safe recovery | Unit |
| TEST-008 | Potential duplicate → show candidate → user decides | Integration |

## 20. Acceptance Criteria

| ID | Criteria |
|----|----------|
| AC-001 | User submits realistic complaint text and system extracts structured fields |
| AC-002 | Extracted fields automatically populate the complaint form |
| AC-003 | System classifies complaint with category and subcategory |
| AC-004 | AI generates explainable risk assessment with severity, factors, and reasoning |
| AC-005 | User can correct any extracted field via follow-up message |
| AC-006 | System updates complaint state and re-analyses after correction |
| AC-007 | User can review all AI output before committing |
| AC-008 | Complaint can be committed to QMS and stored in PostgreSQL |
| AC-009 | Committed complaint persists in database with audit trail |
| AC-010 | PDF upload triggers text extraction and complaint processing |

## 21. Bonus Features

| Feature | Priority | Dependencies |
|---------|----------|--------------|
| Completeness checker | P1 | FR-050 to FR-053 |
| Duplicate detection | P2 | FR-060 to FR-063 |
| Complaint summary | P2 | None |
| Root cause recommendations | P3 | Risk assessment |
| CAPA suggestions | P3 | Risk assessment |

## 22. Scope Limits

- No real-time regulatory submission
- No production OCR (basic PDF text extraction only)
- No multi-tenant architecture
- No enterprise IAM
- No image-based complaint processing (MVP)
- No mobile-responsive design (desktop-first)

## 23. Assumptions

- LLM provider accessible with sufficient quota (Groq default, swappable)
- PostgreSQL is available locally or via Docker
- Complaints are in English
- Single-user MVP (no auth required initially)
- PDFs contain extractable text (not scanned images)
- Desktop-first UI
- Streaming enabled for live AI responses

## 24. Open Questions

1. Is authentication required for MVP, or is single-user sufficient?
2. Should complaint taxonomy be configurable or hardcoded?
3. Is there a specific regulatory retention period to implement?
4. Should image input (photos of defects) be supported in MVP?
5. Should there be a complaint list/dashboard view beyond single complaint?
7. Is export (CSV/PDF) of committed complaints required?
