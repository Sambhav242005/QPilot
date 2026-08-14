"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAppSelector } from "@/store/hooks";

// ─── Types ───────────────────────────────────────────────────────────
interface ReviewPanelProps {
  onSubmit: () => void;
  loading?: boolean;
}

// ─── Component ───────────────────────────────────────────────────────
export function ReviewPanel({ onSubmit, loading = false }: ReviewPanelProps) {
  const { formData } = useAppSelector((state) => state.complaint);
  const { messages } = useAppSelector((state) => state.copilot);
  const [isConfirmed, setIsConfirmed] = useState(false);

  // Calculate completeness
  const requiredFields = [
    "complaintSource",
    "customerName",
    "productName",
    "batchLotNumber",
    "complaintType",
    "complaintDate",
    "detailedDescription",
  ];

  const presentFields = requiredFields.filter((field) => formData[field as keyof typeof formData]);
  const completenessScore = presentFields.length / requiredFields.length;

  const handleSubmit = () => {
    if (completenessScore >= 0.5 && isConfirmed) {
      onSubmit();
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Review Complaint</span>
          <Badge variant={completenessScore >= 0.5 ? "default" : "destructive"}>
            {Math.round(completenessScore * 100)}% Field Coverage
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          AI extraction and assessment are ready. Human review is required before committing this complaint to QMS.
        </p>

        {/* Summary */}
        <div className="space-y-2">
          <h4 className="font-medium">Complaint Summary</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-muted-foreground">Source:</span>{" "}
              {formData.complaintSource || "Not provided"}
            </div>
            <div>
              <span className="text-muted-foreground">Customer:</span>{" "}
              {formData.customerName || "Not provided"}
            </div>
            <div>
              <span className="text-muted-foreground">Product:</span>{" "}
              {formData.productName || "Not provided"}
            </div>
            <div>
              <span className="text-muted-foreground">Batch:</span>{" "}
              {formData.batchLotNumber || "Not provided"}
            </div>
          </div>
        </div>

        <Separator />

        {/* Missing Fields */}
        {completenessScore < 1 && (
          <div className="space-y-2">
            <h4 className="font-medium text-amber-600">Missing Fields</h4>
            <ul className="list-disc list-inside text-sm text-muted-foreground">
              {requiredFields
                .filter((field) => !formData[field as keyof typeof formData])
                .map((field) => (
                  <li key={field}>{field}</li>
                ))}
            </ul>
          </div>
        )}

        <Separator />

        {/* AI Analysis */}
        {messages.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium">AI Analysis</h4>
            <div className="text-sm text-muted-foreground max-h-32 overflow-y-auto">
              {messages
                .filter((m) => m.role === "assistant")
                .slice(-3)
                .map((msg, i) => (
                  <p key={i} className="mb-2">
                    {msg.content}
                  </p>
                ))}
            </div>
          </div>
        )}

        <Separator />

        {/* Confirmation */}
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="confirm"
            checked={isConfirmed}
            onChange={(e) => setIsConfirmed(e.target.checked)}
            className="rounded"
          />
          <label htmlFor="confirm" className="text-sm">
            I have reviewed the complaint data and confirm it is accurate
          </label>
        </div>

        {/* Submit Button */}
        <Button
          onClick={handleSubmit}
          disabled={!isConfirmed || completenessScore < 0.5 || loading}
          className="w-full"
        >
          {loading ? "Committing..." : "Commit to QMS"}
        </Button>
      </CardContent>
    </Card>
  );
}
