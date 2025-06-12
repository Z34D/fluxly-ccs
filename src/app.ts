import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { Env } from "./types/env";


// Git request detection functions (based on cors-proxy-main/allow-request.js)
function isPreflightInfoRefs(req: Request, url: URL): boolean {
  return req.method === 'OPTIONS' &&
    url.pathname.endsWith('/info/refs') &&
    (url.searchParams.get('service') === 'git-upload-pack' ||
      url.searchParams.get('service') === 'git-receive-pack');
}

function isInfoRefs(req: Request, url: URL): boolean {
  return req.method === 'GET' &&
    url.pathname.endsWith('/info/refs') &&
    (url.searchParams.get('service') === 'git-upload-pack' ||
      url.searchParams.get('service') === 'git-receive-pack');
}

function isPreflightPull(req: Request, url: URL): boolean {
  const accessControlHeaders = req.headers.get('access-control-request-headers') || '';
  return req.method === 'OPTIONS' &&
    accessControlHeaders.includes('content-type') &&
    url.pathname.endsWith('git-upload-pack');
}

function isPull(req: Request, url: URL): boolean {
  return req.method === 'POST' &&
    req.headers.get('content-type') === 'application/x-git-upload-pack-request' &&
    url.pathname.endsWith('git-upload-pack');
}

function isPreflightPush(req: Request, url: URL): boolean {
  const accessControlHeaders = req.headers.get('access-control-request-headers') || '';
  return req.method === 'OPTIONS' &&
    accessControlHeaders.includes('content-type') &&
    url.pathname.endsWith('git-receive-pack');
}

function isPush(req: Request, url: URL): boolean {
  return req.method === 'POST' &&
    req.headers.get('content-type') === 'application/x-git-receive-pack-request' &&
    url.pathname.endsWith('git-receive-pack');
}

function isGitRequest(req: Request, url: URL): boolean {
  return isPreflightInfoRefs(req, url) ||
    isInfoRefs(req, url) ||
    isPreflightPull(req, url) ||
    isPull(req, url) ||
    isPreflightPush(req, url) ||
    isPush(req, url);
}

// Git-specific CORS headers (based on cors-proxy-main/middleware.js)
const gitAllowHeaders = [
  'accept-encoding',
  'accept-language',
  'accept',
  'access-control-allow-origin',
  'authorization',
  'cache-control',
  'connection',
  'content-length',
  'content-type',
  'dnt',
  'git-protocol',
  'pragma',
  'range',
  'referer',
  'user-agent',
  'x-authorization',
  'x-http-method-override',
  'x-requested-with',
];

const gitExposeHeaders = [
  'accept-ranges',
  'age',
  'cache-control',
  'content-length',
  'content-language',
  'content-type',
  'date',
  'etag',
  'expires',
  'last-modified',
  'location',
  'pragma',
  'server',
  'transfer-encoding',
  'vary',
  'x-github-request-id',
  'x-redirected-url',
];

// CORS configuration restricted to fluxly.app and localhost only
const corsConfig = cors({
  origin: (request: Request): boolean => {
    const origin = request.headers.get('origin');

    // Restricted allowed origins: only fluxly.app and localhost
    const allowedOrigins = [
      'https://fluxly.app',
      'http://fluxly.app',
      'http://localhost:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001'
    ];

    // For Git proxy security: only allow specific origins
    if (!origin) return false; // Reject requests with no origin for security

    return allowedOrigins.includes(origin);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'X-GitHub-Api-Version', // Specific to GitHub/Octokit
    ...gitAllowHeaders // Add Git-specific headers
  ],
  exposeHeaders: [
    'X-RateLimit-Limit',
    'X-RateLimit-Remaining',
    ...gitExposeHeaders // Add Git-specific exposed headers
  ]
});


export const app = (env: Env) => {
  const app = new Elysia({ aot: false })
  app.use(gitCorsProxy)
  app.get("/health", () => ({ status: "ok", service: "git-cors-proxy" }))

  return app;

}

export const gitCorsProxy = new Elysia({ aot: false })
  .use(corsConfig)
  .all("/*", async ({ request, set }) => {
    const url = new URL(request.url);

    // Check if this is a Git request
    if (!isGitRequest(request, url)) {
      set.status = 403;
      return "Forbidden - Not a Git request";
    }

    // Handle CORS preflight for Git operations
    if (request.method === 'OPTIONS') {
      set.status = 200;
      return "";
    }

    // Parse the proxy URL format: /domain.com/path/to/repo
    const path = url.pathname;
    const parts = path.match(/\/([^\/]+)\/(.*)/);

    if (!parts) {
      set.status = 400;
      return "Invalid proxy URL format. Use /domain.com/path/to/repo";
    }

    const [, domain, remainingPath] = parts;

    // Determine protocol (default to https, allow http for localhost/dev)
    const insecureOrigins = (process.env.INSECURE_HTTP_ORIGINS || '').split(',');
    const protocol = insecureOrigins.includes(domain) ? 'http' : 'https';

    // Build the target URL
    const targetUrl = `${protocol}://${domain}/${remainingPath}${url.search}`;

    try {
      // Prepare headers for the proxy request
      const proxyHeaders: Record<string, string> = {};

      // Copy allowed headers
      for (const header of gitAllowHeaders) {
        const value = request.headers.get(header);
        if (value) {
          proxyHeaders[header] = value;
        }
      }

      // Set a proper User-Agent for Git operations
      if (!proxyHeaders['user-agent'] || !proxyHeaders['user-agent'].startsWith('git/')) {
        proxyHeaders['user-agent'] = 'git/@elysia-git/cors-proxy';
      }

      // Make the proxy request
      const response = await fetch(targetUrl, {
        method: request.method,
        headers: proxyHeaders,
        body: (request.method !== 'GET' && request.method !== 'HEAD') ? request.body : undefined,
        redirect: 'manual'
      });

      // Set response status
      set.status = response.status;

      // Copy response headers
      const responseHeaders: Record<string, string> = {};
      for (const header of gitExposeHeaders) {
        const value = response.headers.get(header);
        if (value && header !== 'content-length') { // Skip content-length to avoid conflicts
          responseHeaders[header] = value;
        }
      }

      // Handle redirects by modifying location header
      if (response.headers.has('location')) {
        const newUrl = response.headers.get('location')!.replace(/^https?:\/\//, '/');
        responseHeaders['location'] = newUrl;
      }

      // Add redirect information
      if (response.redirected) {
        responseHeaders['x-redirected-url'] = response.url;
      }

      // Set all response headers
      Object.entries(responseHeaders).forEach(([key, value]) => {
        set.headers[key] = value;
      });

      // Return the response body
      return response.body;

    } catch (error) {
      console.error('Proxy error:', error);
      set.status = 500;
      return "Internal proxy error";
    }
  })

