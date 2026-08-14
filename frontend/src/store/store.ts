import { configureStore } from "@reduxjs/toolkit";
import complaintReducer from "./slices/complaintSlice";
import copilotReducer from "./slices/copilotSlice";
import uiReducer from "./slices/uiSlice";

export const makeStore = () =>
  configureStore({
    reducer: {
      complaint: complaintReducer,
      copilot: copilotReducer,
      ui: uiReducer,
    },
  });

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
