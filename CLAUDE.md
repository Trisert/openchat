# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Backend (Bun + Elysia)
- `bun dev` - Start development server with hot reload (main server on port 3000, WebSocket on port 3002)
- `bun build` - Build for production
- `bun start` - Start production server
- `bun typecheck` - Run TypeScript type checking
- `bun install` - Install dependencies

### Frontend (Next.js)
- `cd frontend && bun dev` - Start Next.js development server
- `cd frontend && bun build` - Build Next.js for production
- `cd frontend && bun start` - Start Next.js production server
- `cd frontend && bun lint` - Run ESLint

## Architecture Overview

This is a **dual-stack application** with separate backend and frontend:

### Backend (Bun + Elysia)
- **Main server**: `src/server.ts` - Serves the frontend and handles HTTP routes
- **WebSocket server**: Built into `src/server.ts` on port 3002 for real-time chat
- **LLaMA.cpp Service**: `src/services/llama-service.ts` - Handles communication with LLaMA.cpp servers
- **Chat Template Manager**: `src/services/chat-template-manager.ts` - Manages different chat prompt formats
- **Types**: `src/types/chat.ts` - Shared TypeScript interfaces

### Frontend (Next.js + React)
- **Framework**: Next.js 16 with App Router
- **Styling**: TailwindCSS with custom components
- **State Management**: Zustand store (`frontend/src/stores/chat-store.ts`)
- **WebSocket Integration**: Custom hook (`frontend/src/hooks/use-websocket.ts`)
- **UI Components**: Custom chat components in `frontend/src/components/chat/`

## Key Architecture Patterns

### Dual-Server Architecture
The application runs **two servers simultaneously**:
1. **HTTP Server** (port 3000): Serves the Next.js frontend and static assets
2. **WebSocket Server** (port 3002): Handles real-time chat communication with LLaMA.cpp

### WebSocket Communication Flow
- Frontend connects to WebSocket server via `window.websocketAPI`
- Messages are routed through `handleWebSocketMessage()` in `src/server.ts`
- LLaMA.cpp requests are handled by `LlamaService` class
- Streaming responses are parsed and sent back to frontend chunk by chunk

### Frontend Structure
- `frontend/src/app/` - Next.js App Router pages
- `frontend/src/components/` - Reusable React components
- `frontend/src/hooks/` - Custom React hooks
- `frontend/src/stores/` - Zustand state management
- `frontend/src/lib/` - Utility functions

### LLaMA.cpp Integration
The application expects a LLaMA.cpp server with these endpoints:
- `GET /health` - Health check
- `GET /v1/models` - List available models
- `POST /completion` - Generate completions with streaming support

## Development Notes

### Environment Setup
- Requires **Bun** runtime for backend
- Frontend uses **Next.js** with TypeScript
- No test framework currently configured
- No linting configured for backend

### WebSocket Integration
The frontend expects a global `window.websocketAPI` object to be provided by the WebSocket provider component. This handles:
- Connection management to LLaMA.cpp servers
- Message streaming
- Event handling

### Chat Template System
The `ChatTemplateManager` supports different LLaMA.cpp chat template formats and handles prompt formatting automatically based on model detection.

### File Structure for Development
When working on this codebase:
- Backend changes go in `/src/`
- Frontend changes go in `/frontend/src/`
- The main entry point is `src/server.ts`
- Frontend entry is `frontend/src/app/page.tsx`