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
- **Architecture**: ElysiaJS → Hono migration in progress
- **Security Patterns**: Maintained from original
- **API Patterns**: Compatible with original
- **Implementation**: Migration underway 