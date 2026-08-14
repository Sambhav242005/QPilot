"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { AlertTriangle, CheckCircle, Info } from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────
type Severity = "Critical" | "Major" | "Minor";
type Confidence = "High" | "Medium" | "Low";

interface RiskAssessment {
  severity: Severity;
  risk_factors: string[];
  reasoning: string;
  recommended_action: string;
  confidence: Confidence | null;
}

interface RiskAssessmentCardProps {
  assessment: RiskAssessment;
}

// ─── Configurations ──────────────────────────────────────────────────
const severityConfig: Record<Severity, { color: string; icon: typeof AlertTriangle }> = {
  Critical: {
    color: "bg-red-100 text-red-800 border-red-200",
    icon: AlertTriangle,
  },
  Major: {
    color: "bg-amber-100 text-amber-800 border-amber-200",
    icon: AlertTriangle,
  },
  Minor: {
    color: "bg-green-100 text-green-800 border-green-200",
    icon: CheckCircle,
  },
};

const confidenceConfig: Record<Confidence, { color: string }> = {
  High: { color: "bg-green-100 text-green-800" },
  Medium: { color: "bg-amber-100 text-amber-800" },
  Low: { color: "bg-gray-100 text-gray-800" },
};

// ─── Component ───────────────────────────────────────────────────────
export function RiskAssessmentCard({ assessment }: RiskAssessmentCardProps) {
  const severity = severityConfig[assessment.severity];
  const confidence = assessment.confidence
    ? confidenceConfig[assessment.confidence]
    : { color: "bg-gray-100 text-gray-700" };
  const SeverityIcon = severity.icon;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold">Risk Assessment</CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-medium uppercase tracking-wide text-gray-500">Initial Severity</span>
            <Badge variant="outline" className={cn("text-xs", confidence.color)}>
              {assessment.confidence ? `${assessment.confidence} Confidence` : "Confidence not provided"}
            </Badge>
            <Badge
              variant="outline"
              className={cn("text-xs flex items-center gap-1", severity.color)}
            >
              <SeverityIcon className="w-3 h-3" aria-hidden="true" />
              {assessment.severity}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Risk Factors */}
        <div>
          <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
            Risk Factors
          </h4>
          <ul className="space-y-1">
            {assessment.risk_factors.map((factor, i) => (
              <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                <span className="text-gray-400" aria-hidden="true">•</span>
                <span className="break-words">{factor}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Reasoning */}
        <div>
          <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
            Evidence &amp; Reasoning
          </h4>
          <p className="text-sm text-gray-700">{assessment.reasoning}</p>
        </div>

        {/* Recommended Action */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-blue-600 mt-0.5" aria-hidden="true" />
            <div>
              <h4 className="text-xs font-medium text-blue-800 uppercase tracking-wide mb-1">
                Recommended Action
              </h4>
              <p className="text-sm text-blue-700">{assessment.recommended_action}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
