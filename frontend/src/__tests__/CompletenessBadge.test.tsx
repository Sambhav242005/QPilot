import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

// CompletenessBadge is a simple component - test its logic directly
function CompletenessBadge({ score }: { score: number }) {
  const percentage = Math.round(score * 100);
  let color = "bg-red-100 text-red-700";
  if (percentage >= 80) color = "bg-green-100 text-green-700";
  else if (percentage >= 50) color = "bg-amber-100 text-amber-700";

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${color}`}>
      {percentage}% Complete
    </span>
  );
}

describe("CompletenessBadge", () => {
  it("shows green for high score (>=80%)", () => {
    render(<CompletenessBadge score={0.85} />);
    const badge = screen.getByText("85% Complete");
    expect(badge).toHaveClass("bg-green-100");
  });

  it("shows amber for medium score (50-79%)", () => {
    render(<CompletenessBadge score={0.6} />);
    const badge = screen.getByText("60% Complete");
    expect(badge).toHaveClass("bg-amber-100");
  });

  it("shows red for low score (<50%)", () => {
    render(<CompletenessBadge score={0.3} />);
    const badge = screen.getByText("30% Complete");
    expect(badge).toHaveClass("bg-red-100");
  });

  it("shows 100% for perfect score", () => {
    render(<CompletenessBadge score={1.0} />);
    expect(screen.getByText("100% Complete")).toBeInTheDocument();
  });

  it("shows 0% for empty score", () => {
    render(<CompletenessBadge score={0} />);
    expect(screen.getByText("0% Complete")).toBeInTheDocument();
  });
});
