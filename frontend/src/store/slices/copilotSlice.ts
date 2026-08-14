import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { CopilotAnalysis } from "@/types";

// ─── Types ───────────────────────────────────────────────────────────
export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

interface CopilotState {
  messages: Message[];
  analysis: CopilotAnalysis | null;
  isTyping: boolean;
  extractionProgress: number;
  isExtracting: boolean;
  uploadedFile: File | null;
  error: string | null;
}

const initialState: CopilotState = {
  messages: [
    {
      id: "1",
      role: "assistant",
      content:
        "Upload a complaint document or paste text above. I will automatically extract the details and populate the form for you.",
      timestamp: new Date().toISOString(),
    },
  ],
  analysis: null,
  isTyping: false,
  extractionProgress: 0,
  isExtracting: false,
  uploadedFile: null,
  error: null,
};

// ─── Slice ───────────────────────────────────────────────────────────
const copilotSlice = createSlice({
  name: "copilot",
  initialState,
  reducers: {
    addMessage: (state, action: PayloadAction<Omit<Message, "id" | "timestamp">>) => {
      state.messages.push({
        ...action.payload,
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
      });
    },
    setTyping: (state, action: PayloadAction<boolean>) => {
      state.isTyping = action.payload;
    },
    setExtractionProgress: (state, action: PayloadAction<number>) => {
      state.extractionProgress = action.payload;
    },
    setExtracting: (state, action: PayloadAction<boolean>) => {
      state.isExtracting = action.payload;
    },
    setUploadedFile: (state, action: PayloadAction<File | null>) => {
      state.uploadedFile = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    clearMessages: (state) => {
      state.messages = [];
    },
    dismissEmptyState: (state) => {
      state.messages = state.messages.filter(
        (message) => !message.content.startsWith("Upload a complaint document or paste text above."),
      );
    },
    setAnalysis: (state, action: PayloadAction<CopilotAnalysis | null>) => {
      state.analysis = action.payload;
    },
  },
});

export const {
  addMessage,
  setTyping,
  setExtractionProgress,
  setExtracting,
  setUploadedFile,
  setError,
  clearMessages,
  dismissEmptyState,
  setAnalysis,
} = copilotSlice.actions;

export default copilotSlice.reducer;
