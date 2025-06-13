# Fluxly-CCS

A production-ready CORS-enabled proxy server for Git operations, built with Hono and TypeScript. Enables web applications to interact with Git repositories through HTTP requests by providing CORS headers and proxying Git protocol requests.

## 🚀 Features

- **🌐 CORS-Enabled Git Operations**: Proxy Git HTTP requests with proper CORS headers
- **☁️ Multi-Platform Support**: Runs on Bun locally and Cloudflare Workers
- **🏗️ Modular Architecture**: Clean, maintainable code with focused modules
- **📚 Comprehensive Documentation**: Full JSDoc documentation with examples
- **🔒 Production Ready**: Health endpoints, configurable logging, and security features
- **🔐 Authentication Support**: Forwards authentication headers for private repositories
- **⚙️ Flexible Configuration**: Environment-based configuration for different deployment scenarios

## 📋 Table of Contents

- [Quick Start](#quick-start)
- [Configuration](#configuration)
- [Architecture](#architecture)
- [API Endpoints](#api-endpoints)
- [Deployment](#deployment)
- [Development](#development)
- [Testing](#testing)
- [Security](#security)

## 🚀 Quick Start

### Prerequisites

- [Bun](https://bun.sh/) runtime (recommended) or Node.js 18+
- Git repositories to proxy (GitHub, GitLab, etc.)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd fluxly-ccs

# Install dependencies
bun install

# Start development server
bun run dev
```

The server will start at `http://localhost:3000` with default configuration.

### Basic Usage

```bash
# Proxy a Git repository info/refs request
curl "http://localhost:3000/github.com/user/repo.git/info/refs?service=git-upload-pack"

# Check server health
curl "http://localhost:3000/health"
```

## ⚙️ Configuration

The server is configured via environment variables. All configuration is optional with sensible defaults.

### Environment Variables

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `PORT` | string | `"3000"` | Server port number |
| `ALLOWED_ORIGINS` | string | `"https://fluxly.app"` | Comma-separated list of allowed CORS origins |
| `INSECURE_HTTP_ORIGINS` | string | `undefined` | Domains that should use HTTP instead of HTTPS |
| `CORS_ALLOW_LOCALHOST` | string | `"true"` (local)<br>`"false"` (Cloudflare) | Allow all localhost/127.0.0.1 origins |
| `CORS_ENABLE_LOGGING` | string | `"false"` | Enable debug logging for CORS operations |

### Configuration Examples

#### Development Configuration
```bash
# .env file for local development
PORT=3000
ALLOWED_ORIGINS=https://myapp.com,http://localhost:3000
CORS_ALLOW_LOCALHOST=true
CORS_ENABLE_LOGGING=true
INSECURE_HTTP_ORIGINS=localhost,127.0.0.1
```

#### Production Configuration (Cloudflare)
```bash
# Cloudflare Worker environment variables
ALLOWED_ORIGINS=https://myapp.com,https://app.mycompany.com
CORS_ALLOW_LOCALHOST=false
CORS_ENABLE_LOGGING=false
```

### Default Behavior

- **Local Development**: Automatically allows all localhost origins for convenience
- **Cloudflare Production**: Restricts to explicitly configured origins for security
- **Logging**: Disabled by default for performance, can be enabled for debugging

## 🏗️ Architecture

Fluxly-CCS features a modern modular architecture built with Hono:

```
src/
├── index.ts                    # Entry point (exports from app.ts)
├── app.ts                      # Main Hono application setup
├── types/
│   └── environment.ts          # TypeScript interfaces and type definitions
├── config/
│   ├── constants.ts           # Git protocol constants and CORS configuration
│   └── server-config.ts       # Server configuration and display utilities
├── utils/
│   ├── cors-utils.ts          # CORS origin validation and header management
│   ├── git-detection.ts       # Git request detection with multiple methods
│   └── proxy-utils.ts         # URL parsing, header prep, and proxy utilities
└── handlers/
    ├── proxy-handler.ts       # Core Git proxy request handling logic
    └── route-handlers.ts      # Health, root, OPTIONS, and universal handlers
```

### Module Design Principles

1. **🎯 Single Responsibility**: Each module has a focused purpose
2. **🔧 Separation of Concerns**: Types, utilities, handlers, and config are separated
3. **📦 Dependency Injection**: Modules depend on interfaces, not implementations
4. **📚 Comprehensive Documentation**: Full JSDoc coverage for all functions
5. **🏷️ Kebab-Case Naming**: Consistent file naming convention

### Core Components

#### **Types Module** (`types/environment.ts`)
- Environment configuration interfaces
- TypeScript type definitions for all configuration options
- Cloudflare Workers and development environment support

#### **Configuration Modules** (`config/`)
- **constants.ts**: Git services, paths, headers, and CORS configuration
- **server-config.ts**: Display utilities, validation, and health responses

#### **Utility Modules** (`utils/`)
- **cors-utils.ts**: Origin validation, header management, configuration parsing
- **git-detection.ts**: Multi-method Git request detection (service params, paths, user-agent)
- **proxy-utils.ts**: URL parsing, header preparation, and response handling

#### **Handler Modules** (`handlers/`)
- **proxy-handler.ts**: Core proxy logic with error handling and authentication
- **route-handlers.ts**: Health checks, root page, CORS preflight, and routing

#### **Application Setup** (`app.ts`, `index.ts`)
- **app.ts**: Hono application configuration and route registration
- **index.ts**: Simple entry point with environment detection

## 🌐 API Endpoints

### Health Check
```
GET /health
```
Returns server health status, version, and uptime information.

**Response:**
```json
{
  "status": "healthy",
  "service": "Fluxly-CCS",
  "version": "2.0.0-hono",
  "framework": "Hono",
  "timestamp": "2024-12-19T10:30:00.000Z"
}
```

### Git Proxy
```
GET|POST /{domain}/{path/to/repo}
```
Proxies Git HTTP requests to the target repository with CORS headers.

**Examples:**
```bash
# GitHub repository info/refs
GET /github.com/user/repo.git/info/refs?service=git-upload-pack

# GitLab repository
GET /gitlab.com/user/repo.git/info/refs?service=git-upload-pack

# Private repository with authentication
GET /github.com/user/private-repo.git/info/refs
Authorization: token ghp_xxxxxxxxxxxx
```

### CORS Preflight
```
OPTIONS /*
```
Handles CORS preflight requests for all endpoints.

## 🚀 Deployment

### Local Development

```bash
# Start development server with hot reload
bun run dev

# Run with custom configuration
PORT=8080 CORS_ENABLE_LOGGING=true bun run dev
```

### Cloudflare Workers

1. **Configure wrangler.jsonc:**
```json
{
  "name": "fluxly-ccs",
  "main": "src/index.ts",
  "compatibility_date": "2024-12-19",
  "env": {
    "production": {
      "vars": {
        "ALLOWED_ORIGINS": "https://myapp.com",
        "CORS_ALLOW_LOCALHOST": "false",
        "CORS_ENABLE_LOGGING": "false"
      }
    }
  }
}
```

2. **Deploy:**
```bash
# Deploy to Cloudflare
wrangler deploy

# Deploy with environment variables
wrangler deploy --env production
```

### Docker (Optional)

```dockerfile
FROM oven/bun:1-alpine
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY src ./src
EXPOSE 3000
CMD ["bun", "run", "src/index.ts"]
```

## 🛠️ Development

### Development Workflow

1. **Start Development Server**:
   ```bash
   bun run dev
   ```

2. **Make Changes**: Edit files in `src/` - the server will reload automatically

3. **Run Tests**: Ensure all functionality works:
   ```bash
   bun test
   ```

4. **Type Check**: Verify TypeScript compilation:
   ```bash
   bunx tsc --noEmit
   ```

### Available Scripts

```bash
# Development
bun run dev          # Start development server with hot reload

# Testing
bun test             # Run comprehensive test suite
bun test:watch       # Run tests in watch mode

# Production
bun run src/index.ts # Start production server

# Type Checking
bunx tsc --noEmit    # TypeScript compilation check
```

### Adding New Features

1. **Identify Module**: Determine which module your feature belongs to
2. **Create Functions**: Add well-documented functions with JSDoc
3. **Add Tests**: Create comprehensive tests for new functionality
4. **Update Types**: Add any new environment variables to `types/environment.ts`
5. **Integration**: Wire up new functionality in appropriate handlers

## 🧪 Testing

Fluxly-CCS includes a comprehensive test suite with 32 tests covering:

- **🌐 CORS Functionality**: Origin validation, header management, preflight requests
- **🔍 Git Detection**: Service parameters, URL paths, user-agent detection
- **🔄 Git Proxy Operations**: Public and private repository access
- **🔐 Authentication**: Token forwarding, Bearer tokens, Basic auth
- **⚠️ Error Handling**: Network errors, invalid requests, malformed data
- **❤️ Health Checks**: Endpoint availability and response format

### Running Tests

```bash
# Run all tests
bun test

# Run tests with GitHub token for private repository testing
GITHUB_TOKEN=your_token_here bun test

# Run specific test file
bun test tests/git-proxy.test.ts

# Watch mode for development
bun test:watch
```

### Test Environment

Tests automatically configure isolated test servers:
- **Main Test Server**: `localhost:3001`
- **Auth Test Server**: `localhost:3002`

### Test Results

```
✅ 28 tests passing
⚠️ 4 tests skipped (require GitHub token)
🔍 No linter errors
📊 Comprehensive coverage across all modules
```

## 🔒 Security

### CORS Security

- **Origin Validation**: Strict origin checking against allowed list
- **Localhost Restrictions**: Configurable localhost access (disabled in production)
- **Header Control**: Explicit allowed headers and methods
- **Credential Handling**: Configurable credential support

### Authentication

- **Header Forwarding**: Safely forwards authentication headers to target repositories
- **Token Support**: Supports GitHub tokens, Bearer tokens, and Basic authentication
- **Private Repository Access**: Enables authenticated access to private repositories

### Production Security

- **Minimal Logging**: Disabled by default to prevent information leakage
- **Environment Isolation**: Separate configurations for development and production
- **Input Validation**: Validates all incoming requests and headers

### Security Best Practices

1. **Configure Allowed Origins**: Always specify explicit allowed origins in production
2. **Disable Localhost**: Set `CORS_ALLOW_LOCALHOST=false` in production
3. **Minimal Logging**: Keep `CORS_ENABLE_LOGGING=false` in production
4. **HTTPS Only**: Use HTTPS for all production deployments
5. **Token Security**: Rotate authentication tokens regularly

## 📝 Configuration Reference

### Complete Environment Configuration

```bash
# Server Configuration
PORT=3000                                    # Server port

# CORS Configuration
ALLOWED_ORIGINS=https://app.com,https://admin.app.com  # Allowed origins
CORS_ALLOW_LOCALHOST=true                    # Allow localhost (dev: true, prod: false)
CORS_ENABLE_LOGGING=false                    # Debug logging (dev: false, prod: false)

# Protocol Configuration
INSECURE_HTTP_ORIGINS=localhost,127.0.0.1    # Domains to use HTTP instead of HTTPS
```

### Default Behavior

- **🖥️ Local Development**: Automatically allows all localhost origins for convenience
- **☁️ Cloudflare Production**: Restricts to explicitly configured origins for security
- **📝 Logging**: Disabled by default for performance, can be enabled for debugging

## 📚 Documentation Standards

All modules include comprehensive JSDoc documentation:

- **📄 File-level documentation**: `@fileoverview` with module purpose
- **🔧 Function documentation**: Complete parameter and return types
- **💡 Usage examples**: Practical examples for all public functions
- **🏷️ Type annotations**: Full TypeScript integration
- **📌 Version tracking**: `@version` and `@author` tags

### Example Documentation

```typescript
/**
 * Validates whether a given origin is allowed to make CORS requests.
 * 
 * @param {string | undefined} origin - The origin header from the request
 * @param {readonly string[]} allowedOrigins - List of allowed origins
 * @param {boolean} allowLocalhost - Whether to allow localhost origins
 * @returns {boolean} True if the origin is allowed
 * 
 * @example
 * ```typescript
 * const allowed = isOriginAllowed('https://fluxly.app', ['https://fluxly.app'], false)
 * // Returns: true
 * ```
 */
```

## 🤝 Contributing

1. **🍴 Fork** the repository
2. **🌿 Create** a feature branch: `git checkout -b feature/new-feature`
3. **✨ Make** changes and add comprehensive tests
4. **🧪 Run** the test suite: `bun test`
5. **📝 Document** new functionality with JSDoc
6. **💾 Commit** changes: `git commit -am 'Add new feature'`
7. **🚀 Push** to branch: `git push origin feature/new-feature`
8. **📬 Submit** a pull request

### Code Standards

- **📚 JSDoc**: All public functions must have comprehensive documentation
- **🧪 Tests**: New features require corresponding tests
- **🏷️ Types**: Use TypeScript types for all function parameters and returns
- **🎯 Modules**: Follow the existing modular architecture patterns

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For issues, questions, or contributions:

1. Check existing issues in the repository
2. Create a new issue with detailed description
3. Include configuration and error logs (without sensitive data)
4. Specify deployment environment (local/Cloudflare)

---

**Built with ❤️ using [Hono](https://hono.dev/) and [Bun](https://bun.sh/)**