import { prisma } from "./prisma";

// ─── Database Utilities ──────────────────────────────────────────────

/**
 * Parse a JSON string safely, returning null on failure
 */
export function parseJson<T>(value: string | null): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

/**
 * Serialize a value to JSON string, returning null for null/undefined
 */
export function serializeJson(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  return JSON.stringify(value);
}

/**
 * Get complaint with parsed JSON fields
 */
export async function getComplaintWithParsedJson(id: string) {
  const complaint = await prisma.complaint.findUnique({
    where: { id },
    include: { auditEvents: { orderBy: { createdAt: "desc" } } },
  });

  if (!complaint) return null;

  return {
    ...complaint,
    extractedData: parseJson(complaint.extractedData),
    validatedData: parseJson(complaint.validatedData),
    validationResults: parseJson(complaint.validationResults),
    missingFields: parseJson<string[]>(complaint.missingFields),
    classification: parseJson(complaint.classification),
    riskAssessment: parseJson(complaint.riskAssessment),
    recommendations: parseJson<string[]>(complaint.recommendations),
    completeness: parseJson(complaint.completeness),
    conversationHistory: parseJson(complaint.conversationHistory),
    errors: parseJson<string[]>(complaint.errors),
  };
}

/**
 * Database health check
 */
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}
