"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { AlertTriangle, Package, FileText, Zap, Shield, Truck, HelpCircle } from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────
interface Classification {
  category: string;
  subcategory: string | null;
  reasoning: string;
}

interface ClassificationBadgeProps {
  classification: Classification;
  showReasoning?: boolean;
}

// ─── Category Config ─────────────────────────────────────────────────
const categoryConfig: Record<string, { color: string; icon: typeof AlertTriangle }> = {
  "Product Defect": {
    color: "bg-red-100 text-red-800 border-red-200",
    icon: AlertTriangle,
  },
  "Packaging Issue": {
    color: "bg-amber-100 text-amber-800 border-amber-200",
    icon: Package,
  },
  Documentation: {
    color: "bg-blue-100 text-blue-800 border-blue-200",
    icon: FileText,
  },
  Efficacy: {
    color: "bg-purple-100 text-purple-800 border-purple-200",
    icon: Zap,
  },
  "Adverse Event": {
    color: "bg-orange-100 text-orange-800 border-orange-200",
    icon: Shield,
  },
  Supply: {
    color: "bg-cyan-100 text-cyan-800 border-cyan-200",
    icon: Truck,
  },
  Other: {
    color: "bg-gray-100 text-gray-800 border-gray-200",
    icon: HelpCircle,
  },
};

// ─── Component ───────────────────────────────────────────────────────
export function ClassificationBadge({
  classification,
  showReasoning = false,
}: ClassificationBadgeProps) {
  const config = categoryConfig[classification.category] ?? categoryConfig.Other;
  const Icon = config.icon;

  return (
    <div className="inline-flex flex-col gap-1">
      <Badge variant="outline" className={cn("inline-flex items-center gap-1.5", config.color)}>
        <Icon className="w-3.5 h-3.5" aria-hidden="true" />
        <span>{classification.category}</span>
        {classification.subcategory && (
          <span className="text opacity-70">— {classification.subcategory}</span>
        )}
      </Badge>

      {showReasoning && <p className="text-xs text-gray-500 mt-1">{classification.reasoning}</p>}
    </div>
  );
}
