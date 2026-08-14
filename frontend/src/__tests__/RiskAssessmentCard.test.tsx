import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { RiskAssessmentCard } from "@/components/copilot/RiskAssessmentCard";

const mockAssessment = {
  severity: "Major" as const,
  risk_factors: [
    { factor: "Product quality issue", severity: "Major" as const, reasoning: "Manufacturing defect detected." },
    { factor: "Potential patient impact", severity: "Minor" as const, reasoning: "No adverse events reported yet." },
  ],
  reasoning: "Complaint indicates a quality issue that warrants investigation.",
  recommended_action: "Route to QA for batch investigation.",
  confidence: "High" as const,
};

describe("RiskAssessmentCard", () => {
  it("renders risk assessment card", () => {
    render(<RiskAssessmentCard assessment={mockAssessment} />);

    expect(screen.getByText(/risk assessment/i)).toBeInTheDocument();
  });

  it("displays overall severity badge", () => {
    render(<RiskAssessmentCard assessment={mockAssessment} />);

    const badges = screen.getAllByText("Major");
    expect(badges.length).toBeGreaterThanOrEqual(1);
  });

  it("displays confidence badge", () => {
    render(<RiskAssessmentCard assessment={mockAssessment} />);

    expect(screen.getByText(/high confidence/i)).toBeInTheDocument();
  });

  it("displays risk factors with details", () => {
    render(<RiskAssessmentCard assessment={mockAssessment} />);

    expect(screen.getByText(/risk factors/i)).toBeInTheDocument();
    expect(screen.getByText("Product quality issue")).toBeInTheDocument();
    expect(screen.getByText("Potential patient impact")).toBeInTheDocument();
    expect(screen.getByText("Manufacturing defect detected.")).toBeInTheDocument();
    expect(screen.getByText("No adverse events reported yet.")).toBeInTheDocument();
  });

  it("displays overall reasoning", () => {
    render(<RiskAssessmentCard assessment={mockAssessment} />);

    expect(screen.getByText(/evidence.*reasoning/i)).toBeInTheDocument();
    expect(screen.getByText(/quality issue that warrants investigation/i)).toBeInTheDocument();
  });

  it("displays recommended action with human review note", () => {
    render(<RiskAssessmentCard assessment={mockAssessment} />);

    expect(screen.getByText(/recommended next action/i)).toBeInTheDocument();
    expect(screen.getByText(/route to qa for batch investigation/i)).toBeInTheDocument();
    expect(screen.getByText(/requires human qa review/i)).toBeInTheDocument();
  });

  it("renders different severity colors", () => {
    const { rerender } = render(
      <RiskAssessmentCard assessment={{ ...mockAssessment, severity: "Critical" }} />,
    );
    expect(screen.getByText("Critical")).toBeInTheDocument();

    rerender(<RiskAssessmentCard assessment={{ ...mockAssessment, severity: "Minor" }} />);
    const minors = screen.getAllByText("Minor");
    expect(minors.length).toBeGreaterThanOrEqual(1);
  });
});
