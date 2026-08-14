"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

// ─── Types ───────────────────────────────────────────────────────────
interface CommitButtonProps {
  disabled?: boolean;
  loading?: boolean;
  onCommit: () => void;
  complaintId?: string;
  status?: string;
}

// ─── Component ───────────────────────────────────────────────────────
export function CommitButton({
  disabled = false,
  loading = false,
  onCommit,
  complaintId,
  status,
}: CommitButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleCommit = () => {
    onCommit();
    setIsOpen(false);
  };

  const canCommit = status === "review" || status === "ready_to_commit";

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger
        render={<Button variant="default" disabled={disabled || !canCommit || loading} />}
      >
        {loading ? "Committing…" : "Commit to QMS"}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm QMS Commit</DialogTitle>
          <DialogDescription>
            Are you sure you want to commit this complaint to the Quality Management System? This
            action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Complaint ID:</span>
            <Badge variant="outline">{complaintId || "New"}</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Status:</span>
            <Badge variant={canCommit ? "default" : "destructive"}>{status || "pending"}</Badge>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button variant="default" onClick={handleCommit} disabled={!canCommit || loading}>
            {loading ? "Committing…" : "Confirm Commit"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
