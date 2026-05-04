"use client";

import {
  createContext,
  useContext,
  ReactNode,
  useEffect,
  useRef,
} from "react";
import { useChat as useAIChat } from "@ai-sdk/react";
import { Message } from "ai";
import { useFileSystem } from "./file-system-context";
import { setHasAnonWork } from "@/lib/anon-work-tracker";

interface ChatContextProps {
  projectId?: string;
  initialMessages?: Message[];
}

interface ChatContextType {
  messages: Message[];
  input: string;
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  status: string;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({
  children,
  projectId,
  initialMessages = [],
}: ChatContextProps & { children: ReactNode }) {
  const { fileSystem, handleToolCall } = useFileSystem();

  // Track which tool calls have already been applied to the client VFS.
  // Seed with IDs from initialMessages so historical calls are not replayed
  // on top of the VFS that was already restored from saved project data.
  const processedToolCallIds = useRef<Set<string>>(new Set(
    initialMessages.flatMap(msg =>
      (msg.parts ?? [])
        .filter((p): p is Extract<typeof p, { type: "tool-invocation" }> => p.type === "tool-invocation")
        .map(p => p.toolInvocation.toolCallId)
    )
  ));

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    status,
  } = useAIChat({
    api: "/api/chat",
    initialMessages,
    body: {
      files: fileSystem.serialize(),
      projectId,
    },
  });

  // onToolCall in useChat only fires for client-side tools. Since our tools
  // have server-side execute functions, we watch messages instead and apply
  // completed tool invocations to the client VFS as they arrive.
  useEffect(() => {
    for (const message of messages) {
      if (message.role !== "assistant" || !message.parts) continue;
      for (const part of message.parts) {
        if (part.type !== "tool-invocation") continue;
        const { toolInvocation } = part;
        if (toolInvocation.state !== "result") continue;
        if (processedToolCallIds.current.has(toolInvocation.toolCallId)) continue;

        processedToolCallIds.current.add(toolInvocation.toolCallId);
        handleToolCall({ toolName: toolInvocation.toolName, args: toolInvocation.args });
      }
    }
  }, [messages, handleToolCall]);

  // Track anonymous work
  useEffect(() => {
    if (!projectId && messages.length > 0) {
      setHasAnonWork(messages, fileSystem.serialize());
    }
  }, [messages, fileSystem, projectId]);

  return (
    <ChatContext.Provider
      value={{
        messages,
        input,
        handleInputChange,
        handleSubmit,
        status,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
}