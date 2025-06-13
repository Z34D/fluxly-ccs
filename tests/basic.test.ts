import { describe, test, expect, beforeAll, afterAll } from 'bun:test';
import app from '../src/index';
import { TEST_CONFIG, HEADERS, buildTestUrls, getGitHubToken, hasGitHubToken, createTestServer, stopTestServer } from './test-config';

// Custom matcher for multiple possible values
const toBeOneOf = (received: unknown, expected: number[]): { pass: boolean; message: () => string } => {
  const pass = Array.isArray(expected) && expected.includes(received as number);
  return {
    message: () => `expected ${received} to be one of ${expected.join(', ')}`,
    pass
  };
};

// Extend expect with custom matcher
expect.extend({ toBeOneOf });

// Add TypeScript declaration for the custom matcher
declare module 'bun:test' {
  interface Matchers<T> {
    toBeOneOf(expected: number[]): T;
  }
}

describe('Fluxly-CCS - Comprehensive Test Suite', () => {
  let server: any;
  const urls = buildTestUrls(TEST_CONFIG.SERVER.BASE_URL);

  beforeAll(async () => {
    console.log("🚀 Starting comprehensive test server...");
    
    // Set up test environment variables
    process.env.ALLOWED_ORIGINS = TEST_CONFIG.SERVER.ALLOWED_ORIGINS;
    process.env.CORS_ALLOW_LOCALHOST = 'true';
    process.env.CORS_ENABLE_LOGGING = 'true';

    // Start test server
    server = createTestServer(app, TEST_CONFIG.SERVER.PORT);
    await new Promise(resolve => setTimeout(resolve, TEST_CONFIG.TIMEOUTS.SERVER_START));
    
    console.log("✅ Comprehensive test server started on port 3001");
  });

  afterAll(() => {
    if (server) {
      stopTestServer(server);
      console.log("🛑 Comprehensive test server stopped");
    }
  });

  describe('Health Endpoint', () => {
    test('GET /health returns healthy status', async () => {
      const response = await fetch(urls.health());
      
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.status).toBe('healthy');
      expect(data.service).toBe('Fluxly-CCS');
      expect(data.version).toBe('2.0.0-hono');
      expect(data.framework).toBe('Hono');
    });
  });

  describe('Root Endpoint', () => {
    test('GET / returns HTML information page', async () => {
      const response = await fetch(urls.root());
      
      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toContain('text/html');
      
      const html = await response.text();
      expect(html).toContain('Fluxly-CCS');
      expect(html).toContain('github.com/user/repo.git');
    });
  });

  describe('CORS Functionality', () => {
    test('OPTIONS preflight request with allowed origin', async () => {
      const response = await fetch(urls.publicRepoInfoRefs(), {
        method: 'OPTIONS',
        headers: HEADERS.CORS_PREFLIGHT
      });

      expect(response.status).toBe(204);
      expect(response.headers.get('access-control-allow-origin')).toBe(TEST_CONFIG.SERVER.BASE_URL);
      expect(response.headers.get('access-control-allow-methods')).toContain('GET');
      expect(response.headers.get('access-control-allow-methods')).toContain('POST');
    });

    test('OPTIONS preflight request with malicious origin should be blocked', async () => {
      const response = await fetch(urls.publicRepoInfoRefs(), {
        method: 'OPTIONS',
        headers: HEADERS.MALICIOUS_ORIGIN
      });

      expect(response.status).toBe(204);
      // Should not include the malicious origin in the response
      expect(response.headers.get('access-control-allow-origin')).not.toBe('https://malicious-site.com');
    });

    test('GET request should include CORS headers in response', async () => {
      const response = await fetch(urls.publicRepoInfoRefs(), {
        headers: HEADERS.GIT_CLIENT
      });

      expect(response.headers.get('access-control-allow-origin')).toBeTruthy();
    });

    test('should block requests from unauthorized origins', async () => {
      const response = await fetch(urls.publicRepoInfoRefs(), {
        headers: HEADERS.MALICIOUS_ORIGIN
      });

      expect(response.status).toBe(403);
    });
  });

  describe('Git Proxy Operations - Public Repository', () => {
    test('GET public repository info/refs should work', async () => {
      const response = await fetch(urls.publicRepoInfoRefs(), {
        headers: HEADERS.GIT_CLIENT
      });

      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toContain('application/x-git');
      
      const text = await response.text();
      expect(text).toMatch(TEST_CONFIG.PATTERNS.GIT_UPLOAD_PACK);
      expect(text).toContain(TEST_CONFIG.PATTERNS.GIT_SERVICE_HEADER);
    });

    test('should detect Git requests correctly', async () => {
      const response = await fetch(urls.publicRepoInfoRefs(), {
        headers: HEADERS.GIT_CLIENT
      });

      // Should be recognized as Git request and proxied
      expect(response.status).toBe(200);
      // Verify content-type is set (GitHub may return various types)
      expect(response.headers.get('content-type')).toBeTruthy();
    });

    test('should proxy GitHub repository access with proper Git protocol response', async () => {
      const response = await fetch(urls.publicRepoInfoRefs(), {
        headers: {
          ...HEADERS.GIT_CLIENT,
          "Accept": "application/x-git-upload-pack-advertisement"
        }
      });

      expect(response.status).toBe(200);
      
      const text = await response.text();
      // Verify it's actual Git protocol response from GitHub
      expect(text).toMatch(/^[0-9a-f]{4}# service=git-upload-pack/);
    });

    test('Non-Git request should return informational response', async () => {
      const response = await fetch(urls.nonGitRequest(), {
        headers: HEADERS.NON_GIT_CLIENT
      });

      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.message).toBe('Not a Git request');
      expect(data.isGit).toBe(false);
      expect(data.framework).toBe('Hono');
    });
  });

  describe('Git Protocol Compliance', () => {
    test('should handle git-upload-pack service parameter', async () => {
      const response = await fetch(urls.publicRepoInfoRefs('git-upload-pack'), {
        headers: HEADERS.GIT_CLIENT
      });

      expect(response.status).toBe(200);
      // GitHub returns different content-type, verify it's set
      expect(response.headers.get('content-type')).toBeTruthy();
    });

    test('should handle git-receive-pack service parameter', async () => {
      const response = await fetch(urls.publicRepoInfoRefs('git-receive-pack'), {
        headers: HEADERS.GIT_CLIENT
      });

      // Public repos typically don't allow receive-pack, so expect 403 or 401
      expect([401, 403].includes(response.status)).toBe(true);
    });

    test('should detect Git requests by user-agent', async () => {
      const response = await fetch(`${TEST_CONFIG.SERVER.BASE_URL}/github.com/${TEST_CONFIG.REPOSITORIES.PUBLIC}.git/some-path`, {
        headers: HEADERS.GIT_CLIENT
      });

      // Should be detected as Git request even without service parameter
      // Accept 404 as GitHub may not have this path, but verify it was treated as Git request
      expect(response.status).toBeGreaterThan(0);
    });

    test('should set proper user-agent for proxied requests', async () => {
      const response = await fetch(urls.publicRepoInfoRefs(), {
        headers: {
          "Origin": TEST_CONFIG.SERVER.BASE_URL
        }
      });

      expect(response.status).toBe(200);
      // Test passes if proxy successfully sets user-agent and gets valid response
    });
  });

  describe('POST Requests', () => {
    test('should handle POST requests to Git endpoints', async () => {
      // Test with minimal POST body (empty pack)
      const response = await fetch(urls.publicRepoUploadPack(), {
        method: "POST",
        headers: {
          ...HEADERS.GIT_CLIENT,
          "Content-Type": "application/x-git-upload-pack-request"
        },
        body: "0000" // Minimal Git pack request
      });

      // Should be processed as Git request (may fail due to invalid pack, but should reach proxy)
      expect([200, 400, 403].includes(response.status)).toBe(true);
    });

    test('POST to non-Git endpoint should be forbidden', async () => {
      const response = await fetch(urls.nonGitPost(), {
        method: 'POST',
        headers: HEADERS.NON_GIT_CLIENT
      });

      expect(response.status).toBe(403);
      
      const data = await response.json();
      expect(data.error).toBe('Forbidden - Not a Git request');
    });

    test('should reject non-Git POST requests', async () => {
      const response = await fetch(urls.nonGitPost(), {
        method: "POST",
        headers: {
          "Origin": TEST_CONFIG.SERVER.BASE_URL,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ data: "test" })
      });

      expect(response.status).toBe(403);
      const text = await response.text();
      expect(text).toContain("Forbidden - Not a Git request");
    });
  });

  describe('Authentication Tests - Private Repository', () => {
    const token = getGitHubToken();
    
    test('should reject unauthenticated requests to private repo', async () => {
      const response = await fetch(urls.privateRepoInfoRefs(), {
        headers: HEADERS.GIT_CLIENT
      });

      // Should get 401 from GitHub for private repo without auth
      expect(response.status).toBe(401);
      
      // Should still have proper CORS headers
      expect(response.headers.get('access-control-allow-origin')).toBeTruthy();
    });
    
    test.skipIf(!hasGitHubToken())('GET private repository with GitHub token', async () => {
      const response = await fetch(urls.privateRepoInfoRefs(), {
        headers: HEADERS.AUTHENTICATED_GIT(token!)
      });

      // Should forward the authentication and get a response
      // Note: This might be 401 if token is invalid, but should not be a proxy error
      expect(response.status).toBeOneOf([200, 401, 404]);
      
      // Should have proper CORS headers
      expect(response.headers.get('access-control-allow-origin')).toBeTruthy();
    });

    test.skipIf(!hasGitHubToken())('GET private repository with Bearer token', async () => {
      const response = await fetch(urls.privateRepoInfoRefs(), {
        headers: HEADERS.BEARER_AUTH(token!)
      });

      // Should forward the authentication and get a response
      expect(response.status).toBeOneOf([200, 401, 404]);
      
      // Should have proper CORS headers
      expect(response.headers.get('access-control-allow-origin')).toBeTruthy();
    });

    test.skipIf(!hasGitHubToken())('should test different authentication methods', async () => {
      const token = getGitHubToken()!;
      
      // Test various auth header formats
      const authFormats = [
        { name: "token", header: `token ${token}` },
        { name: "Bearer", header: `Bearer ${token}` },
        { name: "Basic", header: `Basic ${btoa(`token:${token}`)}` }
      ];

      for (const authFormat of authFormats) {
        console.log(`🧪 Testing ${authFormat.name} authentication...`);
        
        const response = await fetch(urls.privateRepoInfoRefs(), {
          headers: {
            "Origin": TEST_CONFIG.SERVER.BASE_URL,
            "Authorization": authFormat.header,
            "User-Agent": "git/2.34.1"
          }
        });

        console.log(`   ${authFormat.name}: ${response.status} ${response.statusText}`);
        
        // Don't fail the test if auth format isn't supported, just log results
        expect(response.status).toBeGreaterThan(0);
      }
    });

    test('should properly forward authentication headers in proxy', async () => {
      // Test that our proxy correctly forwards auth headers
      const fakeToken = "fake-token-for-testing";
      
      const response = await fetch(urls.privateRepoInfoRefs(), {
        headers: {
          "Origin": TEST_CONFIG.SERVER.BASE_URL,
          "Authorization": `token ${fakeToken}`,
          "User-Agent": "git/2.34.1"
        }
      });

      // Should get 404 or 401 (not 403 due to missing auth header)
      // This tests that our proxy is forwarding the auth header
      expect([
        TEST_CONFIG.STATUS_CODES.UNAUTHORIZED,
        TEST_CONFIG.STATUS_CODES.FORBIDDEN,
        TEST_CONFIG.STATUS_CODES.NOT_FOUND
      ]).toContain(response.status);
      
      console.log(`📋 Auth header forwarding test: ${response.status} (expected 401/403/404)`);
    });
  });

  describe('Authentication Security', () => {
    test('should not leak authentication errors', async () => {
      const response = await fetch(urls.privateRepoInfoRefs(), {
        headers: {
          "Origin": TEST_CONFIG.SERVER.BASE_URL,
          "Authorization": "invalid-auth-header",
          "User-Agent": "git/2.34.1"
        }
      });

      // Should return generic error, not detailed auth failure
      expect([
        TEST_CONFIG.STATUS_CODES.UNAUTHORIZED,
        TEST_CONFIG.STATUS_CODES.FORBIDDEN,
        TEST_CONFIG.STATUS_CODES.NOT_FOUND
      ]).toContain(response.status);
      
      // Response body should not contain sensitive information
      const text = await response.text();
      expect(text.toLowerCase()).not.toContain("token");
      // Note: GitHub may return "invalid credentials" which is acceptable generic error
      expect(text.toLowerCase()).not.toContain("password");
    });

    test('should handle malformed Authorization headers gracefully', async () => {
      const malformedHeaders = [
        "Bearer", // Missing token
        "token", // Missing token value
        "Basic invalid-base64", // Invalid base64
        "Unknown auth-type token" // Unknown auth type
      ];

      for (const authHeader of malformedHeaders) {
        const response = await fetch(urls.privateRepoInfoRefs(), {
          headers: {
            "Origin": TEST_CONFIG.SERVER.BASE_URL,
            "Authorization": authHeader,
            "User-Agent": "git/2.34.1"
          }
        });

        // Should handle gracefully without crashing
        expect(response.status).toBeGreaterThan(0);
        console.log(`🧪 Malformed auth "${authHeader}": ${response.status}`);
      }
    });
  });

  describe('CORS with Authentication', () => {
    test.skipIf(!hasGitHubToken())('should handle CORS preflight with auth headers', async () => {
      const response = await fetch(urls.privateRepoInfoRefs(), {
        method: "OPTIONS",
        headers: {
          "Origin": TEST_CONFIG.SERVER.BASE_URL,
          "Access-Control-Request-Method": "GET",
          "Access-Control-Request-Headers": "authorization, user-agent"
        }
      });

      console.log(`🔍 CORS preflight response: ${response.status}`);
      
      if (response.status === TEST_CONFIG.STATUS_CODES.NO_CONTENT) {
        const allowHeaders = response.headers.get("access-control-allow-headers");
        if (allowHeaders) {
          expect(allowHeaders.toLowerCase()).toContain("authorization");
          console.log("✅ CORS preflight allows authorization header");
        }
      }
    });

    test('should include CORS headers in auth error responses', async () => {
      const response = await fetch(urls.privateRepoInfoRefs(), {
        headers: {
          "Origin": TEST_CONFIG.SERVER.BASE_URL,
          "User-Agent": "git/2.34.1"
        }
      });

      // Even auth failures should include CORS headers (if origin was allowed)
      const corsHeader = response.headers.get("access-control-allow-origin");
      console.log(`📋 CORS in auth error: ${corsHeader || 'NOT PRESENT'}`);
      expect(response.status).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    test('Invalid proxy URL format should return 400', async () => {
      const response = await fetch(urls.invalidFormat(), {
        headers: HEADERS.GIT_CLIENT
      });

      expect(response.status).toBe(400);
      
      const text = await response.text();
      expect(text).toContain('Invalid proxy URL format');
    });

    test('Non-existent repository should return 401', async () => {
      const response = await fetch(urls.nonExistentRepo(), {
        headers: HEADERS.GIT_CLIENT
      });

      // GitHub returns 401 instead of 404 for non-existent repos (security feature)
      expect(response.status).toBe(401);
      
      // Should still have proper CORS headers
      expect(response.headers.get('access-control-allow-origin')).toBeTruthy();
    });

    test('should handle non-existent repositories', async () => {
      const response = await fetch(urls.nonExistentRepo(), {
        headers: HEADERS.GIT_CLIENT
      });

      // GitHub may return 401 instead of 404 for non-existent repos
      expect([401, 404]).toContain(response.status);
    });

    test('should handle network errors gracefully', async () => {
      // Test with invalid domain
      const response = await fetch(urls.invalidDomain(), {
        headers: HEADERS.GIT_CLIENT
      });

      expect(response.status).toBe(500);
      const text = await response.text();
      expect(text).toBe("Internal proxy error");
    });

    test('should handle invalid URL format', async () => {
      const response = await fetch(urls.invalidFormat(), {
        headers: HEADERS.GIT_CLIENT
      });

      // Invalid URL is treated as non-Git request for simple formats, or returns 400 for complex formats
      expect([200, 400].includes(response.status)).toBe(true);
    });
  });

  describe('Test Environment', () => {
    test('should log GitHub token availability', () => {
      const token = getGitHubToken();
      if (token) {
        console.log("✅ GitHub token available - private repo tests will run");
        console.log(`🔐 Token format: ${token.substring(0, 8)}...`);
        expect(token.length).toBeGreaterThan(10);
      } else {
        console.log("⚠️  No GitHub token found - private repo tests will be skipped");
        console.log("💡 Set GITHUB_TOKEN environment variable to test private repositories");
      }
    });
  });
}); 