import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { AnalysisResults } from "@/components/copilot/AnalysisResults";
import { normalizeCopilotAnalysis } from "@/lib/analysis";

describe("AnalysisResults", () => {
  it("shows risk assessment, recommended action, gaps, and explicit review state", () => {
    const analysis = normalizeCopilotAnalysis({
      classification: {
        category: "Product Defect",
        subcategory: "Discoloration",
        reasoning: "The complaint describes visibly discolored capsules.",
      },
      risk_assessment: {
        overall_severity: "high",
        risk_factors: [{ factor: "Specific batch identified" }],
        reasoning: "The reported defect needs QA investigation.",
        recommended_action: "Route to QA investigation and review the affected batch.",
      },
      completeness: {
        score: 0.72,
        present_fields: 9,
        missing_fields: ["quantity_affected", "expiry_date"],
      },
    });

    render(<AnalysisResults analysis={analysis} />);

    expect(screen.getByText("Ready for Review")).toBeInTheDocument();
    expect(screen.getByText("Complaint Classification")).toBeInTheDocument();
    expect(screen.getByText("Risk Assessment")).toBeInTheDocument();
    expect(screen.getByText("Route to QA investigation and review the affected batch.")).toBeInTheDocument();
    expect(screen.getByText("Quantity Affected")).toBeInTheDocument();
    expect(screen.getByText("Expiry Date")).toBeInTheDocument();
    expect(screen.getByText(/field coverage, not AI analysis completion/i)).toBeInTheDocument();
  });
});
