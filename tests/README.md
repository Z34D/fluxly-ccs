# Git CORS Proxy Test Suite

This test suite provides comprehensive testing for the Git CORS proxy server, including tests for both public and private repositories.

## Test Structure

- **`git-proxy.test.ts`** - Main test suite covering all proxy functionality
- **`auth.test.ts`** - Focused authentication tests for private repositories
- **`test-config.ts`** - Shared configuration and utilities

## Target Repositories

### Public Repository: `Z34D/fluxly-ccs`
- Tests basic Git operations without authentication
- Verifies CORS functionality
- Tests Git protocol compliance

### Private Repository: `Z34D/fluxly-login`
- Tests authentication handling
- Verifies private repository access control
- Tests various authentication methods

## Running Tests

### Basic Test Execution
```bash
# Run all tests
bun test

# Run with verbose output
bun test --verbose

# Run specific test file
bun test tests/git-proxy.test.ts
bun test tests/auth.test.ts

# Run in watch mode
bun test:watch
```

### Test with Coverage
```bash
bun test:coverage
```

## Authentication Setup

### For Private Repository Tests
To test private repository access, you need a GitHub personal access token:

1. **Create GitHub Token**:
   - Go to GitHub Settings → Developer settings → Personal access tokens
   - Generate a new token with `repo` permissions
   - Copy the token

2. **Set Environment Variable**:
   ```bash
   # Windows
   set GITHUB_TOKEN=your_github_token_here
   
   # macOS/Linux
   export GITHUB_TOKEN=your_github_token_here
   ```

3. **Run Tests**:
   ```bash
   bun test
   ```

### Without Authentication
If no GitHub token is provided:
- Private repository tests will be skipped
- Public repository tests will run normally
- Test output will show guidance for enabling private repo tests

## Test Categories

### 1. Basic Server Functionality
- Root endpoint response
- Test endpoint functionality
- Server startup and shutdown

### 2. CORS Headers
- OPTIONS preflight requests
- CORS header validation
- Origin-based access control
- Unauthorized origin blocking

### 3. Public Repository Tests (Z34D/fluxly-ccs)
- Git upload-pack info/refs requests
- Git request detection
- GitHub proxy functionality
- Git protocol compliance

### 4. Private Repository Tests (Z34D/fluxly-login)
- Unauthenticated access rejection
- Token-based authentication
- Bearer token authentication
- Authentication header forwarding

### 5. Git Protocol Compliance
- Service parameter handling
- User-agent detection
- Proper content-type headers
- Git-specific response validation

### 6. Error Handling
- Invalid URL formats
- Non-existent repositories
- Network error handling
- Malformed requests

### 7. POST Requests
- Git upload-pack POST requests
- Non-Git POST rejection
- Content-type validation

### 8. Authentication Security
- Error information disclosure
- Malformed auth header handling
- CORS with authentication

## Expected Test Results

### Public Repository (Z34D/fluxly-ccs)
- ✅ Should return 200 for info/refs requests
- ✅ Should include proper Git content-type headers
- ✅ Should contain Git protocol markers
- ✅ Should handle CORS correctly

### Private Repository (Z34D/fluxly-login)
- ✅ Should return 404 for unauthenticated requests
- ✅ Should return 200 for authenticated requests (with token)
- ✅ Should forward authentication headers properly
- ✅ Should handle various auth formats

### Error Scenarios
- ✅ Should return 403 for unauthorized origins
- ✅ Should return 400 for invalid URL formats
- ✅ Should return 404 for non-existent repositories
- ✅ Should return 500 for network errors

## Test Configuration

The test suite uses different ports to avoid conflicts:
- Main tests: Port 3001
- Auth tests: Port 3002
- Production server: Port 3000

## Debugging Test Failures

### Common Issues

1. **Port Conflicts**:
   ```bash
   # Kill processes on test ports
   lsof -ti:3001 | xargs kill -9
   lsof -ti:3002 | xargs kill -9
   ```

2. **GitHub API Rate Limiting**:
   - Tests may fail due to rate limits
   - Wait a few minutes and retry
   - Use authenticated requests to increase rate limits

3. **Network Issues**:
   - Ensure internet connectivity
   - Check if GitHub is accessible
   - Verify proxy is not blocking requests

4. **Authentication Failures**:
   - Verify GITHUB_TOKEN is set correctly
   - Check token has `repo` permissions
   - Ensure token is not expired

### Verbose Debugging
```bash
# Run with maximum verbosity
bun test --verbose --reporter=verbose

# Run single test with debugging
bun test tests/auth.test.ts --verbose
```

## Test Output

The test suite provides detailed output including:
- 📋 Request/response status codes
- 🔐 Authentication status
- 📝 Content-type verification
- ✅ Success indicators
- ⚠️ Warnings and skipped tests
- 💡 Setup instructions

## Continuous Integration

For CI/CD environments:
```yaml
# Example GitHub Actions step
- name: Run tests
  run: |
    bun test
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

## Test Maintenance

When updating the proxy server:
1. Update test expectations in `test-config.ts`
2. Add new test cases for new features
3. Update authentication tests for new auth methods
4. Run full test suite to ensure compatibility

## Contributing

When adding new tests:
1. Follow the existing pattern in `git-proxy.test.ts`
2. Use shared configuration from `test-config.ts`
3. Add proper error handling and logging
4. Include both success and failure scenarios
5. Update this README with new test categories 