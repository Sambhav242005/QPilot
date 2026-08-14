"use client";

import { AlertCircle, CheckCircle2, ClipboardCheck, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ClassificationBadge } from "@/components/copilot/ClassificationBadge";
import { RiskAssessmentCard } from "@/components/copilot/RiskAssessmentCard";
import type { CopilotAnalysis } from "@/types";

interface AnalysisResultsProps {
  analysis: CopilotAnalysis;
}

function formatMissingField(field: string): string {
  return field
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

export function AnalysisResults({ analysis }: AnalysisResultsProps) {
  const { classification, riskAssessment, completeness } = analysis;
  const hasAnalysis = classification || riskAssessment || completeness;

  if (!hasAnalysis) return null;

  const completenessPercent = completeness ? Math.round(completeness.score * 100) : null;
  const missingFields = completeness?.missing_fields ?? [];

  return (
    <section aria-label="AI analysis" className="space-y-3 px-4 pb-4">
      <div className="rounded-lg border border-blue-200 bg-blue-50/70 p-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-blue-600" aria-hidden="true" />
            <div>
              <h3 className="text-sm font-semibold text-blue-950">AI Analysis</h3>
              <p className="text-xs text-blue-800">Initial assessment based on the complaint source.</p>
            </div>
          </div>
          <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-800">
            Ready for Review
          </Badge>
        </div>
        <p className="mt-3 flex items-start gap-2 text-xs leading-relaxed text-blue-900">
          <ClipboardCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          AI recommendations are not approvals. Review the extracted fields and analysis before any QMS commit.
        </p>
      </div>

      {completeness && completenessPercent !== null && (
        <Card className="border-slate-200 shadow-none">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                Complaint Field Completeness
              </CardTitle>
              <span className="text-sm font-semibold text-slate-900">{completenessPercent}%</span>
            </div>
          </CardHeader>
          <CardContent>
            <Progress value={completenessPercent} className="h-1.5" aria-label={`Complaint field completeness ${completenessPercent}%`} />
            <p className="mt-2 text-xs text-slate-500">
              This score reflects extracted field coverage, not AI analysis completion.
            </p>
          </CardContent>
        </Card>
      )}

      {classification && (
        <Card className="border-slate-200 shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wide text-slate-600">
              Complaint Classification
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-2 flex items-center justify-between gap-3 text-xs">
              <span className="font-medium uppercase tracking-wide text-slate-500">Complaint Type</span>
              <span className="font-semibold text-slate-900">{classification.category}</span>
            </div>
            <ClassificationBadge classification={classification} showReasoning />
          </CardContent>
        </Card>
      )}

      {riskAssessment && <RiskAssessmentCard assessment={riskAssessment} />}

      {completeness && missingFields.length > 0 ? (
        <Card className="border-amber-200 bg-amber-50/60 shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-amber-900">
              <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
              Missing Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs leading-relaxed text-amber-900">
              These fields were not found in the complaint. Add them through the form or tell me in chat.
            </p>
            <ul className="mt-2 space-y-1 text-sm text-amber-950">
              {missingFields.map((field) => (
                <li key={field} className="flex items-start gap-2">
                  <span aria-hidden="true">•</span>
                  <span>{formatMissingField(field)}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : completeness ? (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">
          <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
          All required complaint fields were found. Human review is still required.
        </div>
      ) : null}
    </section>
  );
}
