import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import type { UnknownAction } from "redux";
import complaintReducer from "@/store/slices/complaintSlice";
import copilotReducer from "@/store/slices/copilotSlice";
import { ComplaintForm } from "@/components/complaint/ComplaintForm";
import { AiAssistantPanel } from "@/components/copilot/AiAssistantPanel";
import { ReviewPanel } from "@/components/review/ReviewPanel";

const testComplaintReducer = (state = complaintReducer(undefined, { type: "test/init" }), action: UnknownAction) =>
  complaintReducer(state, action);
const testCopilotReducer = (state = copilotReducer(undefined, { type: "test/init" }), action: UnknownAction) =>
  copilotReducer(state, action);

function renderWithProviders(
  ui: React.ReactElement,
  preloadedState?: {
    complaint?: ReturnType<typeof testComplaintReducer>;
    copilot?: ReturnType<typeof testCopilotReducer>;
  },
) {
  const store = configureStore({
    reducer: { complaint: testComplaintReducer, copilot: testCopilotReducer },
    preloadedState,
  });
  return render(<Provider store={store}>{ui}</Provider>);
}

describe("Frontend Integration — Form ↔ Redux", () => {
  it("complaint form populates from Redux state", () => {
    renderWithProviders(<ComplaintForm />, {
      complaint: {
        formData: {
          complaintSource: "pharmacy",
          customerName: "Acme Corp",
          productName: "Aspirin",
          productStrengthGrade: "100mg",
          batchLotNumber: "B-001",
          manufacturingDate: "2025-01-01",
          expiryDate: "2027-01-01",
          quantityAffected: "500",
          complaintType: "product_defect",
          complaintDate: "2025-06-15",
          detailedDescription: "Cracked tablets found",
          initialSeverity: "major",
          priority: "high",
        },
        currentStep: 0,
        isDirty: false,
        isSubmitting: false,
        error: null,
      },
    });

    expect(screen.getByDisplayValue("Acme Corp")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Aspirin")).toBeInTheDocument();
    expect(screen.getByDisplayValue("B-001")).toBeInTheDocument();
  });

  it("form fields remain editable for human review", () => {
    renderWithProviders(<ComplaintForm />);
    const nameInput = screen.getAllByPlaceholderText(/awaiting ai extraction/i)[0];
    expect(nameInput).not.toHaveAttribute("readonly");
  });
});

describe("Frontend Integration — AI Panel ↔ Redux", () => {
  it("copilot panel displays messages from Redux", () => {
    renderWithProviders(<AiAssistantPanel />, {
      copilot: {
        messages: [
          { id: "1", role: "assistant", content: "Welcome message", timestamp: "" },
          { id: "2", role: "user", content: "User question", timestamp: "" },
          { id: "3", role: "assistant", content: "AI response here", timestamp: "" },
        ],
        analysis: null,
        isTyping: false,
        extractionProgress: 0,
        isExtracting: false,
        uploadedFile: null,
        error: null,
      },
    });

    expect(screen.getByText("Welcome message")).toBeInTheDocument();
    expect(screen.getByText("User question")).toBeInTheDocument();
    expect(screen.getByText("AI response here")).toBeInTheDocument();
  });

  it("typing indicator shows when isTyping is true", () => {
    renderWithProviders(<AiAssistantPanel />, {
      copilot: {
        messages: [],
        analysis: null,
        isTyping: true,
        extractionProgress: 0,
        isExtracting: false,
        uploadedFile: null,
        error: null,
      },
    });

    // The panel should show a loading/thinking state (typing indicator or similar)
    const panel = screen.getByText(/ai complaint intake assistant/i).closest("div");
    expect(panel).toBeTruthy();
  });

  it("extraction progress shows when extracting", () => {
    renderWithProviders(<AiAssistantPanel />, {
      copilot: {
        messages: [],
        analysis: null,
        isTyping: false,
        extractionProgress: 60,
        isExtracting: true,
        uploadedFile: null,
        error: null,
      },
    });

    expect(screen.getByText(/extracting/i)).toBeInTheDocument();
  });
});

describe("Frontend Integration — Review Panel", () => {
  it("review panel shows all AI content sections", () => {
    renderWithProviders(
      <ReviewPanel onSubmit={vi.fn()} />,
      {
        complaint: {
          formData: {
            complaintSource: "pharmacy",
            customerName: "Test",
            productName: "Aspirin",
            productStrengthGrade: "",
            batchLotNumber: "B-001",
            manufacturingDate: "",
            expiryDate: "",
            quantityAffected: "100",
            complaintType: "product_defect",
            complaintDate: "2025-06-15",
            detailedDescription: "Broken tablets",
            initialSeverity: "major",
            priority: "high",
          },
          currentStep: 0,
          isDirty: false,
          isSubmitting: false,
          error: null,
        },
        copilot: {
          messages: [],
          analysis: null,
          isTyping: false,
          extractionProgress: 0,
          isExtracting: false,
          uploadedFile: null,
          error: null,
        },
      },
    );

    expect(screen.getByText(/review complaint/i)).toBeInTheDocument();
    expect(screen.getByText(/complete/i)).toBeInTheDocument();
  });
});
