import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import complaintReducer from "@/store/slices/complaintSlice";
import copilotReducer from "@/store/slices/copilotSlice";
import { ComplaintForm } from "@/components/complaint/ComplaintForm";

function renderWithProviders(ui: React.ReactElement) {
  const store = configureStore({
    reducer: {
      complaint: complaintReducer,
      copilot: copilotReducer,
    },
  });
  return render(<Provider store={store}>{ui}</Provider>);
}

describe("ComplaintForm", () => {
  it("renders form with title", () => {
    renderWithProviders(<ComplaintForm />);
    expect(screen.getByText(/log customer complaint/i)).toBeInTheDocument();
  });

  it("renders all four sections", () => {
    renderWithProviders(<ComplaintForm />);
    expect(screen.getByText(/1\. origin & customer details/i)).toBeInTheDocument();
    expect(screen.getByText(/2\. product & batch/i)).toBeInTheDocument();
    expect(screen.getByText(/3\. complaint details/i)).toBeInTheDocument();
    expect(screen.getByText(/4\. initial assessment/i)).toBeInTheDocument();
  });

  it("renders combobox fields for selects", () => {
    renderWithProviders(<ComplaintForm />);
    const comboboxes = screen.getAllByRole("combobox");
    expect(comboboxes.length).toBe(4); // source, type, severity, priority
  });

  it("renders text inputs", () => {
    renderWithProviders(<ComplaintForm />);
    const inputs = screen.getAllByRole("textbox");
    expect(inputs.length).toBeGreaterThan(0);
  });

  it("renders human-review guidance", () => {
    renderWithProviders(<ComplaintForm />);
    expect(screen.getByText(/review and correct any field/i)).toBeInTheDocument();
  });

  it("renders status badge", () => {
    renderWithProviders(<ComplaintForm />);
    expect(screen.getByText(/pending triage/i)).toBeInTheDocument();
  });

  it("allows human reviewers to edit extracted fields", () => {
    renderWithProviders(<ComplaintForm />);
    const inputs = screen.getAllByRole("textbox");
    inputs.forEach((input) => {
      expect(input).not.toHaveAttribute("readonly");
    });
  });
});
