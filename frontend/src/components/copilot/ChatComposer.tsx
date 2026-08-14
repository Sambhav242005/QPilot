"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send } from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────
interface ChatComposerProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

// ─── Component ───────────────────────────────────────────────────────
export function ChatComposer({
  onSend,
  disabled = false,
  placeholder = "Ask me anything about this complaint...",
}: ChatComposerProps) {
  const [message, setMessage] = useState("");

  const handleSend = () => {
    if (!message.trim() || disabled) return;
    onSend(message.trim());
    setMessage("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex gap-2">
      <Textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={2}
        className="resize-none"
        disabled={disabled}
      />
      <Button
        size="icon"
        onClick={handleSend}
        disabled={!message.trim() || disabled}
        className="bg-blue-600 hover:bg-blue-700"
      >
        <Send className="w-4 h-4" />
      </Button>
    </div>
  );
}
