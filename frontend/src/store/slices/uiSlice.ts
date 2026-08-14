import { createSlice, PayloadAction } from "@reduxjs/toolkit";

// ─── Types ───────────────────────────────────────────────────────────
type Theme = "light" | "dark" | "system";

interface UiState {
  sidebarOpen: boolean;
  theme: Theme;
  isLoading: boolean;
  notification: {
    message: string;
    type: "success" | "error" | "info" | "warning";
  } | null;
}

const initialState: UiState = {
  sidebarOpen: true,
  theme: "system",
  isLoading: false,
  notification: null,
};

// ─── Slice ───────────────────────────────────────────────────────────
const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload;
    },
    setTheme: (state, action: PayloadAction<Theme>) => {
      state.theme = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    showNotification: (
      state,
      action: PayloadAction<{
        message: string;
        type: "success" | "error" | "info" | "warning";
      }>,
    ) => {
      state.notification = action.payload;
    },
    clearNotification: (state) => {
      state.notification = null;
    },
  },
});

export const {
  toggleSidebar,
  setSidebarOpen,
  setTheme,
  setLoading,
  showNotification,
  clearNotification,
} = uiSlice.actions;

export default uiSlice.reducer;
