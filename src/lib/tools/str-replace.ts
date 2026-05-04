import { z } from "zod";
import { tool } from "ai";
import { VirtualFileSystem } from "@/lib/file-system";

const TextEditorParameters = z.object({
  command: z.enum(["view", "create", "str_replace", "insert", "undo_edit"]),
  path: z.string().describe("Absolute path to the file, e.g. /App.jsx or /components/Button.jsx"),
  file_text: z.string().optional().describe("Content of the file to create (required for 'create' command)"),
  insert_line: z.number().optional().describe("Line number after which to insert text (required for 'insert' command)"),
  new_str: z.string().optional().describe("New string to insert or replace with"),
  old_str: z.string().optional().describe("Existing string to replace (required for 'str_replace' command)"),
  view_range: z.array(z.number()).optional().describe("Optional [start, end] line range for 'view' command"),
});

export const buildStrReplaceTool = (fileSystem: VirtualFileSystem) => {
  return tool({
    description:
      "A text editor tool for creating and editing files in the virtual file system. " +
      "Use 'create' to create a new file with content, 'str_replace' to replace text in an existing file, " +
      "'insert' to insert text at a specific line, and 'view' to read a file or directory.",
    parameters: TextEditorParameters,
    execute: async ({
      command,
      path,
      file_text,
      insert_line,
      new_str,
      old_str,
      view_range,
    }) => {
      switch (command) {
        case "view":
          return fileSystem.viewFile(
            path,
            view_range as [number, number] | undefined
          );

        case "create":
          return fileSystem.createFileWithParents(path, file_text || "");

        case "str_replace":
          return fileSystem.replaceInFile(path, old_str || "", new_str || "");

        case "insert":
          return fileSystem.insertInFile(path, insert_line || 0, new_str || "");

        case "undo_edit":
          return `Error: undo_edit command is not supported in this version. Use str_replace to revert changes.`;
      }
    },
  });
};
