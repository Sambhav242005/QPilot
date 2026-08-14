"use client";

import { useState, useCallback } from "react";
import { ComplaintForm } from "@/components/complaint/ComplaintForm";
import { AiAssistantPanel } from "@/components/copilot/AiAssistantPanel";
import { ReviewPanel } from "@/components/review/ReviewPanel";
import { AppShell } from "@/components/layout/AppShell";
import { complaintApi } from "@/services/api";
import { useAppDispatch } from "@/store/hooks";
import { addMessage } from "@/store/slices/copilotSlice";
import { useToast } from "@/components/ui-extra/toast";

export default function HomePage() {
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const [complaintId, setComplaintId] = useState<string | null>(null);
  const [showReview, setShowReview] = useState(false);
  const [committing, setCommitting] = useState(false);

  const handleComplaintCreated = useCallback((id: string) => {
    setComplaintId(id);
  }, []);

  const handleCommit = useCallback(async () => {
    if (!complaintId) return;
    setCommitting(true);
    try {
      const res = await complaintApi.commit(complaintId);
      if (res.success) {
        toast("Complaint committed to QMS successfully.", "success");
        dispatch(addMessage({
          role: "assistant",
          content: "Complaint committed to QMS successfully. This record is now read-only.",
        }));
        setShowReview(false);
        setComplaintId(null);
      } else {
        toast(res.error ?? "Commit failed. Review the complaint and try again.", "error");
        dispatch(addMessage({
          role: "assistant",
          content: `Commit failed: ${res.error ?? "Unknown error"}`,
        }));
      }
    } catch (err) {
      toast("Commit failed. Check the connection and try again.", "error");
      dispatch(addMessage({
        role: "assistant",
        content: `Commit failed: ${err instanceof Error ? err.message : "Unknown error"}`,
      }));
    } finally {
      setCommitting(false);
    }
  }, [complaintId, dispatch, toast]);

  return (
    <AppShell>
      <div className="min-h-[calc(100vh-4.5rem)] bg-gray-50">
        <div className="mx-auto max-w-7xl p-4 sm:p-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left Panel - Complaint Form (2/3 width) */}
          <div className="flex min-h-0 flex-col lg:col-span-2">
            <div className="space-y-6">
              <ComplaintForm />

              {/* Review Panel (below form when complaint exists) */}
              {complaintId && showReview && (
                <ReviewPanel onSubmit={handleCommit} loading={committing} />
              )}
            </div>

            {/* Sticky review toggle - always visible at bottom of form panel */}
            {complaintId && !showReview && (
              <div className="shrink-0 bg-gray-50 border-t border-gray-200 p-4">
                <button
                  onClick={() => setShowReview(true)}
                  className="w-full rounded-lg border-2 border-dashed border-gray-300 py-3 text-sm text-gray-600 transition-colors hover:border-blue-400 hover:text-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  Open Review &amp; Commit Panel
                </button>
              </div>
            )}
          </div>

          {/* Right Panel - AI Assistant (1/3 width) */}
          <div className="min-h-[38rem] lg:col-span-1 lg:h-[calc(100vh-7rem)]">
            <AiAssistantPanel
              complaintId={complaintId}
              onComplaintCreated={handleComplaintCreated}
            />
          </div>
        </div>
      </div>
      </div>
    </AppShell>
  );
}
