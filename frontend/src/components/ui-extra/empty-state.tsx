import { FileText, MessageSquare, AlertTriangle } from "lucide-react";

interface EmptyStateProps {
  type: "no-complaints" | "no-messages" | "no-results" | "error";
  title?: string;
  description?: string;
  action?: React.ReactNode;
}

const icons = {
  "no-complaints": FileText,
  "no-messages": MessageSquare,
  "no-results": AlertTriangle,
  error: AlertTriangle,
};

const defaults = {
  "no-complaints": {
    title: "No complaints yet",
    description: "Upload a document or paste complaint text to get started.",
  },
  "no-messages": {
    title: "No messages yet",
    description: "Ask a question about the complaint or request analysis.",
  },
  "no-results": {
    title: "No results found",
    description: "Try adjusting your search criteria.",
  },
  error: {
    title: "Something went wrong",
    description: "An error occurred while loading data. Please try again.",
  },
};

export function EmptyState({ type, title, description, action }: EmptyStateProps) {
  const Icon = icons[type];
  const fallback = defaults[type];

  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
      <div className="rounded-full bg-gray-100 p-4 mb-4">
        <Icon className="h-8 w-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-1">{title ?? fallback.title}</h3>
      <p className="text-sm text-gray-500 max-w-sm mb-4">{description ?? fallback.description}</p>
      {action}
    </div>
  );
}
