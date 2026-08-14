import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import complaintReducer from "@/store/slices/complaintSlice";
import copilotReducer from "@/store/slices/copilotSlice";
import uiReducer from "@/store/slices/uiSlice";
import { AiAssistantPanel } from "@/components/copilot/AiAssistantPanel";

function renderWithProviders(ui: React.ReactElement) {
  const store = configureStore({
    reducer: {
      complaint: complaintReducer,
      copilot: copilotReducer,
      ui: uiReducer,
    },
  });
  return render(<Provider store={store}>{ui}</Provider>);
}

describe("AiAssistantPanel", () => {
  it("renders panel with title", () => {
    renderWithProviders(<AiAssistantPanel />);

    expect(screen.getByText(/ai complaint intake assistant/i)).toBeInTheDocument();
  });

  it("shows beta badge", () => {
    renderWithProviders(<AiAssistantPanel />);

    expect(screen.getByText("BETA")).toBeInTheDocument();
  });

  it("renders upload area", () => {
    renderWithProviders(<AiAssistantPanel />);

    expect(screen.getByText(/drag & drop/i)).toBeInTheDocument();
    expect(screen.getByText(/click to browse/i)).toBeInTheDocument();
  });

  it("renders paste text button", () => {
    renderWithProviders(<AiAssistantPanel />);

    expect(screen.getByText(/paste complaint text/i)).toBeInTheDocument();
  });

  it("shows supported formats", () => {
    renderWithProviders(<AiAssistantPanel />);

    expect(screen.getByText(/pdf, docx, txt/i)).toBeInTheDocument();
  });

  it("renders chat input", () => {
    renderWithProviders(<AiAssistantPanel />);

    expect(screen.getByPlaceholderText(/ask about this complaint/i)).toBeInTheDocument();
  });

  it("shows initial welcome message", () => {
    renderWithProviders(<AiAssistantPanel />);

    expect(screen.getByText(/upload a complaint document/i)).toBeInTheDocument();
  });

  it("shows AI disclaimer", () => {
    renderWithProviders(<AiAssistantPanel />);

    expect(screen.getByText(/ai responses may contain errors/i)).toBeInTheDocument();
  });
});
