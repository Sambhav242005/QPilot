"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { CheckCircle, AlertCircle, XCircle } from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────
interface CompletenessBadgeProps {
  score: number; // 0-100
  missingFields?: string[];
  showDetails?: boolean;
}

// ─── Helpers ─────────────────────────────────────────────────────────
function getScoreConfig(score: number) {
  if (score >= 80) {
    return {
      color: "bg-green-100 text-green-800 border-green-200",
      icon: CheckCircle,
      label: "Complete",
    };
  }
  if (score >= 50) {
    return {
      color: "bg-amber-100 text-amber-800 border-amber-200",
      icon: AlertCircle,
      label: "Partial",
    };
  }
  return {
    color: "bg-red-100 text-red-800 border-red-200",
    icon: XCircle,
    label: "Incomplete",
  };
}

// ─── Component ───────────────────────────────────────────────────────
export function CompletenessBadge({
  score,
  missingFields = [],
  showDetails = false,
}: CompletenessBadgeProps) {
  const config = getScoreConfig(score);
  const Icon = config.icon;

  return (
    <div className="inline-flex flex-col gap-1">
      <Badge variant="outline" className={cn("inline-flex items-center gap-1.5", config.color)}>
        <Icon className="w-3.5 h-3.5" />
        <span>{config.label}</span>
        <span className="font-mono">{score}%</span>
      </Badge>

      {showDetails && missingFields.length > 0 && (
        <div className="text-xs text-gray-500 mt-1">Missing: {missingFields.join(", ")}</div>
      )}
    </div>
  );
}
