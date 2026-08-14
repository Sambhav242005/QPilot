"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────
export type FieldState = "empty" | "populated" | "missing" | "edited";

interface ComplaintFieldProps {
  label: string;
  value: string | null;
  onChange?: (value: string) => void;
  type?: "text" | "textarea" | "select" | "date";
  options?: { value: string; label: string }[];
  placeholder?: string;
  state?: FieldState;
  disabled?: boolean;
  required?: boolean;
}

// ─── State Styles ────────────────────────────────────────────────────
const stateStyles: Record<FieldState, string> = {
  empty: "border-gray-200 bg-gray-50",
  populated: "border-green-200 bg-green-50",
  missing: "border-amber-200 bg-amber-50",
  edited: "border-blue-200 bg-blue-50",
};

const stateLabels: Record<FieldState, string> = {
  empty: "",
  populated: "AI Extracted",
  missing: "Missing",
  edited: "Edited",
};

const stateLabelColors: Record<FieldState, string> = {
  empty: "",
  populated: "text-green-600",
  missing: "text-amber-600",
  edited: "text-blue-600",
};

// ─── Component ───────────────────────────────────────────────────────
export function ComplaintField({
  label,
  value,
  onChange,
  type = "text",
  options = [],
  placeholder = "Awaiting AI extraction...",
  state = "empty",
  disabled = false,
  required = false,
}: ComplaintFieldProps) {
  const handleChange = (newValue: string) => {
    onChange?.(newValue);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        {stateLabels[state] && (
          <span className={`text-xs font-medium ${stateLabelColors[state]}`}>
            {stateLabels[state]}
          </span>
        )}
      </div>

      {type === "text" && (
        <Input
          value={value ?? ""}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(stateStyles[state])}
        />
      )}

      {type === "textarea" && (
        <Textarea
          value={value ?? ""}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          rows={4}
          className={cn(stateStyles[state])}
        />
      )}

      {type === "select" && (
        <Select
          value={value ?? ""}
          onValueChange={(v) => handleChange(v ?? "")}
          disabled={disabled}
        >
          <SelectTrigger className={cn(stateStyles[state])}>
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {type === "date" && (
        <Input
          type="date"
          value={value ?? ""}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange(e.target.value)}
          disabled={disabled}
          className={cn(stateStyles[state])}
        />
      )}
    </div>
  );
}
