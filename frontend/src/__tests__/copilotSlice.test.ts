import { describe, it, expect, beforeEach } from "vitest";
import { configureStore } from "@reduxjs/toolkit";
import copilotReducer, {
  addMessage,
  setTyping,
  setExtractionProgress,
  setExtracting,
  setUploadedFile,
  setError,
  clearMessages,
  setAnalysis,
} from "@/store/slices/copilotSlice";

describe("copilotSlice", () => {
  let store: ReturnType<typeof configureStore<{ copilot: ReturnType<typeof copilotReducer> }>>;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        copilot: copilotReducer,
      },
    });
  });

  it("should return the initial state", () => {
    const state = store.getState().copilot;
    expect(state.messages).toHaveLength(1);
    expect(state.messages[0].role).toBe("assistant");
    expect(state.isTyping).toBe(false);
    expect(state.extractionProgress).toBe(0);
    expect(state.isExtracting).toBe(false);
    expect(state.uploadedFile).toBeNull();
    expect(state.error).toBeNull();
  });

  it("should handle addMessage", () => {
    store.dispatch(addMessage({ role: "user", content: "Hello" }));
    const state = store.getState().copilot;
    expect(state.messages).toHaveLength(2);
    expect(state.messages[1].role).toBe("user");
    expect(state.messages[1].content).toBe("Hello");
    expect(state.messages[1].id).toBeDefined();
    expect(state.messages[1].timestamp).toBeDefined();
  });

  it("should handle setTyping", () => {
    store.dispatch(setTyping(true));
    const state = store.getState().copilot;
    expect(state.isTyping).toBe(true);
  });

  it("should handle setExtractionProgress", () => {
    store.dispatch(setExtractionProgress(50));
    const state = store.getState().copilot;
    expect(state.extractionProgress).toBe(50);
  });

  it("should handle setExtracting", () => {
    store.dispatch(setExtracting(true));
    const state = store.getState().copilot;
    expect(state.isExtracting).toBe(true);
  });

  it("should handle setUploadedFile", () => {
    const file = new File(["test"], "test.pdf", { type: "application/pdf" });
    store.dispatch(setUploadedFile(file));
    const state = store.getState().copilot;
    expect(state.uploadedFile).toBe(file);
  });

  it("should handle setError", () => {
    store.dispatch(setError("Test error"));
    const state = store.getState().copilot;
    expect(state.error).toBe("Test error");
  });

  it("should store structured analysis separately from chat messages", () => {
    store.dispatch(setAnalysis({
      classification: {
        category: "Product Defect",
        subcategory: "Discoloration",
        reasoning: "Visible product defect.",
      },
      riskAssessment: {
        severity: "Major",
        risk_factors: ["Batch identified"],
        reasoning: "Requires investigation.",
        recommended_action: "Route to QA.",
        confidence: "High",
      },
      completeness: {
        score: 0.8,
        required_fields: [],
        present_fields: 8,
        missing_fields: ["expiry_date"],
        explanation: null,
      },
    }));

    expect(store.getState().copilot.analysis?.riskAssessment?.severity).toBe("Major");
    expect(store.getState().copilot.messages).toHaveLength(1);
  });

  it("should handle clearMessages", () => {
    store.dispatch(addMessage({ role: "user", content: "Hello" }));
    store.dispatch(clearMessages());
    const state = store.getState().copilot;
    expect(state.messages).toHaveLength(0);
  });

  it("should add multiple messages in order", () => {
    store.dispatch(clearMessages()); // Clear initial message first
    store.dispatch(addMessage({ role: "user", content: "Message 1" }));
    store.dispatch(addMessage({ role: "assistant", content: "Message 2" }));
    const state = store.getState().copilot;
    expect(state.messages).toHaveLength(2);
    expect(state.messages[0].content).toBe("Message 1");
    expect(state.messages[0].role).toBe("user");
    expect(state.messages[1].content).toBe("Message 2");
    expect(state.messages[1].role).toBe("assistant");
    expect(state.messages[0].id).toBeDefined();
    expect(state.messages[1].id).toBeDefined();
    expect(state.messages[0].timestamp).toBeDefined();
  });
});
