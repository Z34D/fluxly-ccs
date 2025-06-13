# Git Proxy Server - Technical Context

## Platform Information
- **Operating System**: Windows (win32)
- **Runtime**: Bun
- **Framework**: Elysia
- **Language**: TypeScript

## Core Dependencies

### Current Dependencies (from package.json)
- **elysia**: Web framework with type safety (latest)
- **@elysiajs/cors**: CORS middleware for Elysia (v1.3.3) ✅
- **simple-git**: Git operations library (v3.28.0) ✅
- **bun-types**: TypeScript types for Bun (latest)

### Dependencies Analysis
All required dependencies are already installed! This accelerates our development process.

### Future Dependencies
- **@elysiajs/swagger**: API documentation generation
- **@elysiajs/bearer**: Authentication middleware (if needed)

## Technology Stack

### Runtime & Framework
- **Bun**: High-performance JavaScript runtime with built-in git support
- **Elysia**: Type-safe web framework with excellent TypeScript integration
- **TypeScript**: Type safety and development experience

### Git Integration
- **Native Git Commands**: Execute git operations through Bun's process spawning
- **Path Validation**: Secure file system operations
- **Command Sanitization**: Prevent command injection attacks

### CORS & Web Integration
- **@elysiajs/cors**: Handles cross-origin requests for web clients
- **Octokit Compatibility**: Designed to work with Octokit REST clients

## Development Tools
- **TypeScript**: Type checking and IntelliSense
- **Bun**: Package management and runtime
- **Git**: Version control

## Security Considerations
- **Command Validation**: Allowlist approach for git commands
- **Path Sanitization**: Prevent directory traversal attacks
- **Input Validation**: Comprehensive request validation using Elysia's type system
- **Error Handling**: Secure error responses without information leakage

## Performance Characteristics
- **Bun Runtime**: Fast startup and execution times
- **Native Git**: Direct git command execution without additional layers
- **Type Safety**: Compile-time optimization through TypeScript

## Platform Adaptations for Windows
- **Path Separators**: Use platform-appropriate path handling
- **Command Execution**: Windows-compatible process spawning
- **File System**: Windows file system considerations

## Current Setup Status
- **Base Project**: Elysia server running on port 3000
- **CORS**: Not yet configured
- **Git Integration**: Not yet implemented
- **Type Definitions**: Basic setup complete

## Development Environment
- **OS**: Windows 10.0.22631
- **Runtime**: Bun v1.2.15
- **Shell**: PowerShell
- **Package Manager**: Bun

## Core Technologies
- **Framework**: Elysia.js (TypeScript-first web framework)
- **Runtime**: Bun (JavaScript runtime optimized for speed)
- **Language**: TypeScript (with strict type checking)
- **Testing**: Bun test framework

## Plugin Development Guidelines

### Elysia Plugin Patterns
Based on [Elysia documentation](https://elysiajs.com/llms-full.txt):

1. **Plugin Structure**:
   ```typescript
   export const pluginName = (options?: Options) => 
     new Elysia({ name: 'plugin-name' })
       .derive(() => ({ /* context */ }))
       .guard(() => ({ /* validation */ }))
   ```

2. **Naming Convention**:
   - Plugin files: `kebab-case.ts`
   - Plugin functions: `camelCase`
   - Plugin names: `kebab-case` in constructor

3. **Type Safety**:
   - Full TypeScript integration
   - Automatic type inference
   - Schema validation with `t.Object()`

### JSDoc Standards
Comprehensive documentation for all plugin functions:

```typescript
/**
 * Brief description of the function
 * @param param1 - Description of parameter
 * @param param2 - Description of parameter
 * @returns Description of return value
 * @example
 * ```typescript
 * const result = functionName(param1, param2)
 * ```
 */
```

## Project Structure
```
src/
├── app.ts              # Main application entry
├── plugins/            # Modular plugin directory
│   ├── cors-origin.ts  # Origin validation plugin
│   ├── cors-headers.ts # CORS headers plugin
│   └── git-detection.ts # Git request detection plugin
├── types/              # TypeScript definitions
└── index.ts            # Server startup
```

## Dependencies
- `elysia`: Web framework
- `@types/bun`: TypeScript definitions
- Development tools for testing and validation

## Testing Infrastructure
- **Framework**: Bun test
- **Coverage**: Comprehensive test suite with 32 tests
- **Authentication**: GitHub token integration
- **CORS Testing**: Multiple origin validation
- **Git Protocol**: Real repository testing 