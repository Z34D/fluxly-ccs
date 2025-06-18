# Git Proxy Server - System Patterns

## Architecture Overview

**Framework**: Hono-based TypeScript application  
**Deployment**: Cloudflare Workers + Bun development server  
**Purpose**: CORS-enabled Git proxy for isomorphic-git browser usage  

## NEW ARCHITECTURE: cors-proxy-main Port (2025-01-14)

### Clean Architecture Plan
Starting fresh with minimal core files only:

```
src/
├── index.ts          # Main entry point (export only)
├── server.ts         # Local Bun server
├── app.ts           # Main Hono application with all logic
└── types/
    └── environment.ts # Environment types only
```

### Core Functionality (1:1 Port from cors-proxy-main)
1. **Git Request Detection** (from allow-request.js):
   - isPreflightInfoRefs, isInfoRefs
   - isPreflightPull, isPull  
   - isPreflightPush, isPush
   - Combined allow() function

2. **CORS Headers** (from middleware.js):
   - allowHeaders: authorization, content-type, user-agent, etc.
   - exposeHeaders: location, cache-control, etag, etc.
   - allowMethods: POST, GET, OPTIONS

3. **Proxy Logic** (from middleware.js):
   - URL parsing and reconstruction
   - Header forwarding and filtering
   - User-agent standardization
   - Location header modification
   - Response streaming

4. **Configuration**:
   - origin: CORS origin configuration
   - insecure_origins: HTTP vs HTTPS protocol selection

### Implementation Strategy
- **Remove All**: handlers/, utils/, config/ directories
- **Single File**: All logic in app.ts (like original index.js)
- **TypeScript**: Strong typing while maintaining exact behavior
- **Hono Framework**: Replace micro with Hono context handling

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

## System Architecture Patterns

### Modular File Structure (Current Architecture)

The system follows a clean modular architecture with separation of concerns:

```
src/
├── config/
│   └── constants.ts          # Configuration constants and CORS settings
├── utils/
│   ├── git-detection.ts      # Git protocol request validation
│   ├── cors-utils.ts         # CORS header management utilities
│   ├── request-processor.ts  # Incoming request processing
│   └── response-processor.ts # Upstream response processing
├── handlers/
│   └── route-handlers.ts     # HTTP route handler functions
├── types/
│   └── environment.ts        # Environment type definitions
├── app.ts                    # Main Hono application factory
├── server.ts                 # Local development server
├── environment.ts            # Environment configuration handling
└── index.ts                  # Cloudflare Workers entry point
```

### Core Architectural Principles

1. **Single Responsibility Principle**: Each file has one clear purpose
2. **Dependency Injection**: Utilities are imported where needed
3. **Clean Imports**: Explicit ES6 import/export structure
4. **Type Safety**: Comprehensive TypeScript typing throughout
5. **Documentation**: JSDoc with external reference links

### Module Responsibilities

#### Configuration Layer (`config/`)
- **constants.ts**: CORS headers, allowed methods, Git user-agent
- Contains all static configuration used across the system
- Uses `as const` for type safety and immutability

#### Utility Layer (`utils/`)
- **git-detection.ts**: 6 functions for Git HTTP protocol validation
- **cors-utils.ts**: CORS header creation and management
- **request-processor.ts**: Request parsing, header filtering, URL processing
- **response-processor.ts**: Response header processing and proxy transparency

#### Handler Layer (`handlers/`)
- **route-handlers.ts**: Health check, CORS preflight, Git proxy handlers
- Pure functions that take Hono context and return responses
- Business logic implementation following Hono patterns

#### Application Layer
- **app.ts**: Main application factory and routing configuration
- **server.ts**: Local development server with environment logging
- **index.ts**: Cloudflare Workers export

### Git CORS Proxy Architecture

**Request Flow**:
1. **Route Matching**: Health check vs Git request validation
2. **Git Detection**: Validate against Git HTTP protocol patterns
3. **CORS Handling**: Preflight responses with proper headers
4. **Request Processing**: Filter headers, build upstream URL
5. **Proxy Execution**: Forward to upstream Git server
6. **Response Processing**: Apply CORS headers, modify location headers
7. **Client Response**: Return proxied response with transparency

**Key Design Decisions**:
- Universal `app.all('/*')` handler for maximum flexibility
- Namespace-based code organization (now split into files)
- Constants extracted for maintainability
- Error handling with proper HTTP status codes
- Header filtering for security and compatibility

### Environment Configuration Patterns

**Development**: Local Bun server with environment logging
**Production**: Cloudflare Workers with environment variables
**Configuration**: Type-safe environment interface

**Environment Variables**:
- `ALLOWED_ORIGINS`: CORS origin configuration
- `INSECURE_HTTP_ORIGINS`: Domains using HTTP instead of HTTPS  
- `PORT`: Local development server port
- `CORS_ALLOW_LOCALHOST`: Development CORS settings
- `CORS_ENABLE_LOGGING`: Debug logging control

### CORS Implementation Patterns

**Headers Management**:
- 19 allowed request headers (including Git-specific headers)
- 17 exposed response headers (including GitHub-specific headers)
- 3 allowed methods (GET, POST, OPTIONS)
- Preflight handling with proper status codes

**Security Patterns**:
- Header filtering for upstream requests
- User-Agent standardization for Git compatibility
- Protocol selection based on security configuration
- Location header modification for proxy transparency

### Testing and Validation Patterns

**Health Check**: HTML endpoint with configuration display
**Functionality Verification**: HTTP status and content validation
**Import Validation**: TypeScript compilation ensures correct dependencies
**Modular Testing**: Each utility module can be tested independently

This architecture enables easy extension, maintenance, and testing while preserving the exact functionality of the original cors-proxy-main implementation. 