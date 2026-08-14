import { describe, expect, it } from "vitest";
import { normalizeCopilotAnalysis } from "@/lib/analysis";

describe("normalizeCopilotAnalysis", () => {
  it("normalizes the backend risk shape without losing the assessment", () => {
    const analysis = normalizeCopilotAnalysis({
      classification: {
        category: "Product Defect",
        subcategory: "Discoloration",
        reasoning: "The complaint describes visibly discolored capsules.",
      },
      risk_assessment: {
        overall_severity: "high",
        risk_factors: [
          { factor: "Product quality issue", severity: "high", reasoning: "Defect is visible." },
          { factor: "Batch identified", severity: "medium", reasoning: "Investigation can be scoped." },
        ],
        reasoning: "The defect may affect product quality and requires investigation.",
        recommended_action: "Route to QA investigation and review the affected batch.",
      },
      completeness: {
        score: 0.72,
        present_fields: 9,
        missing_fields: ["quantity_affected", "expiry_date"],
      },
    });

    expect(analysis.classification?.category).toBe("Product Defect");
    expect(analysis.riskAssessment).toMatchObject({
      severity: "Major",
      risk_factors: ["Product quality issue", "Batch identified"],
      recommended_action: "Route to QA investigation and review the affected batch.",
      confidence: null,
    });
    expect(analysis.completeness).toMatchObject({
      score: 0.72,
      present_fields: 9,
      missing_fields: ["quantity_affected", "expiry_date"],
    });
  });
});
