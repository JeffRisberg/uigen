# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run setup        # First-time setup: install deps, generate Prisma client, run migrations
npm run dev          # Start dev server with Turbopack at localhost:3000
npm run build        # Production build
npm run lint         # ESLint
npm test             # Run Vitest tests (all)
npx vitest run src/path/to/file.test.ts  # Run a single test file
npm run db:reset     # Reset SQLite database (destructive)
```

## Architecture Overview

UIGen is an AI-powered React component generator. Users describe components in a chat; Claude generates JSX files into a virtual file system; a live preview renders those files in an iframe.

### Core Data Flow

1. **Chat → API** (`/api/chat`): User messages + serialized virtual FS are POSTed to the chat route. The route reconstructs a `VirtualFileSystem` instance, calls Claude with two tools (`str_replace_editor`, `file_manager`), and streams the response back.

2. **Tool calls → Client FS**: The Vercel AI SDK streams tool calls to the client. `ChatContext` intercepts them via `onToolCall` and delegates to `FileSystemContext.handleToolCall`, which mutates the in-memory `VirtualFileSystem` and triggers a React re-render.

3. **FS → Preview**: `PreviewFrame` watches `refreshTrigger` from `FileSystemContext`. On change, it calls `createImportMap()` from `jsx-transformer.ts`, which:
   - Transpiles every `.jsx/.tsx` file with Babel standalone
   - Creates blob URLs for each transpiled module
   - Builds a native ES module import map (with `@/` alias support)
   - Resolves third-party imports to `esm.sh`
   - Creates placeholder modules for missing local imports
   - Returns HTML injected into an `<iframe srcdoc>`

### Virtual File System (`src/lib/file-system.ts`)

`VirtualFileSystem` is an in-memory tree (not written to disk). It holds a `Map<string, FileNode>` where each node has `type`, `name`, `path`, and optionally `content` or `children`. Key methods: `serialize()` / `deserializeFromNodes()` convert between the Map and plain objects for JSON transport. The AI always writes to `/App.jsx` as the entrypoint.

### State Management

Two React contexts wrap the entire workspace:
- **`FileSystemContext`** (`src/lib/contexts/file-system-context.tsx`): owns the `VirtualFileSystem` instance and exposes file CRUD + `handleToolCall`.
- **`ChatContext`** (`src/lib/contexts/chat-context.tsx`): wraps the Vercel AI SDK `useChat` hook, wires `onToolCall` to `FileSystemContext`, and serializes the FS into every request body.

### Auth

JWT-based sessions stored in an httpOnly cookie (`auth-token`). `src/lib/auth.ts` is server-only (uses `next/headers`). Middleware (`src/middleware.ts`) protects `/api/projects` and `/api/filesystem`. Users can chat anonymously; anonymous work is tracked in `src/lib/anon-work-tracker.ts` and can be claimed on sign-up.

### Persistence

Projects (registered users only) store `messages` (JSON array) and `data` (serialized VFS) as strings in a SQLite database via Prisma. The Prisma client is generated to `src/generated/prisma/`. Schema is in `prisma/schema.prisma`.

### AI Provider (`src/lib/provider.ts`)

`getLanguageModel()` returns the Anthropic model when `ANTHROPIC_API_KEY` is set, otherwise a mock provider (static code, max 4 steps vs 40 for real Claude).

### Tests

Tests use Vitest + jsdom + React Testing Library. Test files live in `__tests__/` subdirectories alongside the code they test. The `@/` path alias is resolved via `vite-tsconfig-paths` in `vitest.config.mts`.
