import { describe, it, expect, beforeEach } from "vitest";
import { configureStore } from "@reduxjs/toolkit";
import complaintReducer, {
  updateFormField,
  updateMultipleFields,
  resetForm,
  setCurrentStep,
  setSubmitting,
  setError,
  clearDirty,
  ComplaintFormData,
} from "@/store/slices/complaintSlice";

describe("complaintSlice", () => {
  let store: ReturnType<typeof configureStore<{ complaint: ReturnType<typeof complaintReducer> }>>;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        complaint: complaintReducer,
      },
    });
  });

  it("should return the initial state", () => {
    const state = store.getState().complaint;
    expect(state.formData.complaintSource).toBe("");
    expect(state.formData.customerName).toBe("");
    expect(state.formData.productName).toBe("");
    expect(state.currentStep).toBe(0);
    expect(state.isDirty).toBe(false);
    expect(state.isSubmitting).toBe(false);
    expect(state.error).toBeNull();
  });

  it("should handle updateFormField", () => {
    store.dispatch(updateFormField({ field: "complaintSource", value: "Phone" }));
    const state = store.getState().complaint;
    expect(state.formData.complaintSource).toBe("Phone");
    expect(state.isDirty).toBe(true);
  });

  it("should handle updateMultipleFields", () => {
    const updates: Partial<ComplaintFormData> = {
      complaintSource: "Email",
      customerName: "John Doe",
      productName: "Aspirin",
    };
    store.dispatch(updateMultipleFields(updates));
    const state = store.getState().complaint;
    expect(state.formData.complaintSource).toBe("Email");
    expect(state.formData.customerName).toBe("John Doe");
    expect(state.formData.productName).toBe("Aspirin");
    expect(state.isDirty).toBe(true);
  });

  it("should handle resetForm", () => {
    store.dispatch(updateFormField({ field: "complaintSource", value: "Phone" }));
    store.dispatch(resetForm());
    const state = store.getState().complaint;
    expect(state.formData.complaintSource).toBe("");
    expect(state.isDirty).toBe(false);
    expect(state.error).toBeNull();
  });

  it("should handle setCurrentStep", () => {
    store.dispatch(setCurrentStep(2));
    const state = store.getState().complaint;
    expect(state.currentStep).toBe(2);
  });

  it("should handle setSubmitting", () => {
    store.dispatch(setSubmitting(true));
    const state = store.getState().complaint;
    expect(state.isSubmitting).toBe(true);
  });

  it("should handle setError", () => {
    store.dispatch(setError("Test error"));
    const state = store.getState().complaint;
    expect(state.error).toBe("Test error");
  });

  it("should handle clearDirty", () => {
    store.dispatch(updateFormField({ field: "complaintSource", value: "Phone" }));
    expect(store.getState().complaint.isDirty).toBe(true);
    store.dispatch(clearDirty());
    expect(store.getState().complaint.isDirty).toBe(false);
  });
});
