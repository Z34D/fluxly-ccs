import { Elysia } from "elysia";
import { Env } from "./types/env";
import { corsOrigin } from "./plugins/cors-origin";
import { corsHeaders } from "./plugins/cors-headers";
import { gitDetection } from "./plugins/git-detection";
import { health } from "./plugins/health";

/**
 * Creates the main Git CORS Proxy application with modular plugin architecture
 * 
 * This application provides a CORS-enabled proxy for Git operations, allowing
 * web applications to interact with Git repositories through HTTP requests.
 * The architecture is built using modular Elysia plugins for maintainability
 * and reusability.
 * 
 * @param env - Environment configuration object
 * @returns Configured Elysia application instance
 * 
 * @example
 * ```typescript
 * import { app } from './app'
 * import { env } from './types/env'
 * 
 * const server = app(env).listen(3000)
 * console.log('Git CORS Proxy running on port 3000')
 * ```
 */
export const app = (env: Env) => {
  // Parse allowed origins from environment or use defaults
  // Note: localhost and 127.0.0.1 (any port) are automatically allowed by corsOrigin plugin
  const allowedOrigins = env.ALLOWED_ORIGINS 
    ? env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
    : []; // No hardcoded defaults - all configured via environment

  // Parse CORS configuration from environment (defaults are set in env parsing)
  const allowLocalhost = env.CORS_ALLOW_LOCALHOST?.toLowerCase() === 'true';
  const enableLogging = env.CORS_ENABLE_LOGGING?.toLowerCase() === 'true';

  // Display server configuration
  console.log(`🦊 Git CORS Proxy Server is running at http://localhost:${env.PORT || 3000}`);
  console.log(`📋 Allowed Origins: ${env.ALLOWED_ORIGINS}`);
  console.log(`🌐 CORS Allow Localhost: ${env.CORS_ALLOW_LOCALHOST}`);
  console.log(`📝 CORS Enable Logging: ${env.CORS_ENABLE_LOGGING}`);

  // Show additional details only if logging is enabled
  if (enableLogging) {
    console.log(`🔧 Debug logging enabled for CORS operations`);
    console.log(`🔒 Insecure HTTP Origins: ${env.INSECURE_HTTP_ORIGINS || 'None'}`);
  }

  /**
   * Prepares headers for proxy requests to Git repositories
   * 
   * @param request - The incoming HTTP request
   * @param allowedHeaders - Array of headers allowed to be forwarded
   * @returns Object containing headers to send to the target repository
   */
  const prepareProxyHeaders = (request: Request, allowedHeaders: string[]): Record<string, string> => {
    const proxyHeaders: Record<string, string> = {};
    
    // Copy allowed headers from the original request
    for (const header of allowedHeaders) {
      const value = request.headers.get(header);
      if (value) {
        proxyHeaders[header] = value;
      }
    }

    // CRITICAL: Ensure Authorization header is forwarded (case-insensitive)
    const authHeader = request.headers.get('Authorization') || request.headers.get('authorization');
    if (authHeader) {
      proxyHeaders['Authorization'] = authHeader;
      if (enableLogging) {
        console.log(`🔐 AUTHORIZATION: Added auth header (${authHeader.substring(0, 15)}...)`);
      }
    }

    // Set proper User-Agent for Git if not already set or not Git-specific
    if (!proxyHeaders['user-agent'] || !proxyHeaders['user-agent'].startsWith('git/')) {
      proxyHeaders['user-agent'] = 'git/@elysia-git/cors-proxy';
    }

    return proxyHeaders;
  };

  /**
   * Handles proxy requests to Git repositories
   * 
   * @param request - The incoming HTTP request
   * @param env - Environment configuration
   * @param set - Elysia response setter
   * @returns Response from the target Git repository
   */
  const handleGitProxy = async (request: Request, env: Env, set: any) => {
    const url = new URL(request.url);
    
    if (enableLogging) {
      console.log(`🔍 GIT REQUEST: ${url.pathname} - Proxying...`);
    }
    
    // Parse proxy URL: /domain.com/path/to/repo
    const path = url.pathname;
    const parts = path.match(/\/([^\/]+)\/(.*)/);
    
    if (!parts) {
      set.status = 400;
      return "Invalid proxy URL format. Use /domain.com/path/to/repo";
    }

    const [, domain, remainingPath] = parts;
    
    // Determine protocol based on insecure origins configuration
    const insecureOrigins = (env.INSECURE_HTTP_ORIGINS || '').split(',');
    const protocol = insecureOrigins.includes(domain) ? 'http' : 'https';
    const targetUrl = `${protocol}://${domain}/${remainingPath}${url.search}`;

    try {
      // Get allowed headers from CORS headers plugin configuration
      const allowedHeaders = [
        'accept-encoding', 'accept-language', 'accept', 'authorization',
        'cache-control', 'connection', 'content-length', 'content-type',
        'git-protocol', 'pragma', 'range', 'referer', 'user-agent'
      ];

      // Prepare headers for proxy request
      const proxyHeaders = prepareProxyHeaders(request, allowedHeaders);

      if (enableLogging) {
        console.log(`🌐 PROXYING: ${targetUrl}`);
      }

      // Make proxy request to target Git repository
      const response = await fetch(targetUrl, {
        method: request.method,
        headers: proxyHeaders,
        body: request.body,
        redirect: 'manual'
      });

      set.status = response.status;

      // Copy relevant response headers
      const responseHeaders: Record<string, string> = {};
      const exposeHeaders = ['content-type', 'content-length', 'cache-control', 'etag', 'location'];
      
      for (const header of exposeHeaders) {
        const value = response.headers.get(header);
        if (value && header !== 'content-length') {
          responseHeaders[header] = value;
        }
      }

      // Handle redirects by converting absolute URLs to relative
      if (response.headers.has('location')) {
        const newUrl = response.headers.get('location')!.replace(/^https?:\/\//, '/');
        responseHeaders['location'] = newUrl;
      }

      // Set response headers
      Object.entries(responseHeaders).forEach(([key, value]) => {
        set.headers[key] = value;
      });

      if (enableLogging) {
        console.log(`✅ PROXY SUCCESS: ${response.status} ${response.statusText}`);
      }
      return response.body;

    } catch (error) {
      console.error('❌ PROXY ERROR:', error);
      set.status = 500;
      return "Internal proxy error";
    }
  };
  
  return new Elysia({ aot: false })
    // Register modular plugins
    .use(corsOrigin({ 
      allowedOrigins, 
      allowLocalhost,
      enableLogging 
    }))
    .use(corsHeaders({ 
      enableLogging
      // No defaultOrigin specified - will use plugin default (*)
    }))
    .use(gitDetection({ 
      enableLogging 
    }))
    .use(health({ 
      enableLogging,
      serviceName: 'Fluxly-CCS',
      version: '1.1.0'
    }))
    
    /**
     * OPTIONS preflight handler - CORS preflight requests
     */
    .options("/*", ({ request, set, addPreflightHeaders, isOriginAllowed }) => {
      const origin = request.headers.get('origin') || undefined;
      const corsAdded = addPreflightHeaders(set, origin, isOriginAllowed);
      if (enableLogging) {
        console.log(`🔍 OPTIONS: Origin "${origin}" - CORS ${corsAdded ? 'ALLOWED' : 'BLOCKED'}`);
      }
      return "";
    })
    
    /**
     * Universal handler - Main proxy functionality for all HTTP methods
     * 
     * Handles GET, POST, PUT, DELETE, PATCH, HEAD, etc. in a single consolidated handler.
     * This approach significantly reduces code duplication while maintaining all functionality.
     * 
     * Features:
     * - CORS validation for all methods
     * - Git request detection for all methods  
     * - Method-specific logging and error handling
     * - Unified proxy logic for all Git operations
     */
    .all("/*", async ({ request, set, addCorsHeaders, isOriginAllowed, isGitRequest }) => {
      const url = new URL(request.url);
      const origin = request.headers.get('origin') || undefined;
      const method = request.method;
      
      // Always add CORS headers first
      const corsAdded = addCorsHeaders(set, origin, isOriginAllowed);
      if (!corsAdded) {
        if (enableLogging) {
          console.log(`🚫 ${method}: Origin "${origin}" - BLOCKED`);
        }
        set.status = 403;
        return "Forbidden - Origin not allowed";
      }

      // Check if this is a Git request using the plugin
      if (!isGitRequest(request, url)) {
        if (enableLogging) {
          console.log(`📝 ${method}: ${url.pathname} - Not a Git request`);
        }
        
        // For POST requests to non-Git endpoints, return 403 (more restrictive)
        if (method === 'POST') {
          set.status = 403;
          return "Forbidden - Not a Git request";
        }
        
        // For GET and other methods, return informational response
        return {
          message: "Not a Git request",
          url: request.url,
          method: method,
          isGit: false,
          architecture: "modular-plugins"
        };
      }

      // Log method-specific information for Git requests
      if (enableLogging && method === 'POST') {
        console.log(`🔍 GIT POST: ${url.pathname} - Proxying...`);
      }
      
      // Handle Git proxy request (works for all HTTP methods)
      return handleGitProxy(request, env, set);
    });
};
