"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Upload, FileText, Send, Sparkles, AlertCircle } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  addMessage,
  dismissEmptyState,
  setAnalysis,
  setExtractionProgress,
  setExtracting,
  setError,
} from "@/store/slices/copilotSlice";
import { updateMultipleFields } from "@/store/slices/complaintSlice";
import { complaintApi } from "@/services/api";
import { AnalysisResults } from "@/components/copilot/AnalysisResults";
import { normalizeCopilotAnalysis } from "@/lib/analysis";
import { EmptyState } from "@/components/ui-extra/empty-state";
import { RiskCardSkeleton } from "@/components/ui-extra/skeleton";

interface AiAssistantPanelProps {
  complaintId?: string | null;
  onComplaintCreated?: (id: string) => void;
}

function parseRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value === "string") {
    try {
      const parsed: unknown = JSON.parse(value);
      return typeof parsed === "object" && parsed !== null ? (parsed as Record<string, unknown>) : null;
    } catch {
      return null;
    }
  }
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : null;
}

function fieldValue(extraction: Record<string, unknown>, ...fields: string[]): string {
  for (const field of fields) {
    if (typeof extraction[field] === "string") return extraction[field] as string;
  }
  return "";
}

function selectValue(value: string, values: Record<string, string>): string {
  const normalized = value.trim().toLowerCase().replace(/[\s-]+/g, "_");
  return values[normalized] ?? value;
}

function dateValue(value: string): string {
  const isoMatch = value.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  if (isoMatch) return `${isoMatch[1]}-${isoMatch[2].padStart(2, "0")}-${isoMatch[3].padStart(2, "0")}`;
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) return value;
  return new Intl.DateTimeFormat("en-CA", { timeZone: "UTC" }).format(new Date(parsed));
}

function validateUpload(file: File): string | null {
  const extension = file.name.toLowerCase().split(".").pop();
  const allowedExtensions = new Set(["pdf", "docx", "txt"]);
  const allowedMimeTypes = new Set([
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
  ]);

  if (!extension || (!allowedExtensions.has(extension) && !allowedMimeTypes.has(file.type))) {
    return "Unsupported file type. Upload a PDF, DOCX, or TXT complaint document.";
  }
  if (file.size > 10 * 1024 * 1024) {
    return "File size exceeds the 10 MB limit. Choose a smaller document and try again.";
  }
  return null;
}

export function AiAssistantPanel({ complaintId, onComplaintCreated }: AiAssistantPanelProps) {
  const dispatch = useAppDispatch();
  const { messages, analysis, extractionProgress, isExtracting, isTyping, error } = useAppSelector((state) => state.copilot);

  const [isDragging, setIsDragging] = useState(false);
  const [localFile, setLocalFile] = useState<File | null>(null);
  const [inputText, setInputText] = useState("");
  const activeComplaintId = useRef<string | null>(complaintId ?? null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    activeComplaintId.current = complaintId ?? null;
  }, [complaintId]);

  const updateFormFromResult = useCallback((result: { extraction?: unknown } | null | undefined) => {
    const extraction = parseRecord(result?.extraction);
    if (!extraction) return;

    const source = fieldValue(extraction, "complaint_source");
    const complaintType = fieldValue(extraction, "complaint_type", "complaint_category");
    const severity = fieldValue(extraction, "initial_severity");
    const priority = fieldValue(extraction, "priority");

    dispatch(updateMultipleFields({
      complaintSource: selectValue(source, {
        pharmacy: "Pharmacy", hospital: "Hospital", distributor: "Distributor", patient: "Patient",
        regulatory: "Regulatory", phone_call: "Phone Call", other: "Other",
      }),
      customerName: fieldValue(extraction, "customer_name"),
      productName: fieldValue(extraction, "product_name"),
      productStrengthGrade: fieldValue(extraction, "product_strength_grade", "product_strength", "product_grade"),
      batchLotNumber: fieldValue(extraction, "batch_lot_number", "batch_number"),
      manufacturingDate: dateValue(fieldValue(extraction, "manufacturing_date")),
      expiryDate: dateValue(fieldValue(extraction, "expiry_date")),
      quantityAffected: fieldValue(extraction, "quantity_affected", "affected_quantity"),
      complaintType: selectValue(complaintType, {
        product_defect: "Product Defect", product_quality: "Product Defect", packaging_issue: "Packaging Issue",
        documentation: "Documentation", efficacy: "Efficacy", adverse_event: "Adverse Event", supply: "Supply", other: "Other",
      }),
      complaintDate: dateValue(fieldValue(extraction, "complaint_date")),
      detailedDescription: fieldValue(extraction, "detailed_description", "complaint_description"),
      initialSeverity: selectValue(severity, {
        critical: "critical", high: "high", major: "major", medium: "medium", minor: "minor", low: "low",
      }),
      priority: selectValue(priority, {
        urgent: "urgent", high: "high", medium: "medium", normal: "normal", low: "low",
      }),
    }));
  }, [dispatch]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const processFile = useCallback(async (file: File) => {
    setLocalFile(file);
    dispatch(setError(null));
    dispatch(setAnalysis(null));
    dispatch(setExtracting(true));
    dispatch(setExtractionProgress(10));

    try {
      // If no complaint yet, create one first
      let cid = activeComplaintId.current;
      if (!cid) {
        dispatch(setExtractionProgress(20));
        const createRes = await complaintApi.create({
          rawInput: `Processing uploaded document: ${file.name}`,
          inputType: "document",
        });
        if (!createRes.success || !createRes.data) {
          throw new Error(createRes.error ?? "Failed to create complaint");
        }
        cid = createRes.data.id;
        activeComplaintId.current = cid;
        onComplaintCreated?.(cid);
      }

      dispatch(setExtractionProgress(40));

      // Upload the file
      const uploadRes = await complaintApi.upload(cid, file);
      if (!uploadRes.success) {
        throw new Error(uploadRes.error ?? "Upload failed");
      }

      dispatch(setExtractionProgress(60));

      // Process through AI pipeline
      const processRes = await complaintApi.process(cid);
      if (!processRes.success || !processRes.data) {
        throw new Error(processRes.error ?? "Processing failed");
      }

      dispatch(setExtractionProgress(90));

      // Populate form with extracted data
      const data = processRes.data;
      updateFormFromResult(data);
      dispatch(setAnalysis(normalizeCopilotAnalysis(data)));

      dispatch(setExtractionProgress(100));
      dispatch(setError(null));
      dispatch(dismissEmptyState());
      dispatch(addMessage({
        role: "assistant",
        content: `**Complaint Processed**\n\nDocument **${file.name}** was extracted and the complaint form is populated. The initial AI classification and risk assessment are shown below. Please review the fields and recommendations before committing to QMS.`,
      }));
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      dispatch(setError(msg));
      dispatch(addMessage({
        role: "assistant",
        content: `Processing failed: ${msg}. Please try again.`,
      }));
    } finally {
      dispatch(setExtracting(false));
    }
  }, [dispatch, onComplaintCreated, updateFormFromResult]);

  const processText = useCallback(async (text: string) => {
    dispatch(setError(null));
    dispatch(setAnalysis(null));
    dispatch(setExtracting(true));
    dispatch(setExtractionProgress(10));

    try {
      let cid = activeComplaintId.current;

      if (!cid) {
        dispatch(setExtractionProgress(30));
        const createRes = await complaintApi.create({
          rawInput: text,
          inputType: "text",
        });
        if (!createRes.success || !createRes.data) {
          throw new Error(createRes.error ?? "Failed to create complaint");
        }
        cid = createRes.data.id;
        activeComplaintId.current = cid;
        onComplaintCreated?.(cid);
      }

      dispatch(setExtractionProgress(50));

      // Process through AI pipeline
      const processRes = await complaintApi.process(cid);
      if (!processRes.success || !processRes.data) {
        throw new Error(processRes.error ?? "Processing failed");
      }

      dispatch(setExtractionProgress(90));

      // Populate form with extracted data
      const data = processRes.data;
      updateFormFromResult(data);
      dispatch(setAnalysis(normalizeCopilotAnalysis(data)));

      dispatch(setExtractionProgress(100));
      dispatch(setError(null));
      dispatch(dismissEmptyState());
      dispatch(addMessage({
        role: "assistant",
        content: "**Complaint Processed**\n\nI extracted the complaint details and populated the form. The initial AI classification and risk assessment are shown below. Please review the fields and recommendations before committing to QMS.",
      }));
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      dispatch(setError(msg));
      dispatch(addMessage({
        role: "assistant",
        content: `Processing failed: ${msg}. Please try again.`,
      }));
    } finally {
      dispatch(setExtracting(false));
    }
  }, [dispatch, onComplaintCreated, updateFormFromResult]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const files = Array.from(e.dataTransfer.files);
      const file = files[0];

      if (file) {
        const validationError = validateUpload(file);
        if (validationError) {
          dispatch(setError(validationError));
          return;
        }

        processFile(file);
      }
    },
    [dispatch, processFile],
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        const validationError = validateUpload(file);
        if (validationError) {
          dispatch(setError(validationError));
        } else {
          processFile(file);
        }
      }
      e.target.value = "";
    },
    [dispatch, processFile],
  );

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const message = inputText.trim();
    setInputText("");

    dispatch(addMessage({ role: "user", content: message }));

    if (!activeComplaintId.current) {
      // No complaint yet — create one from the text
      await processText(message);
      return;
    }

    // Send correction/chat message to backend
    try {
      const res = await complaintApi.sendMessage(activeComplaintId.current, message);
      if (res.success && res.data) {
        dispatch(addMessage({ role: "assistant", content: res.data.content }));
      } else {
        // Fallback: try as correction
        const corrRes = await complaintApi.correct(activeComplaintId.current, message);
        if (corrRes.success && corrRes.data) {
          // Update form with corrected data
           const corrData = corrRes.data;
           updateFormFromResult(corrData);
           dispatch(setAnalysis(normalizeCopilotAnalysis(corrData)));
           dispatch(addMessage({
             role: "assistant",
             content: "Correction applied. I refreshed the dependent classification, risk assessment, and completeness check below. Please review the changes.",
           }));
        } else {
          dispatch(addMessage({
            role: "assistant",
            content: "I couldn't process your message. Please try again.",
          }));
        }
      }
    } catch {
      dispatch(addMessage({
        role: "assistant",
        content: "Sorry, I couldn't process your message. Please try again.",
      }));
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col rounded-lg border border-gray-200 bg-white shadow-sm">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-600" />
            <h2 className="font-semibold text-gray-900">AI Complaint Intake Assistant</h2>
          </div>
          <Badge variant="secondary" className="bg-blue-100 text-blue-700">
            BETA
          </Badge>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden flex flex-col min-h-0">
        {/* Upload Area */}
        <div className="p-4 shrink-0">
          <div
            role="group"
            aria-label="Complaint document upload"
            className={`relative rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
              isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400"
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <Upload className="mx-auto mb-3 h-10 w-10 text-gray-400" aria-hidden="true" />
            <p className="text-sm text-gray-600">Drag & drop complaint document here</p>
            <p className="text-sm text-gray-500 mt-1">
              or{" "}
              <button
                type="button"
                className="cursor-pointer rounded text-blue-600 underline hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                onClick={() => fileInputRef.current?.click()}
              >
                click to browse
              </button>
            </p>
            <input
              ref={fileInputRef}
              id="complaint-file"
              type="file"
              className="sr-only"
              aria-label="Upload complaint document"
              accept=".pdf,.docx,.txt"
              onChange={handleFileInput}
            />
          </div>

          <div className="mt-3 text-center">
            <span className="text-xs text-gray-500">OR</span>
          </div>

          <Button
            variant="outline"
            className="w-full mt-3"
            onClick={() => {
              const text = prompt("Paste complaint text or email content:");
              if (text?.trim()) {
                processText(text.trim());
              }
            }}
          >
            <FileText className="w-4 h-4 mr-2" />
            Paste Complaint Text / Email
          </Button>

          <p className="text-xs text-gray-500 mt-3 text-center">
            Supported formats: PDF, DOCX, TXT
            <br />
            Max file size: 10 MB
          </p>
        </div>

        {error && (
          <div className="px-4 pb-4" role="alert" aria-live="assertive">
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              <p className="font-medium">Unable to process this complaint</p>
              <p className="mt-1 break-words">{error}</p>
              {localFile && !isExtracting && (
                <Button type="button" variant="outline" size="sm" className="mt-3 border-red-300 bg-white text-red-800 hover:bg-red-100" onClick={() => processFile(localFile)}>
                  Retry processing
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Extraction Progress */}
        {isExtracting && (
          <div className="px-4 pb-4 shrink-0">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">EXTRACTION PROGRESS</span>
                <span className="text-sm text-gray-500">{extractionProgress}%</span>
              </div>
              <Progress value={extractionProgress} className="h-2" />
              <p className="text-xs text-gray-500 mt-2">
                Analyzing document content and extracting key details…
                <br />
                Please wait, this may take a few moments…
              </p>
            </div>
            <div className="mt-3" aria-label="AI analysis loading" aria-busy="true">
              <RiskCardSkeleton />
            </div>
          </div>
        )}

        {/* Uploaded File Display */}
        {localFile && !isExtracting && (
          <div className="px-4 pb-4 shrink-0">
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-green-600" />
                <span className="text-sm text-green-700 font-medium">{localFile.name}</span>
              </div>
              <p className="mt-1 text-xs text-green-600" role="status" aria-live="polite">Document processed successfully</p>
            </div>
          </div>
        )}

        {analysis && <AnalysisResults analysis={analysis} />}

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto px-4 space-y-4 min-h-0">
          {messages.length === 0 && !analysis && !isExtracting ? (
            <EmptyState type="no-messages" title="Ready for complaint analysis" description="Upload a document or paste complaint text to begin." />
          ) : messages.map((message) => (
            <div
              key={message.id}
              className={`flex min-w-0 ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-lg p-3 ${
                  message.role === "user" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-900"
                }`}
              >
                {message.role === "assistant" && (
                  <div className="flex items-center gap-1 mb-1">
                    <Sparkles className="w-3 h-3 text-blue-600" />
                    <span className="text-xs font-medium text-blue-600">AI Assistant</span>
                  </div>
                )}
                {message.role === "assistant" ? (
                  <div className="prose prose-sm max-w-none break-words prose-headings:mb-1 prose-headings:mt-3 prose-p:my-1 prose-ul:my-1 prose-li:my-0 prose-strong:font-semibold prose-strong:text-gray-900">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {message.content}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                )}
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex justify-start" role="status" aria-live="polite">
              <div className="rounded-lg bg-gray-100 p-3 text-sm text-gray-500">AI is thinking…</div>
            </div>
          )}
        </div>

        {/* Chat Input */}
        <div className="p-4 border-t border-gray-200 shrink-0">
          <div className="flex gap-2">
            <label htmlFor="copilot-message" className="sr-only">Message the AI copilot</label>
            <Textarea
              id="copilot-message"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ask about this complaint…"
              aria-label="Message the AI copilot"
              rows={2}
              className="resize-none"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
            />
            <Button
              type="button"
              size="icon"
              aria-label="Send message"
              onClick={handleSendMessage}
              disabled={!inputText.trim()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            AI responses may contain errors. Please verify information before committing.
          </p>
        </div>
      </div>
    </div>
  );
}
