import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { RiskAssessmentCard } from "@/components/copilot/RiskAssessmentCard";

const mockAssessment = {
  severity: "Major" as const,
  risk_factors: ["Product quality issue", "Potential patient impact"],
  reasoning: "Complaint indicates a manufacturing defect that could affect patient safety.",
  recommended_action: "Initiate investigation and notify QA team.",
  confidence: "High" as const,
};

describe("RiskAssessmentCard", () => {
  it("renders risk assessment card", () => {
    render(<RiskAssessmentCard assessment={mockAssessment} />);

    expect(screen.getByText(/risk assessment/i)).toBeInTheDocument();
  });

  it("displays severity badge", () => {
    render(<RiskAssessmentCard assessment={mockAssessment} />);

    expect(screen.getByText("Major")).toBeInTheDocument();
  });

  it("displays confidence badge", () => {
    render(<RiskAssessmentCard assessment={mockAssessment} />);

    expect(screen.getByText(/high confidence/i)).toBeInTheDocument();
  });

  it("displays risk factors", () => {
    render(<RiskAssessmentCard assessment={mockAssessment} />);

    expect(screen.getByText(/risk factors/i)).toBeInTheDocument();
    expect(screen.getByText("Product quality issue")).toBeInTheDocument();
    expect(screen.getByText("Potential patient impact")).toBeInTheDocument();
  });

  it("displays reasoning", () => {
    render(<RiskAssessmentCard assessment={mockAssessment} />);

    expect(screen.getByText(/reasoning/i)).toBeInTheDocument();
    expect(screen.getByText(/manufacturing defect/i)).toBeInTheDocument();
  });

  it("displays recommended action", () => {
    render(<RiskAssessmentCard assessment={mockAssessment} />);

    expect(screen.getByText(/recommended action/i)).toBeInTheDocument();
    expect(screen.getByText(/initiate investigation/i)).toBeInTheDocument();
  });

  it("renders different severity colors", () => {
    const { rerender } = render(
      <RiskAssessmentCard assessment={{ ...mockAssessment, severity: "Critical" }} />,
    );
    expect(screen.getByText("Critical")).toBeInTheDocument();

    rerender(<RiskAssessmentCard assessment={{ ...mockAssessment, severity: "Minor" }} />);
    expect(screen.getByText("Minor")).toBeInTheDocument();
  });
});
