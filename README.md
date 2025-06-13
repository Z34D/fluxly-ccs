# Git CORS Proxy

A production-ready CORS-enabled proxy server for Git operations, built with Elysia and TypeScript. Enables web applications to interact with Git repositories through HTTP requests by providing CORS headers and proxying Git protocol requests.

## 🚀 Features

- **CORS-Enabled Git Operations**: Proxy Git HTTP requests with proper CORS headers
- **Multi-Platform Support**: Runs on Node.js/Bun locally and Cloudflare Workers
- **Modular Plugin Architecture**: Clean, maintainable code with Elysia plugins
- **Production Ready**: Health endpoints, configurable logging, and security features
- **Authentication Support**: Forwards authentication headers for private repositories
- **Flexible Configuration**: Environment-based configuration for different deployment scenarios

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

The application follows a modular plugin-based architecture using Elysia:

```
src/
├── app.ts              # Main application factory
├── index.ts            # Local development entry point
├── cloudflare.ts       # Cloudflare Worker entry point
├── plugins/            # Modular Elysia plugins
│   ├── cors-origin.ts  # CORS origin validation
│   ├── cors-headers.ts # CORS header management
│   ├── git-detection.ts# Git request detection
│   └── health.ts       # Health check endpoint
└── types/
    └── env.ts          # Environment configuration types
```

### Plugin Architecture

1. **CORS Origin Plugin** (`cors-origin.ts`)
   - Validates request origins against allowed list
   - Automatic localhost support for development
   - Configurable origin validation logic

2. **CORS Headers Plugin** (`cors-headers.ts`)
   - Manages CORS response headers
   - Handles preflight OPTIONS requests
   - Configurable header policies

3. **Git Detection Plugin** (`git-detection.ts`)
   - Identifies Git protocol requests
   - Multiple detection methods (URL patterns, headers, user-agent)
   - Extensible detection logic

4. **Health Plugin** (`health.ts`)
   - Production health check endpoint
   - Version information and uptime
   - Configurable health metrics

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
  "service": "Git CORS Proxy",
  "version": "1.0.50",
  "timestamp": "2024-12-19T10:30:00.000Z",
  "uptime": 1234567
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

1. **Configure wrangler.toml:**
```toml
name = "git-cors-proxy"
main = "src/cloudflare.ts"
compatibility_date = "2024-12-19"

[env.production.vars]
ALLOWED_ORIGINS = "https://myapp.com"
CORS_ALLOW_LOCALHOST = "false"
CORS_ENABLE_LOGGING = "false"
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

### Project Structure

- **`src/app.ts`**: Main application factory with plugin registration
- **`src/index.ts`**: Local development entry point with environment setup
- **`src/cloudflare.ts`**: Cloudflare Worker entry point with production defaults
- **`src/plugins/`**: Modular Elysia plugins for specific functionality
- **`src/types/`**: TypeScript type definitions
- **`tests/`**: Comprehensive test suite
- **`memory-bank/`**: Project documentation and context

### Available Scripts

```bash
# Development
bun run dev          # Start development server with hot reload

# Testing
bun test             # Run test suite
bun test:watch       # Run tests in watch mode
bun test:coverage    # Run tests with coverage report

# Production
bun run src/index.ts # Start production server
```

### Adding New Features

1. **Create Plugin**: Add new functionality as Elysia plugins in `src/plugins/`
2. **Register Plugin**: Add plugin to `src/app.ts`
3. **Add Tests**: Create tests in `tests/` directory
4. **Update Types**: Add any new environment variables to `src/types/env.ts`

## 🧪 Testing

The project includes a comprehensive test suite covering:

- **CORS functionality**: Origin validation, header management, preflight requests
- **Git proxy operations**: Public and private repository access
- **Authentication**: Token forwarding and validation
- **Error handling**: Network errors, invalid requests, malformed data
- **Health checks**: Endpoint availability and response format

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

### Test Configuration

Tests automatically configure test servers on different ports:
- Main test server: `localhost:3001`
- Auth test server: `localhost:3002`

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

### Deployment-Specific Defaults

#### Local Development (`src/index.ts`)
```typescript
{
  PORT: "3000",
  ALLOWED_ORIGINS: "https://fluxly.app",
  CORS_ALLOW_LOCALHOST: "true",     // Convenient for development
  CORS_ENABLE_LOGGING: "false"      // Can be overridden
}
```

#### Cloudflare Production (`src/cloudflare.ts`)
```typescript
{
  ALLOWED_ORIGINS: "https://fluxly.app",
  CORS_ALLOW_LOCALHOST: "false",    // Security: no localhost in production
  CORS_ENABLE_LOGGING: "false"      // Performance: minimal logging
}
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Make changes and add tests
4. Run the test suite: `bun test`
5. Commit changes: `git commit -am 'Add new feature'`
6. Push to branch: `git push origin feature/new-feature`
7. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For issues, questions, or contributions:

1. Check existing issues in the repository
2. Create a new issue with detailed description
3. Include configuration and error logs (without sensitive data)
4. Specify deployment environment (local/Cloudflare)

---

**Built with ❤️ using [Elysia](https://elysiajs.com/) and [Bun](https://bun.sh/)**