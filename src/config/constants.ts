/**
 * @fileoverview Constants and configuration values for Fluxly-CCS
 * 
 * This module defines constant values used throughout the application for
 * Git protocol detection, CORS headers, and proxy configuration.
 * 
 * @author Fluxly
 * @version 2.0.0
 */

/**
 * Standard Git services supported by the proxy.
 * 
 * These service names are used in Git protocol requests to identify
 * the type of operation being performed.
 * 
 * @constant {readonly string[]}
 */
export const GIT_SERVICES = [
  'git-upload-pack',    // Git fetch/clone operations
  'git-receive-pack'    // Git push operations
] as const

/**
 * Standard Git-specific URL paths that indicate Git requests.
 * 
 * These path patterns are used to detect Git protocol requests
 * even when service parameters are not present.
 * 
 * @constant {readonly string[]}
 */
export const GIT_PATHS = [
  '/info/refs',         // Git info/refs endpoint
  '.git/'              // Any path containing .git/
] as const

/**
 * User-Agent prefixes that indicate Git client requests.
 * 
 * Git clients typically identify themselves with specific User-Agent headers.
 * This helps distinguish Git requests from regular web browser requests.
 * 
 * @constant {readonly string[]}
 */
export const GIT_USER_AGENTS = [
  'git/'               // Standard Git client User-Agent prefix
] as const

/**
 * HTTP headers that are allowed to be forwarded in proxy requests.
 * 
 * These headers are considered safe to forward from the client to the
 * target Git repository, including authentication and Git protocol headers.
 * 
 * @constant {readonly string[]}
 */
export const ALLOWED_PROXY_HEADERS = [
  'accept-encoding',
  'accept-language', 
  'accept',
  'authorization',      // Critical for authenticated Git operations
  'cache-control',
  'connection',
  'content-length',
  'content-type',
  'git-protocol',       // Git-specific protocol header
  'pragma',
  'range',
  'referer',
  'user-agent'
] as const

/**
 * HTTP headers that should be exposed in CORS responses.
 * 
 * These headers are made available to the client JavaScript through
 * the Access-Control-Expose-Headers mechanism.
 * 
 * @constant {readonly string[]}
 */
export const EXPOSED_CORS_HEADERS = [
  'content-type',
  'content-length',
  'cache-control',
  'etag',
  'location'           // Important for Git redirect handling
] as const

/**
 * Default User-Agent string for proxy requests when none is provided.
 * 
 * Used when the client doesn't provide a Git-specific User-Agent or
 * when we need to ensure the target server recognizes this as a Git request.
 * 
 * @constant {string}
 */
export const DEFAULT_GIT_USER_AGENT = 'git/@hono-git/cors-proxy'

/**
 * Default allowed origins when none are specified in environment.
 * 
 * @constant {readonly string[]}
 */
export const DEFAULT_ALLOWED_ORIGINS = [
  'https://fluxly.app'
] as const

/**
 * CORS configuration constants.
 * 
 * @constant {object}
 */
export const CORS_CONFIG = {
  /** CORS methods allowed for Git operations */
  ALLOWED_METHODS: 'GET, POST, OPTIONS',
  
  /** CORS headers that clients are allowed to send */
  ALLOWED_HEADERS: 'accept-encoding, accept-language, accept, authorization, cache-control, content-length, content-type, git-protocol, pragma, range, referer, user-agent',
  
  /** Maximum age for CORS preflight cache (24 hours) */
  MAX_AGE: '86400'
} as const 