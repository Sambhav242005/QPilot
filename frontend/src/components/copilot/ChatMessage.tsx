"use client";

import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────
export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

interface ChatMessageProps {
  message: Message;
}

// ─── Component ───────────────────────────────────────────────────────
export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[85%] rounded-lg p-3",
          isUser ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-900",
        )}
      >
        {!isUser && (
          <div className="flex items-center gap-1 mb-1">
            <Sparkles className="w-3 h-3 text-blue-600" />
            <span className="text-xs font-medium text-blue-600">AI Assistant</span>
          </div>
        )}
        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        <div className={cn("text-xs mt-1", isUser ? "text-blue-200" : "text-gray-500")}>
          {new Date(message.timestamp).toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
}
