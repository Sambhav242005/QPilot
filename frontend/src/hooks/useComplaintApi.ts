"use client";

import { useCallback } from "react";
import { useAppDispatch } from "@/store/hooks";
import { updateMultipleFields } from "@/store/slices/complaintSlice";
import {
  addMessage,
  dismissEmptyState,
  setAnalysis,
  setExtracting,
  setExtractionProgress,
} from "@/store/slices/copilotSlice";
import { complaintApi } from "@/services/api";
import { normalizeCopilotAnalysis } from "@/lib/analysis";

// ─── Hook ────────────────────────────────────────────────────────────
export function useComplaintApi() {
  const dispatch = useAppDispatch();

  /**
   * Load all complaints
   */
  const loadComplaints = useCallback(async () => {
    const response = await complaintApi.getAll();
    if (!response.success) {
      throw new Error(response.error ?? "Failed to load complaints");
    }
    return response.data ?? [];
  }, []);

  /**
   * Load a single complaint
   */
  const loadComplaint = useCallback(async (id: string) => {
    const response = await complaintApi.getById(id);
    if (!response.success) {
      throw new Error(response.error ?? "Failed to load complaint");
    }
    return response.data;
  }, []);

  /**
   * Create a new complaint from text
   */
  const submitComplaint = useCallback(async (text: string) => {
    const response = await complaintApi.create({
      rawInput: text,
      inputType: "text",
    });
    if (!response.success) {
      throw new Error(response.error ?? "Failed to create complaint");
    }
    return response.data;
  }, []);

  /**
   * Process a complaint through the AI workflow
   */
  const processComplaint = useCallback(async (id: string) => {
    dispatch(setExtracting(true));
    dispatch(setExtractionProgress(0));

    try {
      const response = await complaintApi.process(id);
      if (!response.success) {
        throw new Error(response.error ?? "Processing failed");
      }

      // Update form with extracted data
      if (response.data?.extraction) {
        const extraction = typeof response.data.extraction === "string"
          ? JSON.parse(response.data.extraction)
          : response.data.extraction;
        dispatch(updateMultipleFields({
          complaintSource: extraction.complaint_source ?? "",
          customerName: extraction.customer_name ?? "",
          productName: extraction.product_name ?? "",
          productStrengthGrade: extraction.product_strength_grade ?? "",
          batchLotNumber: extraction.batch_lot_number ?? "",
          manufacturingDate: extraction.manufacturing_date ?? "",
          expiryDate: extraction.expiry_date ?? "",
          quantityAffected: extraction.quantity_affected ?? "",
          complaintType: extraction.complaint_type ?? "",
          complaintDate: extraction.complaint_date ?? "",
          detailedDescription: extraction.detailed_description ?? "",
          initialSeverity: extraction.initial_severity ?? "",
          priority: extraction.priority ?? "",
        }));
      }

      dispatch(setAnalysis(normalizeCopilotAnalysis(response.data)));
      dispatch(dismissEmptyState());

      dispatch(addMessage({
        role: "assistant",
        content: "**Complaint Processed**\n\nI extracted the complaint details and populated the form. The initial AI classification and risk assessment are shown below. Please review the fields and recommendations before committing to QMS.",
      }));

      return response.data;
    } catch (err) {
      dispatch(addMessage({
        role: "assistant",
        content: `Processing failed: ${err instanceof Error ? err.message : "Unknown error"}. Please try again.`,
      }));
      throw err;
    } finally {
      dispatch(setExtracting(false));
      dispatch(setExtractionProgress(100));
    }
  }, [dispatch]);

  /**
   * Update complaint fields
   */
  const updateFields = useCallback(async (id: string, fields: Record<string, unknown>) => {
    const response = await complaintApi.update(id, fields);
    if (!response.success) {
      throw new Error(response.error ?? "Failed to update complaint");
    }
    return response.data;
  }, []);

  /**
   * Send a correction to the AI
   */
  const sendCorrection = useCallback(async (id: string, correction: string) => {
    dispatch(addMessage({ role: "user", content: correction }));

    try {
      const response = await complaintApi.correct(id, correction);
      if (!response.success) {
        throw new Error(response.error ?? "Correction failed");
      }

      // Update form with corrected data
      if (response.data?.extraction) {
        const extraction = typeof response.data.extraction === "string"
          ? JSON.parse(response.data.extraction)
          : response.data.extraction;
        dispatch(updateMultipleFields({
          complaintSource: extraction.complaint_source ?? "",
          customerName: extraction.customer_name ?? "",
          productName: extraction.product_name ?? "",
          batchLotNumber: extraction.batch_lot_number ?? "",
          complaintType: extraction.complaint_type ?? "",
          detailedDescription: extraction.detailed_description ?? "",
        }));
      }

      dispatch(setAnalysis(normalizeCopilotAnalysis(response.data)));

      dispatch(addMessage({
        role: "assistant",
        content: "Correction applied. I refreshed the dependent classification, risk assessment, and completeness check below. Please review the changes.",
      }));

      return response.data;
    } catch (err) {
      dispatch(addMessage({
        role: "assistant",
        content: `Correction failed: ${err instanceof Error ? err.message : "Unknown error"}.`,
      }));
      throw err;
    }
  }, [dispatch]);

  /**
   * Commit complaint to QMS
   */
  const submitCommit = useCallback(async (id: string) => {
    const response = await complaintApi.commit(id);
    if (!response.success) {
      throw new Error(response.error ?? "Failed to commit complaint");
    }
    return response.data;
  }, []);

  /**
   * Send a chat message
   */
  const sendChatMessage = useCallback(
    async (message: string, complaintId?: string) => {
      dispatch(addMessage({ role: "user", content: message }));

      try {
        if (complaintId) {
          const response = await complaintApi.sendMessage(complaintId, message);
          if (response.success && response.data) {
            dispatch(addMessage({ role: "assistant", content: response.data.content }));
          } else {
            throw new Error(response.error ?? "No response");
          }
        } else {
          // No complaint context — local echo
          await new Promise((resolve) => setTimeout(resolve, 800));
          dispatch(addMessage({
            role: "assistant",
            content: "Please create or load a complaint first so I can provide context-aware assistance.",
          }));
        }
      } catch {
        dispatch(addMessage({
          role: "assistant",
          content: "Sorry, I couldn't process your message. Please try again.",
        }));
      }
    },
    [dispatch],
  );

  /**
   * Simulate AI extraction (mock for demo)
   */
  const simulateExtraction = useCallback(async () => {
    dispatch(setExtracting(true));
    dispatch(setExtractionProgress(0));

    for (let i = 0; i <= 100; i += 10) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      dispatch(setExtractionProgress(i));
    }

    dispatch(setExtracting(false));
    dispatch(
      addMessage({
        role: "assistant",
        content:
          "Document processed. I extracted the complaint details and populated the form. Review the AI analysis and missing information below before committing to QMS.",
      }),
    );
  }, [dispatch]);

  return {
    loadComplaints,
    loadComplaint,
    submitComplaint,
    processComplaint,
    updateFields,
    sendCorrection,
    submitCommit,
    simulateExtraction,
    sendChatMessage,
  };
}
