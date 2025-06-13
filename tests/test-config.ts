// Test configuration for Git CORS Proxy tests
export const TEST_CONFIG = {
  // Test server configuration
  SERVER: {
    PORT: 3001,
    BASE_URL: "http://localhost:3001",
    ALLOWED_ORIGINS: "http://localhost:3001,https://fluxly.app"
  },
  
  // Test repositories
  REPOSITORIES: {
    PUBLIC: "Z34D/fluxly-ccs",
    PRIVATE: "Z34D/fluxly-login"
  },
  
  // GitHub configuration
  GITHUB: {
    DOMAIN: "github.com",
    API_BASE: "https://api.github.com"
  },
  
  // Test timeouts and delays
  TIMEOUTS: {
    SERVER_START: 100,
    HTTP_REQUEST: 5000
  },
  
  // Expected response patterns
  PATTERNS: {
    GIT_UPLOAD_PACK: /^[0-9a-f]{4}# service=git-upload-pack/,
    GIT_SERVICE_HEADER: "# service=git-upload-pack",
    REFS_HEADER: "refs/heads/"
  },
  
  // HTTP status codes for different scenarios
  STATUS_CODES: {
    SUCCESS: 200,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    INTERNAL_ERROR: 500
  }
};

// Environment variable helpers
export const getGitHubToken = (): string | undefined => {
  return process.env.GITHUB_TOKEN;
};

export const hasGitHubToken = (): boolean => {
  return !!getGitHubToken();
};

// Common headers for different request types
export const HEADERS = {
  CORS_PREFLIGHT: {
    "Origin": TEST_CONFIG.SERVER.BASE_URL,
    "Access-Control-Request-Method": "GET",
    "Access-Control-Request-Headers": "authorization"
  },
  
  GIT_CLIENT: {
    "Origin": TEST_CONFIG.SERVER.BASE_URL,
    "User-Agent": "git/2.34.1"
  },
  
  AUTHENTICATED_GIT: (token: string) => ({
    "Origin": TEST_CONFIG.SERVER.BASE_URL,
    "Authorization": `token ${token}`,
    "User-Agent": "git/2.34.1"
  }),
  
  BEARER_AUTH: (token: string) => ({
    "Origin": TEST_CONFIG.SERVER.BASE_URL,
    "Authorization": `Bearer ${token}`,
    "User-Agent": "git/2.34.1"
  }),
  
  MALICIOUS_ORIGIN: {
    "Origin": "https://malicious-site.com"
  }
};

// Test URL builders
export const buildTestUrls = (baseUrl: string) => ({
  root: () => `${baseUrl}/`,
  test: () => `${baseUrl}/test`,
  publicRepoInfoRefs: (service: string = "git-upload-pack") => 
    `${baseUrl}/${TEST_CONFIG.GITHUB.DOMAIN}/${TEST_CONFIG.REPOSITORIES.PUBLIC}.git/info/refs?service=${service}`,
  privateRepoInfoRefs: (service: string = "git-upload-pack") => 
    `${baseUrl}/${TEST_CONFIG.GITHUB.DOMAIN}/${TEST_CONFIG.REPOSITORIES.PRIVATE}.git/info/refs?service=${service}`,
  publicRepoUploadPack: () => 
    `${baseUrl}/${TEST_CONFIG.GITHUB.DOMAIN}/${TEST_CONFIG.REPOSITORIES.PUBLIC}.git/git-upload-pack`,
  invalidFormat: () => `${baseUrl}/invalid-url-format`,
  nonExistentRepo: () => 
    `${baseUrl}/${TEST_CONFIG.GITHUB.DOMAIN}/nonexistent/repository.git/info/refs?service=git-upload-pack`,
  invalidDomain: () => 
    `${baseUrl}/invalid-domain-that-does-not-exist.com/repo.git/info/refs?service=git-upload-pack`,
  nonGitRequest: () => `${baseUrl}/${TEST_CONFIG.GITHUB.DOMAIN}/not-a-git-request`,
  nonGitPost: () => `${baseUrl}/${TEST_CONFIG.GITHUB.DOMAIN}/not-git-post`
}); 