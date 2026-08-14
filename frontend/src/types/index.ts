// QPilot TypeScript Types
// Based on SPECTS.md schemas

// ─── Complaint Extraction ────────────────────────────────────────────
export interface ComplaintExtraction {
  complaint_source: string | null;
  customer_name: string | null;
  product_name: string | null;
  product_strength: string | null;
  product_grade: string | null;
  batch_number: string | null;
  affected_quantity: string | null;
  manufacturing_date: string | null;
  expiry_date: string | null;
  complaint_date: string | null;
  complaint_category: string | null;
  complaint_description: string | null;
  complaint_subcategory: string | null;
}

// ─── Risk Assessment ─────────────────────────────────────────────────
export type Severity = "Critical" | "Major" | "Minor";
export type Confidence = "High" | "Medium" | "Low";

export interface RiskAssessment {
  severity: Severity;
  risk_factors: string[];
  reasoning: string;
  recommended_action: string;
  confidence: Confidence | null;
}

// ─── Classification ──────────────────────────────────────────────────
export interface ComplaintClassification {
  category: string;
  subcategory: string | null;
  reasoning: string;
}

// ─── Completeness ────────────────────────────────────────────────────
export interface CompletenessResult {
  score: number; // 0.0 to 1.0
  required_fields: string[];
  // The backend returns a count, while the specification also allows the
  // concrete list of present field names.
  present_fields: string[] | number;
  missing_fields: string[];
  explanation: string | null;
}

export interface CopilotAnalysis {
  classification: ComplaintClassification | null;
  riskAssessment: RiskAssessment | null;
  completeness: CompletenessResult | null;
}

// ─── Complaint Status ────────────────────────────────────────────────
export type ProcessingStatus = "idle" | "processing" | "complete" | "error";
export type ReviewState = "pending" | "approved" | "rejected";
export type CommitState = "draft" | "reviewing" | "committed";
export type InputType = "text" | "pdf" | "correction";

// ─── Complaint ───────────────────────────────────────────────────────
export interface Complaint {
  id: string;
  created_at: string;
  updated_at: string;

  // Input
  raw_input: string;
  input_type: InputType;
  file_path?: string;

  // Extracted Data
  extracted_complaint: ComplaintExtraction | null;
  validated_complaint: ComplaintExtraction | null;

  // Validation
  validation_results: Record<string, unknown> | null;
  missing_fields: string[];

  // AI Analysis
  classification: ComplaintClassification | null;
  risk_assessment: RiskAssessment | null;
  recommendations: string[];
  completeness: CompletenessResult | null;

  // Conversation
  conversation_history: ConversationMessage[];

  // Status
  processing_status: ProcessingStatus;
  review_state: ReviewState;
  commit_state: CommitState;

  // Errors
  errors: string[];
}

// ─── Conversation ────────────────────────────────────────────────────
export interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

// ─── API Types ───────────────────────────────────────────────────────
export interface CreateComplaintRequest {
  raw_input: string;
  input_type: InputType;
  file_path?: string;
}

export interface UpdateComplaintRequest {
  complaint_id: string;
  updates: Partial<ComplaintExtraction>;
}

export interface CorrectionRequest {
  complaint_id: string;
  message: string;
}

export interface CommitRequest {
  complaint_id: string;
}

// ─── API Response ────────────────────────────────────────────────────
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// ─── SSE Event Types ─────────────────────────────────────────────────
export type SSEEventType =
  | "status_update"
  | "extraction_progress"
  | "classification_result"
  | "risk_assessment_result"
  | "completeness_result"
  | "recommendation_result"
  | "error"
  | "complete";

export interface SSEEvent {
  event: SSEEventType;
  data: unknown;
  complaint_id: string;
}

// ─── Dashboard Types ─────────────────────────────────────────────────
export interface DashboardMetrics {
  total_complaints: number;
  pending_review: number;
  committed: number;
  critical_count: number;
  avg_processing_time: number;
  category_breakdown: Record<string, number>;
}

// ─── Complaint Categories ────────────────────────────────────────────
export const COMPLAINT_CATEGORIES = [
  "Product Defect",
  "Packaging Issue",
  "Documentation",
  "Efficacy",
  "Adverse Event",
  "Supply",
  "Other",
] as const;

export type ComplaintCategory = (typeof COMPLAINT_CATEGORIES)[number];

// ─── Complaint Sources ───────────────────────────────────────────────
export const COMPLAINT_SOURCES = ["pharmacy", "hospital", "distributor", "patient"] as const;

export type ComplaintSource = (typeof COMPLAINT_SOURCES)[number];
