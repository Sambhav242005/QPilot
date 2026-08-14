import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import complaintReducer from "@/store/slices/complaintSlice";
import copilotReducer from "@/store/slices/copilotSlice";
import { ReviewPanel } from "@/components/review/ReviewPanel";

function renderWithProviders(ui: React.ReactElement, initialState = {}) {
  const store = configureStore({
    reducer: {
      complaint: complaintReducer,
      copilot: copilotReducer,
    },
    preloadedState: initialState,
  });
  return render(<Provider store={store}>{ui}</Provider>);
}

describe("ReviewPanel", () => {
  it("renders review panel with title", () => {
    renderWithProviders(<ReviewPanel onSubmit={vi.fn()} />);

    expect(screen.getByText(/review complaint/i)).toBeInTheDocument();
  });

  it("shows completeness badge", () => {
    renderWithProviders(<ReviewPanel onSubmit={vi.fn()} />);

    expect(screen.getByText(/field coverage/i)).toBeInTheDocument();
  });

  it("shows missing fields when incomplete", () => {
    renderWithProviders(<ReviewPanel onSubmit={vi.fn()} />);

    expect(screen.getByText(/missing fields/i)).toBeInTheDocument();
  });

  it("shows confirmation checkbox", () => {
    renderWithProviders(<ReviewPanel onSubmit={vi.fn()} />);

    expect(screen.getByLabelText(/i have reviewed/i)).toBeInTheDocument();
  });

  it("disables submit button when not confirmed", () => {
    renderWithProviders(<ReviewPanel onSubmit={vi.fn()} />);

    const submitButton = screen.getByRole("button", { name: /commit to qms/i });
    expect(submitButton).toBeDisabled();
  });

  it("enables submit button when confirmed and complete enough", () => {
    const initialState = {
      complaint: {
        formData: {
          complaintSource: "Phone",
          customerName: "John Doe",
          productName: "Aspirin",
          batchLotNumber: "B12345",
          complaintType: "Quality",
          complaintDate: "2024-01-15",
          detailedDescription: "Product was defective",
          productStrengthGrade: "",
          manufacturingDate: "",
          expiryDate: "",
          quantityAffected: "",
          initialSeverity: "",
          priority: "",
        },
      },
    };

    renderWithProviders(<ReviewPanel onSubmit={vi.fn()} />, initialState);

    const checkbox = screen.getByLabelText(/i have reviewed/i);
    fireEvent.click(checkbox);

    const submitButton = screen.getByRole("button", { name: /commit to qms/i });
    expect(submitButton).not.toBeDisabled();
  });

  it("calls onSubmit when confirmed and clicked", () => {
    const onSubmit = vi.fn();
    const initialState = {
      complaint: {
        formData: {
          complaintSource: "Phone",
          customerName: "John Doe",
          productName: "Aspirin",
          batchLotNumber: "B12345",
          complaintType: "Quality",
          complaintDate: "2024-01-15",
          detailedDescription: "Product was defective",
          productStrengthGrade: "",
          manufacturingDate: "",
          expiryDate: "",
          quantityAffected: "",
          initialSeverity: "",
          priority: "",
        },
      },
    };

    renderWithProviders(<ReviewPanel onSubmit={onSubmit} />, initialState);

    const checkbox = screen.getByLabelText(/i have reviewed/i);
    fireEvent.click(checkbox);

    const submitButton = screen.getByRole("button", { name: /commit to qms/i });
    fireEvent.click(submitButton);

    expect(onSubmit).toHaveBeenCalledTimes(1);
  });
});
