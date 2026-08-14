import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ClassificationBadge } from "@/components/copilot/ClassificationBadge";

const mockClassification = {
  category: "Product Defect",
  subcategory: "Manufacturing",
  reasoning: "Complaint indicates a manufacturing defect.",
};

describe("ClassificationBadge", () => {
  it("renders classification badge", () => {
    render(<ClassificationBadge classification={mockClassification} />);

    expect(screen.getByText("Product Defect")).toBeInTheDocument();
  });

  it("displays subcategory when provided", () => {
    render(<ClassificationBadge classification={mockClassification} />);

    expect(screen.getByText(/manufacturing/i)).toBeInTheDocument();
  });

  it("hides subcategory when not provided", () => {
    const classification = {
      category: "Product Defect",
      subcategory: null,
      reasoning: "Test reasoning",
    };

    render(<ClassificationBadge classification={classification} />);

    expect(screen.getByText("Product Defect")).toBeInTheDocument();
    expect(screen.queryByText(/—/)).not.toBeInTheDocument();
  });

  it("shows reasoning when showReasoning is true", () => {
    render(<ClassificationBadge classification={mockClassification} showReasoning />);

    expect(screen.getByText(/manufacturing defect/i)).toBeInTheDocument();
  });

  it("hides reasoning when showReasoning is false", () => {
    render(<ClassificationBadge classification={mockClassification} showReasoning={false} />);

    expect(screen.queryByText(/manufacturing defect/i)).not.toBeInTheDocument();
  });

  it("renders different categories with correct colors", () => {
    const { rerender } = render(
      <ClassificationBadge
        classification={{ ...mockClassification, category: "Packaging Issue" }}
      />,
    );
    expect(screen.getByText("Packaging Issue")).toBeInTheDocument();

    rerender(
      <ClassificationBadge classification={{ ...mockClassification, category: "Documentation" }} />,
    );
    expect(screen.getByText("Documentation")).toBeInTheDocument();
  });

  it("falls back to Other for unknown categories", () => {
    const classification = {
      category: "Unknown Category",
      subcategory: null,
      reasoning: "Test",
    };

    render(<ClassificationBadge classification={classification} />);

    expect(screen.getByText("Unknown Category")).toBeInTheDocument();
  });
});
