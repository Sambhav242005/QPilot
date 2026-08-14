import type {
  ComplaintClassification,
  CompletenessResult,
  Confidence,
  CopilotAnalysis,
  RiskAssessment,
  RiskFactor,
  Severity,
} from "@/types";

type UnknownRecord = Record<string, unknown>;

function asRecord(value: unknown): UnknownRecord | null {
  return typeof value === "object" && value !== null ? (value as UnknownRecord) : null;
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function normalizeSeverity(value: unknown): Severity | null {
  const severity = asString(value)?.toLowerCase();

  switch (severity) {
    case "critical":
      return "Critical";
    case "major":
    case "high":
    case "medium":
      return "Major";
    case "minor":
    case "low":
      return "Minor";
    default:
      return null;
  }
}

function normalizeConfidence(value: unknown): Confidence | null {
  const confidence = asString(value)?.toLowerCase();

  switch (confidence) {
    case "high":
      return "High";
    case "medium":
      return "Medium";
    case "low":
      return "Low";
    default:
      return null;
  }
}

function normalizeClassification(value: unknown): ComplaintClassification | null {
  const record = asRecord(value);
  const category = asString(record?.category);

  if (!category) return null;

  return {
    category,
    subcategory: asString(record?.subcategory),
    reasoning: asString(record?.reasoning) ?? "No classification reasoning was returned.",
  };
}

function normalizeRiskAssessment(value: unknown): RiskAssessment | null {
  const record = asRecord(value);
  const severity = normalizeSeverity(record?.severity ?? record?.overall_severity);

  if (!severity) return null;

  const riskFactors: RiskFactor[] = Array.isArray(record?.risk_factors)
    ? record.risk_factors.flatMap((factor) => {
        if (typeof factor === "string") {
          return [{ factor, severity: "Minor" as Severity, reasoning: "" }];
        }
        const factorRecord = asRecord(factor);
        const label = asString(factorRecord?.factor);
        if (!label) return [];
        return [{
          factor: label,
          severity: normalizeSeverity(factorRecord?.severity) ?? "Minor",
          reasoning: asString(factorRecord?.reasoning) ?? "",
        }];
      })
    : [];

  return {
    severity,
    risk_factors: riskFactors,
    reasoning: asString(record?.reasoning) ?? "No risk reasoning was returned.",
    recommended_action:
      asString(record?.recommended_action) ?? "Route to QA for human assessment.",
    confidence: normalizeConfidence(record?.confidence),
  };
}

function normalizeCompleteness(value: unknown): CompletenessResult | null {
  const record = asRecord(value);
  const score = typeof record?.score === "number" ? Math.max(0, Math.min(1, record.score)) : null;

  if (score === null) return null;

  const presentFields = Array.isArray(record?.present_fields)
    ? asStringArray(record.present_fields)
    : typeof record?.present_fields === "number"
      ? record.present_fields
      : [];

  return {
    score,
    required_fields: asStringArray(record?.required_fields),
    present_fields: presentFields,
    missing_fields: asStringArray(record?.missing_fields),
    explanation: asString(record?.explanation),
  };
}

export function normalizeCopilotAnalysis(value: unknown): CopilotAnalysis {
  const record = asRecord(value);

  return {
    classification: normalizeClassification(record?.classification),
    riskAssessment: normalizeRiskAssessment(record?.risk_assessment),
    completeness: normalizeCompleteness(record?.completeness),
  };
}
