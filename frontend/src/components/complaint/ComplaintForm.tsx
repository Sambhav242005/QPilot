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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Bot } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { resetForm, updateFormField } from "@/store/slices/complaintSlice";
import type { ComplaintFormData } from "@/store/slices/complaintSlice";

export function ComplaintForm() {
  const dispatch = useAppDispatch();
  const { formData } = useAppSelector((state) => state.complaint);

  const hasData = Object.values(formData).some((value) => value !== "");
  const updateField = (field: keyof ComplaintFormData, value: string) => {
    dispatch(updateFormField({ field, value }));
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-200 p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 text-balance">Log Customer Complaint</h1>
            <p className="mt-1 text-sm text-gray-500">API &amp; FDF Quality Assurance Module</p>
          </div>
          <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">
            Pending Triage
          </Badge>
        </div>
        <div className="mt-3 flex items-start gap-2 text-xs text-gray-500">
          <Bot className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>AI populates the form after intake. Review and correct any field before committing it to QMS.</span>
        </div>
      </div>

      <div className="space-y-8 p-6">
        <section aria-labelledby="origin-heading">
          <h2 id="origin-heading" className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
            1. Origin &amp; Customer Details
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="complaint-source" className="text-sm font-medium text-gray-700">Complaint Source</label>
              <Select value={formData.complaintSource} onValueChange={(value) => updateField("complaintSource", value ?? "")}>
                <SelectTrigger id="complaint-source" aria-label="Complaint Source">
                  <SelectValue placeholder="Awaiting AI extraction…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pharmacy">Pharmacy</SelectItem>
                  <SelectItem value="Hospital">Hospital</SelectItem>
                  <SelectItem value="Distributor">Distributor</SelectItem>
                  <SelectItem value="Patient">Patient</SelectItem>
                  <SelectItem value="Regulatory">Regulatory</SelectItem>
                  <SelectItem value="Phone Call">Phone Call</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label htmlFor="customer-name" className="text-sm font-medium text-gray-700">Customer Name</label>
              <Input id="customer-name" name="customerName" autoComplete="organization" value={formData.customerName} onChange={(e) => updateField("customerName", e.target.value)} placeholder="Awaiting AI extraction…" />
            </div>
          </div>
        </section>

        <Separator />

        <section aria-labelledby="product-heading">
          <h2 id="product-heading" className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
            2. Product &amp; Batch Identification
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="product-name" className="text-sm font-medium text-gray-700">Product Name</label>
              <Input id="product-name" name="productName" value={formData.productName} onChange={(e) => updateField("productName", e.target.value)} placeholder="Awaiting AI extraction…" />
            </div>
            <div className="space-y-2">
              <label htmlFor="product-strength" className="text-sm font-medium text-gray-700">Product Strength/Grade</label>
              <Input id="product-strength" name="productStrengthGrade" value={formData.productStrengthGrade} onChange={(e) => updateField("productStrengthGrade", e.target.value)} placeholder="Awaiting AI extraction…" />
            </div>
            <div className="space-y-2">
              <label htmlFor="batch-lot-number" className="text-sm font-medium text-gray-700">Batch/Lot Number</label>
              <Input id="batch-lot-number" name="batchLotNumber" spellCheck={false} value={formData.batchLotNumber} onChange={(e) => updateField("batchLotNumber", e.target.value)} placeholder="Awaiting AI extraction…" />
            </div>
            <div className="space-y-2">
              <label htmlFor="manufacturing-date" className="text-sm font-medium text-gray-700">Manufacturing Date</label>
              <Input id="manufacturing-date" name="manufacturingDate" type="date" value={formData.manufacturingDate} onChange={(e) => updateField("manufacturingDate", e.target.value)} />
            </div>
            <div className="space-y-2">
              <label htmlFor="expiry-date" className="text-sm font-medium text-gray-700">Expiry Date</label>
              <Input id="expiry-date" name="expiryDate" type="date" value={formData.expiryDate} onChange={(e) => updateField("expiryDate", e.target.value)} />
            </div>
            <div className="space-y-2">
              <label htmlFor="quantity-affected" className="text-sm font-medium text-gray-700">Quantity Affected</label>
              <Input id="quantity-affected" name="quantityAffected" inputMode="numeric" value={formData.quantityAffected} onChange={(e) => updateField("quantityAffected", e.target.value)} placeholder="Awaiting AI extraction…" />
            </div>
          </div>
        </section>

        <Separator />

        <section aria-labelledby="details-heading">
          <h2 id="details-heading" className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
            3. Complaint Details
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="complaint-type" className="text-sm font-medium text-gray-700">Complaint Type</label>
              <Select value={formData.complaintType} onValueChange={(value) => updateField("complaintType", value ?? "")}>
                <SelectTrigger id="complaint-type" aria-label="Complaint Type"><SelectValue placeholder="Awaiting AI extraction…" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Product Defect">Product Defect</SelectItem>
                  <SelectItem value="Packaging Issue">Packaging Issue</SelectItem>
                  <SelectItem value="Documentation">Documentation</SelectItem>
                  <SelectItem value="Efficacy">Efficacy</SelectItem>
                  <SelectItem value="Adverse Event">Adverse Event</SelectItem>
                  <SelectItem value="Supply">Supply</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label htmlFor="complaint-date" className="text-sm font-medium text-gray-700">Complaint Date</label>
              <Input id="complaint-date" name="complaintDate" type="date" value={formData.complaintDate} onChange={(e) => updateField("complaintDate", e.target.value)} />
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <label htmlFor="detailed-description" className="text-sm font-medium text-gray-700">Detailed Complaint Description</label>
            <Textarea id="detailed-description" name="detailedDescription" value={formData.detailedDescription} onChange={(e) => updateField("detailedDescription", e.target.value)} placeholder="Awaiting AI extraction…" rows={4} className="resize-y" />
          </div>
        </section>

        <Separator />

        <section aria-labelledby="assessment-heading">
          <h2 id="assessment-heading" className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
            4. Initial Assessment &amp; Priority
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="initial-severity" className="text-sm font-medium text-gray-700">Initial Severity</label>
              <Select value={formData.initialSeverity} onValueChange={(value) => updateField("initialSeverity", value ?? "")}>
                <SelectTrigger id="initial-severity" aria-label="Initial Severity"><SelectValue placeholder="Awaiting AI extraction…" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="major">Major</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="minor">Minor</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label htmlFor="priority" className="text-sm font-medium text-gray-700">Priority</label>
              <Select value={formData.priority} onValueChange={(value) => updateField("priority", value ?? "")}>
                <SelectTrigger id="priority" aria-label="Priority"><SelectValue placeholder="Awaiting AI extraction…" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </section>
      </div>

      <div className="flex flex-col gap-3 rounded-b-lg border-t border-gray-200 bg-gray-50 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-2 text-xs text-gray-500">
          <Bot className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>{hasData ? "Review the AI-populated values or correct them directly before QMS commit." : "Upload a document or paste complaint text to begin."}</span>
        </div>
        <Button type="button" variant="outline" onClick={() => dispatch(resetForm())} disabled={!hasData}>
          Reset Form
        </Button>
      </div>
    </div>
  );
}
