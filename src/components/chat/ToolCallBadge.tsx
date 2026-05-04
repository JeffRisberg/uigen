import { ToolInvocation } from "ai";
import { Loader2 } from "lucide-react";

interface ToolCallBadgeProps {
  toolInvocation: ToolInvocation;
}

function getLabel(toolInvocation: ToolInvocation): string {
  const { toolName, args } = toolInvocation;

  if (toolName === "str_replace_editor") {
    const path = args?.path ?? "";
    switch (args?.command) {
      case "create":
        return `Creating ${path}`;
      case "str_replace":
      case "insert":
      case "undo_edit":
        return `Editing ${path}`;
      case "view":
        return `Reading ${path}`;
    }
  }

  if (toolName === "file_manager") {
    const path = args?.path ?? "";
    switch (args?.command) {
      case "delete":
        return `Deleting ${path}`;
      case "rename":
        return `Renaming ${path}`;
    }
  }

  return toolName;
}

export function ToolCallBadge({ toolInvocation }: ToolCallBadgeProps) {
  const label = getLabel(toolInvocation);
  const isDone = toolInvocation.state === "result";

  return (
    <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 bg-neutral-50 rounded-lg text-xs font-mono border border-neutral-200">
      {isDone ? (
        <div className="w-2 h-2 rounded-full bg-emerald-500" />
      ) : (
        <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
      )}
      <span className="text-neutral-700">{label}</span>
    </div>
  );
}
