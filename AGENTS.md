# AGENTS.md

## Commands
- `bun dev` - Start development server with hot reload
- `bun build` - Build for production
- `bun start` - Start production server
- `bun typecheck` - Run TypeScript type checking
- No linter or tests configured currently

## Code Style Guidelines

### TypeScript & Imports
- Use ES6 modules with `import/export`
- Import external libraries first, then internal modules
- Use `interface` for type definitions, `type` for unions/generics
- Strict TypeScript enabled - always type function parameters and return values

### Formatting & Naming
- Use camelCase for variables and functions
- Use PascalCase for classes and interfaces
- Use kebab-case for file names (except TypeScript files use .ts extension)
- Keep lines under 100 characters where possible

### Error Handling
- Always wrap async operations in try-catch blocks
- Use descriptive error messages with context
- Log errors to console before sending user-friendly responses
- Use AbortSignal.timeout() for fetch requests with timeouts

### Architecture Patterns
- Use Elysia framework for HTTP routes and WebSocket handling
- Separate business logic into service classes
- Use WebSocket for real-time communication
- Store connection state in WebSocket data objects
- Handle different message types with switch statements