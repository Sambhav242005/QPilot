import { createSlice, PayloadAction } from "@reduxjs/toolkit";

// ─── Types ───────────────────────────────────────────────────────────
export interface ComplaintFormData {
  // Section 1: Origin & Customer Details
  complaintSource: string;
  customerName: string;

  // Section 2: Product & Batch Identification
  productName: string;
  productStrengthGrade: string;
  batchLotNumber: string;
  manufacturingDate: string;
  expiryDate: string;
  quantityAffected: string;

  // Section 3: Complaint Details
  complaintType: string;
  complaintDate: string;
  detailedDescription: string;

  // Section 4: Initial Assessment & Priority
  initialSeverity: string;
  priority: string;
}

interface ComplaintState {
  formData: ComplaintFormData;
  currentStep: number;
  isDirty: boolean;
  isSubmitting: boolean;
  error: string | null;
}

const initialFormData: ComplaintFormData = {
  complaintSource: "",
  customerName: "",
  productName: "",
  productStrengthGrade: "",
  batchLotNumber: "",
  manufacturingDate: "",
  expiryDate: "",
  quantityAffected: "",
  complaintType: "",
  complaintDate: "",
  detailedDescription: "",
  initialSeverity: "",
  priority: "",
};

const initialState: ComplaintState = {
  formData: initialFormData,
  currentStep: 0,
  isDirty: false,
  isSubmitting: false,
  error: null,
};

// ─── Slice ───────────────────────────────────────────────────────────
const complaintSlice = createSlice({
  name: "complaint",
  initialState,
  reducers: {
    updateFormField: (
      state,
      action: PayloadAction<{ field: keyof ComplaintFormData; value: string }>,
    ) => {
      state.formData[action.payload.field] = action.payload.value;
      state.isDirty = true;
    },
    updateMultipleFields: (state, action: PayloadAction<Partial<ComplaintFormData>>) => {
      state.formData = { ...state.formData, ...action.payload };
      state.isDirty = true;
    },
    resetForm: (state) => {
      state.formData = initialFormData;
      state.isDirty = false;
      state.error = null;
    },
    setCurrentStep: (state, action: PayloadAction<number>) => {
      state.currentStep = action.payload;
    },
    setSubmitting: (state, action: PayloadAction<boolean>) => {
      state.isSubmitting = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    clearDirty: (state) => {
      state.isDirty = false;
    },
  },
});

export const {
  updateFormField,
  updateMultipleFields,
  resetForm,
  setCurrentStep,
  setSubmitting,
  setError,
  clearDirty,
} = complaintSlice.actions;

export default complaintSlice.reducer;
