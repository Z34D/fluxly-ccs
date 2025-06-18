/**
 * @fileoverview CORS Configuration Constants
 * 
 * Contains all CORS-related configuration constants for the Git proxy server.
 * These constants define which headers, methods, and protocols are allowed
 * for cross-origin Git operations.
 * 
 * @author Fluxly
 * @version 2.0.0
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS CORS Documentation}
 */

/**
 * Headers allowed for cross-origin requests (RFC 7231 compliant).
 * Ported directly from cors-proxy-main middleware.js.
 * 
 * @constant {ReadonlyArray<string>}
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers CORS Headers Reference}
 */
export const ALLOWED_HEADERS = [
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
] as const

/**
 * Headers exposed to the client in cross-origin responses.
 * Includes Git-specific headers and standard HTTP cache/metadata headers.
 * 
 * @constant {ReadonlyArray<string>}
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Expose-Headers CORS Expose Headers}
 */
export const EXPOSED_HEADERS = [
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
] as const

/**
 * HTTP methods allowed for cross-origin Git operations.
 * Supports Git's HTTP transport protocol requirements.
 * 
 * @constant {ReadonlyArray<string>}
 * @see {@link https://git-scm.com/docs/http-protocol Git HTTP Protocol}
 */
export const ALLOWED_METHODS = ['POST', 'GET', 'OPTIONS'] as const

/**
 * Standard User-Agent for Git proxy requests.
 * GitHub uses user-agent sniffing for git/* clients.
 * 
 * @constant {string}
 */
export const GIT_USER_AGENT = 'git/@isomorphic-git/cors-proxy' 