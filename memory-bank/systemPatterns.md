# Git Proxy Server - System Patterns

## Architecture Overview

### Core Architecture Pattern
**Proxy Server Pattern**: The server acts as an intermediary between web clients and git repositories, providing secure command execution and proper CORS handling.

```
Web Client (Octokit) → CORS → Hono Proxy → Git Commands → Repository
```

## Framework Migration

### ElysiaJS to Hono Migration Pattern
**Migration Strategy**: Complete framework port while maintaining API compatibility and functionality.

### Old Architecture (ElysiaJS)
```
ElysiaJS App → Plugins (corsOrigin, corsHeaders, gitDetection, health) → Handlers
```

### New Architecture (Hono)
```
Hono App → Middleware (CORS, Logging) → Route Handlers → Helper Functions
```

## Key Design Patterns

### 1. Middleware Pattern (Hono)
Hono uses middleware functions that can be applied globally or to specific routes:
- CORS middleware for cross-origin requests
- Logging middleware for request tracking
- Authentication middleware (future)
- Error handling middleware

### 2. Context Pattern (Hono)
Hono uses context (`c`) object for request handling:
- `c.req` for request access
- `c.res` for response manipulation
- `c.set()` for response headers
- `c.json()`, `c.text()` for response types

### 3. Plugin to Middleware Conversion Pattern
ElysiaJS plugins → Hono middleware/helper functions:
- `corsOrigin` plugin → CORS middleware with origin validation
- `corsHeaders` plugin → Response header middleware
- `gitDetection` plugin → Helper function for Git request detection
- `health` plugin → Health endpoint route handler

## Security Patterns

### 1. Origin Validation Pattern
CORS origin validation for security:
- Allowed origins from environment variables
- Dynamic localhost detection for development
- Strict validation for production

### 2. Authorization Header Forwarding Pattern
Secure authentication token forwarding:
- Authorization header detection (case-insensitive)
- Token forwarding to Git repositories
- GitHub token authentication support

### 3. Path Sanitization Pattern
All file paths and repository URLs are validated and sanitized.

## API Design Patterns

### 1. Universal Route Handler Pattern
Single route handler for multiple HTTP methods:
```typescript
app.all("/*", async (c) => {
  // Handle GET, POST, OPTIONS, etc.
})
```

### 2. Proxy URL Pattern
URL format: `/domain.com/path/to/repo`
- Domain extraction and protocol selection
- Path parsing and reconstruction
- Query parameter preservation

### 3. Git Operation Detection Pattern
Multiple detection methods:
- Service parameter (`service=git-upload-pack`)
- Path patterns (`/info/refs`, `/git-upload-pack`)
- User-Agent header detection

## Technology Patterns

### 1. Hono Framework Pattern
- Lightweight and fast web framework
- Web Standards API compatibility
- Cloudflare Workers optimized
- TypeScript support

### 2. Environment Configuration Pattern
```typescript
const env = {
  ALLOWED_ORIGINS: c.env.ALLOWED_ORIGINS || 'https://fluxly.app',
  CORS_ALLOW_LOCALHOST: c.env.CORS_ALLOW_LOCALHOST || 'true',
  CORS_ENABLE_LOGGING: c.env.CORS_ENABLE_LOGGING || 'false'
}
```

### 3. Response Header Management Pattern
```typescript
c.header('access-control-allow-origin', origin)
c.header('access-control-allow-methods', methods)
c.header('access-control-expose-headers', headers)
```

## Migration Implementation Patterns

### 1. Plugin to Function Conversion
ElysiaJS plugins become utility functions or middleware:
- Stateful plugin logic → Stateless functions
- Plugin decorators → Direct function calls
- Plugin options → Function parameters

### 2. Request/Response Handling Conversion
ElysiaJS patterns → Hono patterns:
- `{ request, set }` → `c.req`, `c.res`
- `set.status = 200` → `c.status(200)`
- `set.headers['key'] = value` → `c.header('key', value)`

### 3. Configuration Injection Pattern
Environment variables passed as context:
- Cloudflare Workers env binding
- Development environment fallbacks
- Runtime configuration access

## Scalability Patterns

### 1. Stateless Design Pattern
Each request is independent with no server-side session state.

### 2. Resource Isolation Pattern
Git operations are isolated per request to prevent conflicts.

### 3. Edge Computing Pattern
Optimized for Cloudflare Workers edge deployment.

## Current Implementation Status
- **Architecture**: ✅ Modular Hono implementation complete
- **Security Patterns**: ✅ Maintained and enhanced from original
- **API Patterns**: ✅ Compatible with original, no breaking changes
- **Implementation**: ✅ Fully refactored into 9 focused modules

## Modular Architecture (v2.0.0)

### Directory Structure
```
src/
├── types/
│   └── environment.ts          # TypeScript interfaces and type definitions
├── utils/
│   ├── cors-utils.ts          # CORS origin validation and header management
│   ├── git-detection.ts       # Git request detection logic
│   └── proxy-utils.ts         # Proxy URL parsing and header utilities
├── handlers/
│   ├── proxy-handler.ts       # Main Git proxy request handler
│   └── route-handlers.ts      # Health, root, and route handlers
├── config/
│   ├── server-config.ts       # Server configuration and display utilities
│   └── constants.ts           # Git services, headers, and constants
├── app.ts                     # Main Hono app setup and route registration
└── index.ts                   # Entry point (exports from app.ts)
```

### Module Design Principles
1. **Single Responsibility**: Each module has a focused purpose
2. **Separation of Concerns**: Types, utilities, handlers, and config are separated
3. **Dependency Injection**: Modules depend on interfaces, not implementations
4. **Comprehensive Documentation**: Full JSDoc coverage for all functions
5. **Kebab-Case Naming**: Consistent file naming convention

### JSDoc Documentation Standards
- **File-level documentation**: @fileoverview with module purpose
- **Function documentation**: Complete parameter and return types
- **Usage examples**: Practical examples for all public functions
- **Type annotations**: Comprehensive TypeScript integration
- **Version tracking**: @version and @author tags

### Testing Verification
- ✅ 28/32 tests passing (4 skipped due to missing GitHub token)
- ✅ TypeScript compilation clean
- ✅ No breaking changes to existing API
- ✅ All CORS, Git proxy, and authentication functionality maintained 