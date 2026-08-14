"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────
type Status = "idle" | "processing" | "complete" | "error";
type ReviewState = "pending" | "approved" | "rejected";
type CommitState = "draft" | "reviewing" | "committed";

interface ComplaintStatusProps {
  processingStatus?: Status;
  reviewState?: ReviewState;
  commitState?: CommitState;
  showAll?: boolean;
}

// ─── Configurations ──────────────────────────────────────────────────
const statusConfig: Record<Status, { color: string; label: string }> = {
  idle: { color: "bg-gray-100 text-gray-800", label: "Draft" },
  processing: { color: "bg-blue-100 text-blue-800", label: "Processing" },
  complete: { color: "bg-green-100 text-green-800", label: "Complete" },
  error: { color: "bg-red-100 text-red-800", label: "Error" },
};

const reviewConfig: Record<ReviewState, { color: string; label: string }> = {
  pending: { color: "bg-amber-100 text-amber-800", label: "Pending Review" },
  approved: { color: "bg-green-100 text-green-800", label: "Approved" },
  rejected: { color: "bg-red-100 text-red-800", label: "Rejected" },
};

const commitConfig: Record<CommitState, { color: string; label: string }> = {
  draft: { color: "bg-gray-100 text-gray-800", label: "Draft" },
  reviewing: { color: "bg-amber-100 text-amber-800", label: "In Review" },
  committed: { color: "bg-green-100 text-green-800", label: "Committed" },
};

// ─── Component ───────────────────────────────────────────────────────
export function ComplaintStatus({
  processingStatus = "idle",
  reviewState = "pending",
  commitState = "draft",
  showAll = false,
}: ComplaintStatusProps) {
  if (!showAll) {
    // Show only the most relevant status
    const activeStatus =
      commitState === "committed"
        ? commitConfig.committed
        : reviewState === "approved"
          ? reviewConfig.approved
          : processingStatus === "processing"
            ? statusConfig.processing
            : reviewConfig[reviewState];

    return (
      <Badge variant="outline" className={cn("text-xs", activeStatus.color)}>
        {activeStatus.label}
      </Badge>
    );
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Badge variant="outline" className={cn("text-xs", statusConfig[processingStatus].color)}>
        {statusConfig[processingStatus].label}
      </Badge>
      <Badge variant="outline" className={cn("text-xs", reviewConfig[reviewState].color)}>
        {reviewConfig[reviewState].label}
      </Badge>
      <Badge variant="outline" className={cn("text-xs", commitConfig[commitState].color)}>
        {commitConfig[commitState].label}
      </Badge>
    </div>
  );
}
