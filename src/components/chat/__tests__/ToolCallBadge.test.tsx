import { test, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { ToolCallBadge } from "../ToolCallBadge";
import type { ToolInvocation } from "ai";

afterEach(() => {
  cleanup();
});

// str_replace_editor — create
test("shows 'Creating' label for str_replace_editor create command", () => {
  const toolInvocation: ToolInvocation = {
    toolCallId: "1",
    toolName: "str_replace_editor",
    args: { command: "create", path: "/App.jsx" },
    state: "call",
  };
  render(<ToolCallBadge toolInvocation={toolInvocation} />);
  expect(screen.getByText("Creating /App.jsx")).toBeDefined();
});

// str_replace_editor — str_replace
test("shows 'Editing' label for str_replace_editor str_replace command", () => {
  const toolInvocation: ToolInvocation = {
    toolCallId: "2",
    toolName: "str_replace_editor",
    args: { command: "str_replace", path: "/components/Button.jsx" },
    state: "call",
  };
  render(<ToolCallBadge toolInvocation={toolInvocation} />);
  expect(screen.getByText("Editing /components/Button.jsx")).toBeDefined();
});

// str_replace_editor — insert
test("shows 'Editing' label for str_replace_editor insert command", () => {
  const toolInvocation: ToolInvocation = {
    toolCallId: "3",
    toolName: "str_replace_editor",
    args: { command: "insert", path: "/App.jsx" },
    state: "call",
  };
  render(<ToolCallBadge toolInvocation={toolInvocation} />);
  expect(screen.getByText("Editing /App.jsx")).toBeDefined();
});

// str_replace_editor — view
test("shows 'Reading' label for str_replace_editor view command", () => {
  const toolInvocation: ToolInvocation = {
    toolCallId: "4",
    toolName: "str_replace_editor",
    args: { command: "view", path: "/App.jsx" },
    state: "call",
  };
  render(<ToolCallBadge toolInvocation={toolInvocation} />);
  expect(screen.getByText("Reading /App.jsx")).toBeDefined();
});

// file_manager — delete
test("shows 'Deleting' label for file_manager delete command", () => {
  const toolInvocation: ToolInvocation = {
    toolCallId: "5",
    toolName: "file_manager",
    args: { command: "delete", path: "/old.jsx" },
    state: "call",
  };
  render(<ToolCallBadge toolInvocation={toolInvocation} />);
  expect(screen.getByText("Deleting /old.jsx")).toBeDefined();
});

// file_manager — rename
test("shows 'Renaming' label for file_manager rename command", () => {
  const toolInvocation: ToolInvocation = {
    toolCallId: "6",
    toolName: "file_manager",
    args: { command: "rename", path: "/old.jsx", new_path: "/new.jsx" },
    state: "call",
  };
  render(<ToolCallBadge toolInvocation={toolInvocation} />);
  expect(screen.getByText("Renaming /old.jsx")).toBeDefined();
});

// unknown tool fallback
test("falls back to tool name for unknown tools", () => {
  const toolInvocation: ToolInvocation = {
    toolCallId: "7",
    toolName: "some_unknown_tool",
    args: {},
    state: "call",
  };
  render(<ToolCallBadge toolInvocation={toolInvocation} />);
  expect(screen.getByText("some_unknown_tool")).toBeDefined();
});

// state: result — green dot, no spinner
test("renders green dot when state is result", () => {
  const toolInvocation: ToolInvocation = {
    toolCallId: "8",
    toolName: "str_replace_editor",
    args: { command: "create", path: "/App.jsx" },
    state: "result",
    result: "Created",
  };
  const { container } = render(<ToolCallBadge toolInvocation={toolInvocation} />);
  expect(container.querySelector(".bg-emerald-500")).toBeDefined();
  expect(container.querySelector(".animate-spin")).toBeNull();
});

// state: call — spinner, no green dot
test("renders spinner when state is call", () => {
  const toolInvocation: ToolInvocation = {
    toolCallId: "9",
    toolName: "str_replace_editor",
    args: { command: "create", path: "/App.jsx" },
    state: "call",
  };
  const { container } = render(<ToolCallBadge toolInvocation={toolInvocation} />);
  expect(container.querySelector(".animate-spin")).toBeDefined();
  expect(container.querySelector(".bg-emerald-500")).toBeNull();
});
