import { createSlice, PayloadAction } from "@reduxjs/toolkit";

// ─── Types ───────────────────────────────────────────────────────────
export type UploadStatus = "idle" | "uploading" | "processing" | "complete" | "error";

interface UploadState {
  file: File | null;
  fileName: string | null;
  fileSize: number | null;
  mimeType: string | null;
  uploadProgress: number;
  status: UploadStatus;
  extractedText: string | null;
  error: string | null;
}

const initialState: UploadState = {
  file: null,
  fileName: null,
  fileSize: null,
  mimeType: null,
  uploadProgress: 0,
  status: "idle",
  extractedText: null,
  error: null,
};

// ─── Slice ───────────────────────────────────────────────────────────
const uploadSlice = createSlice({
  name: "upload",
  initialState,
  reducers: {
    setFile: (state, action: PayloadAction<File | null>) => {
      const file = action.payload;
      state.file = file;
      state.fileName = file?.name ?? null;
      state.fileSize = file?.size ?? null;
      state.mimeType = file?.type ?? null;
      state.status = file ? "idle" : "idle";
      state.error = null;
    },
    setUploadProgress: (state, action: PayloadAction<number>) => {
      state.uploadProgress = action.payload;
    },
    setStatus: (state, action: PayloadAction<UploadStatus>) => {
      state.status = action.payload;
    },
    setExtractedText: (state, action: PayloadAction<string | null>) => {
      state.extractedText = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.status = "error";
    },
    resetUpload: () => {
      return initialState;
    },
  },
});

export const { setFile, setUploadProgress, setStatus, setExtractedText, setError, resetUpload } =
  uploadSlice.actions;

export default uploadSlice.reducer;
