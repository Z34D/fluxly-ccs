import { describe, test, expect } from 'bun:test';
import {
  isGitRequest,
  hasGitServiceParameter,
  hasGitPath,
  hasGitUserAgent,
  extractGitService,
  isGitCloneRequest,
  isGitPushRequest
} from '../src/utils/git-detection';

describe('Git Detection Utilities', () => {
  
  describe('isGitRequest()', () => {
    test('should detect Git request with service parameter', () => {
      const request = new Request('https://proxy.com/github.com/user/repo.git/info/refs?service=git-upload-pack');
      const url = new URL(request.url);
      
      expect(isGitRequest(request, url)).toBe(true);
    });

    test('should detect Git request with .git path', () => {
      const request = new Request('https://proxy.com/github.com/user/repo.git/some-path');
      const url = new URL(request.url);
      
      expect(isGitRequest(request, url)).toBe(true);
    });

    test('should detect Git request with info/refs path', () => {
      const request = new Request('https://proxy.com/github.com/user/repo/info/refs');
      const url = new URL(request.url);
      
      expect(isGitRequest(request, url)).toBe(true);
    });

    test('should detect Git request with git-upload-pack path', () => {
      const request = new Request('https://proxy.com/github.com/user/repo/git-upload-pack');
      const url = new URL(request.url);
      
      expect(isGitRequest(request, url)).toBe(true);
    });

    test('should detect Git request with git-receive-pack path', () => {
      const request = new Request('https://proxy.com/github.com/user/repo/git-receive-pack');
      const url = new URL(request.url);
      
      expect(isGitRequest(request, url)).toBe(true);
    });

    test('should detect Git request with Git User-Agent', () => {
      const request = new Request('https://proxy.com/github.com/user/repo', {
        headers: { 'User-Agent': 'git/2.39.0' }
      });
      const url = new URL(request.url);
      
      expect(isGitRequest(request, url)).toBe(true);
    });

    test('should detect Git request with git/libgit2 User-Agent', () => {
      const request = new Request('https://proxy.com/github.com/user/repo', {
        headers: { 'User-Agent': 'git/libgit2 1.5.0' }
      });
      const url = new URL(request.url);
      
      expect(isGitRequest(request, url)).toBe(true);
    });

    test('should NOT detect non-Git request', () => {
      const request = new Request('https://proxy.com/api/status', {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
      });
      const url = new URL(request.url);
      
      expect(isGitRequest(request, url)).toBe(false);
    });

    test('should NOT detect request without Git indicators', () => {
      const request = new Request('https://proxy.com/some/regular/path');
      const url = new URL(request.url);
      
      expect(isGitRequest(request, url)).toBe(false);
    });

    test('should handle complex Git URL with multiple indicators', () => {
      const request = new Request('https://proxy.com/github.com/user/repo.git/info/refs?service=git-upload-pack', {
        headers: { 'User-Agent': 'git/2.39.0' }
      });
      const url = new URL(request.url);
      
      expect(isGitRequest(request, url)).toBe(true);
    });
  });

  describe('hasGitServiceParameter()', () => {
    test('should detect git-upload-pack service', () => {
      const url = new URL('https://example.com/repo.git/info/refs?service=git-upload-pack');
      
      expect(hasGitServiceParameter(url)).toBe(true);
    });

    test('should detect git-receive-pack service', () => {
      const url = new URL('https://example.com/repo.git/info/refs?service=git-receive-pack');
      
      expect(hasGitServiceParameter(url)).toBe(true);
    });

    test('should NOT detect invalid service parameter', () => {
      const url = new URL('https://example.com/repo.git/info/refs?service=invalid-service');
      
      expect(hasGitServiceParameter(url)).toBe(false);
    });

    test('should NOT detect missing service parameter', () => {
      const url = new URL('https://example.com/repo.git/info/refs');
      
      expect(hasGitServiceParameter(url)).toBe(false);
    });

    test('should NOT detect empty service parameter', () => {
      const url = new URL('https://example.com/repo.git/info/refs?service=');
      
      expect(hasGitServiceParameter(url)).toBe(false);
    });

    test('should handle URL with multiple parameters', () => {
      const url = new URL('https://example.com/repo.git/info/refs?other=value&service=git-upload-pack&another=param');
      
      expect(hasGitServiceParameter(url)).toBe(true);
    });
  });

  describe('hasGitPath()', () => {
    test('should detect /info/refs path', () => {
      const url = new URL('https://example.com/repo/info/refs');
      
      expect(hasGitPath(url)).toBe(true);
    });

    test('should detect .git/ in path', () => {
      const url = new URL('https://example.com/user/repo.git/some-path');
      
      expect(hasGitPath(url)).toBe(true);
    });

    test('should detect git-upload-pack in path', () => {
      const url = new URL('https://example.com/user/repo/git-upload-pack');
      
      expect(hasGitPath(url)).toBe(true);
    });

    test('should detect git-receive-pack in path', () => {
      const url = new URL('https://example.com/user/repo/git-receive-pack');
      
      expect(hasGitPath(url)).toBe(true);
    });

    test('should NOT detect regular paths', () => {
      const url = new URL('https://example.com/api/status');
      
      expect(hasGitPath(url)).toBe(false);
    });

    test('should NOT detect similar but invalid paths', () => {
      const url = new URL('https://example.com/info/reference');
      
      expect(hasGitPath(url)).toBe(false);
    });

    test('should handle complex paths with Git patterns', () => {
      const url = new URL('https://example.com/path/to/repo.git/info/refs/some/more/path');
      
      expect(hasGitPath(url)).toBe(true);
    });
  });

  describe('hasGitUserAgent()', () => {
    test('should detect standard Git User-Agent', () => {
      const request = new Request('https://example.com/', {
        headers: { 'User-Agent': 'git/2.39.0' }
      });
      
      expect(hasGitUserAgent(request)).toBe(true);
    });

    test('should detect libgit2 User-Agent', () => {
      const request = new Request('https://example.com/', {
        headers: { 'User-Agent': 'git/libgit2 1.5.0' }
      });
      
      expect(hasGitUserAgent(request)).toBe(true);
    });

    test('should detect minimal git User-Agent', () => {
      const request = new Request('https://example.com/', {
        headers: { 'User-Agent': 'git/' }
      });
      
      expect(hasGitUserAgent(request)).toBe(true);
    });

    test('should NOT detect browser User-Agent', () => {
      const request = new Request('https://example.com/', {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
      });
      
      expect(hasGitUserAgent(request)).toBe(false);
    });

    test('should NOT detect missing User-Agent', () => {
      const request = new Request('https://example.com/');
      
      expect(hasGitUserAgent(request)).toBe(false);
    });

    test('should NOT detect similar but invalid User-Agent', () => {
      const request = new Request('https://example.com/', {
        headers: { 'User-Agent': 'github-client/1.0' }
      });
      
      expect(hasGitUserAgent(request)).toBe(false);
    });

    test('should handle case-sensitive User-Agent matching', () => {
      const request = new Request('https://example.com/', {
        headers: { 'User-Agent': 'Git/2.39.0' }
      });
      
      expect(hasGitUserAgent(request)).toBe(false); // Should be case-sensitive
    });
  });

  describe('extractGitService()', () => {
    test('should extract git-upload-pack service', () => {
      const url = new URL('https://example.com/repo.git/info/refs?service=git-upload-pack');
      
      expect(extractGitService(url)).toBe('git-upload-pack');
    });

    test('should extract git-receive-pack service', () => {
      const url = new URL('https://example.com/repo.git/info/refs?service=git-receive-pack');
      
      expect(extractGitService(url)).toBe('git-receive-pack');
    });

    test('should return null for invalid service', () => {
      const url = new URL('https://example.com/repo.git/info/refs?service=invalid-service');
      
      expect(extractGitService(url)).toBe(null);
    });

    test('should return null for missing service', () => {
      const url = new URL('https://example.com/repo.git/info/refs');
      
      expect(extractGitService(url)).toBe(null);
    });

    test('should return null for empty service', () => {
      const url = new URL('https://example.com/repo.git/info/refs?service=');
      
      expect(extractGitService(url)).toBe(null);
    });

    test('should handle URL with multiple parameters', () => {
      const url = new URL('https://example.com/repo.git/info/refs?other=value&service=git-upload-pack&another=param');
      
      expect(extractGitService(url)).toBe('git-upload-pack');
    });
  });

  describe('isGitCloneRequest()', () => {
    test('should detect clone request with git-upload-pack', () => {
      const url = new URL('https://example.com/repo.git/info/refs?service=git-upload-pack');
      
      expect(isGitCloneRequest(url)).toBe(true);
    });

    test('should NOT detect push request as clone', () => {
      const url = new URL('https://example.com/repo.git/info/refs?service=git-receive-pack');
      
      expect(isGitCloneRequest(url)).toBe(false);
    });

    test('should NOT detect request without service', () => {
      const url = new URL('https://example.com/repo.git/info/refs');
      
      expect(isGitCloneRequest(url)).toBe(false);
    });

    test('should NOT detect invalid service as clone', () => {
      const url = new URL('https://example.com/repo.git/info/refs?service=invalid-service');
      
      expect(isGitCloneRequest(url)).toBe(false);
    });
  });

  describe('isGitPushRequest()', () => {
    test('should detect push request with git-receive-pack', () => {
      const url = new URL('https://example.com/repo.git/info/refs?service=git-receive-pack');
      
      expect(isGitPushRequest(url)).toBe(true);
    });

    test('should NOT detect clone request as push', () => {
      const url = new URL('https://example.com/repo.git/info/refs?service=git-upload-pack');
      
      expect(isGitPushRequest(url)).toBe(false);
    });

    test('should NOT detect request without service', () => {
      const url = new URL('https://example.com/repo.git/info/refs');
      
      expect(isGitPushRequest(url)).toBe(false);
    });

    test('should NOT detect invalid service as push', () => {
      const url = new URL('https://example.com/repo.git/info/refs?service=invalid-service');
      
      expect(isGitPushRequest(url)).toBe(false);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle malformed URLs gracefully', () => {
      // Test with URL that might cause issues
      const request = new Request('https://example.com/malformed?service=git-upload-pack&service=git-receive-pack');
      const url = new URL(request.url);
      
      expect(isGitRequest(request, url)).toBe(true);
      // URL constructor handles multiple same-name parameters by taking the first one
      expect(extractGitService(url)).toBe('git-upload-pack');
    });

    test('should handle URLs with special characters', () => {
      const request = new Request('https://example.com/user%20name/repo%20name.git/info/refs?service=git-upload-pack');
      const url = new URL(request.url);
      
      expect(isGitRequest(request, url)).toBe(true);
      expect(hasGitPath(url)).toBe(true);
      expect(hasGitServiceParameter(url)).toBe(true);
    });

    test('should handle case sensitivity correctly', () => {
      // Service parameters should be case-sensitive
      const url = new URL('https://example.com/repo/info/refs?service=Git-Upload-Pack');
      expect(hasGitServiceParameter(url)).toBe(false);
      
      // Path patterns should be case-sensitive - /Info/Refs won't match /info/refs
      // But this URL still has .git/ so it will be detected anyway
      const url2 = new URL('https://example.com/repo.git/Info/Refs');
      expect(hasGitPath(url2)).toBe(true); // Still true because of .git/
      
      // Test a URL without .git/ to verify case sensitivity of /info/refs
      const url3 = new URL('https://example.com/repo/Info/Refs');
      expect(hasGitPath(url3)).toBe(false); // Should be false - no .git/ and /Info/Refs doesn't match /info/refs
    });

    test('should handle very long URLs', () => {
      const longPath = 'very/'.repeat(100);
      const request = new Request(`https://example.com/${longPath}repo.git/info/refs?service=git-upload-pack`);
      const url = new URL(request.url);
      
      expect(isGitRequest(request, url)).toBe(true);
    });

    test('should handle requests with no headers', () => {
      const request = new Request('https://example.com/repo.git/info/refs');
      const url = new URL(request.url);
      
      expect(hasGitUserAgent(request)).toBe(false);
      expect(isGitRequest(request, url)).toBe(true); // Should still detect via path
    });

    test('should handle empty User-Agent header', () => {
      const request = new Request('https://example.com/', {
        headers: { 'User-Agent': '' }
      });
      
      expect(hasGitUserAgent(request)).toBe(false);
    });

    test('should handle Unicode characters in paths', () => {
      const request = new Request('https://example.com/用户/项目.git/info/refs?service=git-upload-pack');
      const url = new URL(request.url);
      
      expect(isGitRequest(request, url)).toBe(true);
    });
  });

  describe('Integration Tests', () => {
    test('should detect Git request when multiple detection methods match', () => {
      const request = new Request('https://proxy.com/github.com/user/repo.git/info/refs?service=git-upload-pack', {
        headers: { 'User-Agent': 'git/2.39.0' }
      });
      const url = new URL(request.url);
      
      // All three detection methods should work
      expect(hasGitServiceParameter(url)).toBe(true);
      expect(hasGitPath(url)).toBe(true);
      expect(hasGitUserAgent(request)).toBe(true);
      expect(isGitRequest(request, url)).toBe(true);
    });

    test('should detect Git request when only one detection method matches', () => {
      const scenarios = [
        // Only service parameter
        {
          request: new Request('https://example.com/some/path?service=git-upload-pack'),
          description: 'service parameter only'
        },
        // Only path
        {
          request: new Request('https://example.com/repo.git/some-endpoint'),
          description: 'git path only'
        },
        // Only User-Agent
        {
          request: new Request('https://example.com/some/path', {
            headers: { 'User-Agent': 'git/2.39.0' }
          }),
          description: 'git user-agent only'
        }
      ];

      scenarios.forEach(({ request, description }) => {
        const url = new URL(request.url);
        expect(isGitRequest(request, url)).toBe(true);
        console.log(`✅ Git detection working for: ${description}`);
      });
    });

    test('should properly categorize different Git operations', () => {
      const cloneUrl = new URL('https://example.com/repo.git/info/refs?service=git-upload-pack');
      const pushUrl = new URL('https://example.com/repo.git/info/refs?service=git-receive-pack');

      expect(isGitCloneRequest(cloneUrl)).toBe(true);
      expect(isGitPushRequest(cloneUrl)).toBe(false);

      expect(isGitPushRequest(pushUrl)).toBe(true);
      expect(isGitCloneRequest(pushUrl)).toBe(false);
    });
  });
}); 