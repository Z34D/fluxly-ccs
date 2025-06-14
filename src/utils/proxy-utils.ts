/**
 * @fileoverview Proxy utilities for Fluxly-CCS
 * 
 * This module provides functions for parsing proxy URLs, manipulating headers,
 * and handling the core proxy logic for forwarding Git requests to target
 * repositories.
 * 
 * @author Fluxly
 * @version 2.0.0
 */

import { ALLOWED_PROXY_HEADERS, EXPOSED_CORS_HEADERS, DEFAULT_GIT_USER_AGENT } from '../config/constants'
import type { Env } from '../types/environment'

/**
 * Result of parsing a proxy URL.
 * 
 * @interface ProxyUrlParts
 */
export interface ProxyUrlParts {
  /** The target domain (e.g., 'github.com') */
  domain: string
  /** The remaining path after the domain */
  remainingPath: string
  /** The complete target URL with protocol */
  targetUrl: string
}

/**
 * Parses a proxy URL to extract domain and path components.
 * 
 * Expected URL format: /domain.com/path/to/repo
 * Example: /github.com/user/repo.git/info/refs
 * 
 * @param {URL} url - The parsed URL object from the request
 * @param {Env} env - Environment configuration for protocol selection
 * @returns {ProxyUrlParts | null} Parsed URL components or null if invalid
 * 
 * @example
 * ```typescript
 * const url = new URL('https://proxy.com/github.com/user/repo.git/info/refs?service=git-upload-pack')
 * const parts = parseProxyUrl(url, env)
 * // Returns: {
 * //   domain: 'github.com',
 * //   remainingPath: 'user/repo.git/info/refs',
 * //   targetUrl: 'https://github.com/user/repo.git/info/refs?service=git-upload-pack'
 * // }
 * ```
 */
export const parseProxyUrl = (url: URL, env: Env): ProxyUrlParts | null => {
  const path = url.pathname
  const enableLogging = env.CORS_ENABLE_LOGGING?.toLowerCase() === 'true'
  
  if (enableLogging) {
    console.log(`🔍 PARSING URL: ${path}`)
  }
  
  const parts = path.match(/\/([^\/]+)\/(.*)/)
  
  if (!parts) {
    if (enableLogging) {
      console.log(`❌ URL PARSE FAILED: "${path}" does not match expected pattern /domain/path`)
      console.log(`❌ Expected format: /github.com/user/repo.git/info/refs`)
    }
    return null
  }

  const [, domain, remainingPath] = parts
  
  if (enableLogging) {
    console.log(`✅ URL PARSED: domain="${domain}", path="${remainingPath}"`)
  }
  
  // Determine protocol based on insecure origins configuration
  const insecureOrigins = (env.INSECURE_HTTP_ORIGINS || '').split(',')
  const protocol = insecureOrigins.includes(domain) ? 'http' : 'https'
  const targetUrl = `${protocol}://${domain}/${remainingPath}${url.search}`

  if (enableLogging) {
    console.log(`🌐 TARGET URL: ${targetUrl}`)
  }

  return {
    domain,
    remainingPath,
    targetUrl
  }
}

/**
 * Prepares headers for forwarding to the target Git repository.
 * 
 * Filters and copies allowed headers from the original request,
 * handles authentication headers, and sets appropriate User-Agent.
 * 
 * @param {Request} request - The original HTTP request
 * @param {boolean} enableLogging - Whether to log header operations
 * @returns {Record<string, string>} Headers ready for proxy request
 * 
 * @example
 * ```typescript
 * const headers = prepareProxyHeaders(request, true)
 * // Returns: { 'authorization': 'token abc123', 'user-agent': 'git/2.39.0', ... }
 * ```
 */
export const prepareProxyHeaders = (
  request: Request, 
  enableLogging: boolean = false
): Record<string, string> => {
  const proxyHeaders: Record<string, string> = {}
  
  // Copy allowed headers from the original request
  for (const header of ALLOWED_PROXY_HEADERS) {
    const value = request.headers.get(header)
    if (value) {
      proxyHeaders[header] = value
    }
  }

  // CRITICAL: Ensure Authorization header is forwarded (case-insensitive)
  const authHeader = request.headers.get('Authorization') || request.headers.get('authorization')
  if (authHeader) {
    proxyHeaders['Authorization'] = authHeader
    if (enableLogging) {
      console.log(`🔐 AUTHORIZATION: Added auth header (${authHeader.substring(0, 15)}...)`)
      console.log(`🔐 AUTH TYPE: ${authHeader.split(' ')[0]} authentication detected`)
    }
  } else if (enableLogging) {
    console.log(`🔐 NO AUTH: No authorization header found in request`)
  }

  // Set proper User-Agent for Git if not already set or not Git-specific
  if (!proxyHeaders['user-agent'] || !proxyHeaders['user-agent'].startsWith('git/')) {
    proxyHeaders['user-agent'] = DEFAULT_GIT_USER_AGENT
  }

  return proxyHeaders
}

/**
 * Copies relevant response headers from target to proxy response.
 * 
 * Filters and copies headers that should be forwarded back to the client,
 * excluding headers that might interfere with CORS or proxy operation.
 * 
 * @param {Response} targetResponse - Response from the target Git repository
 * @param {any} proxyContext - Hono context for setting headers
 * 
 * @example
 * ```typescript
 * copyResponseHeaders(gitResponse, c)
 * // Copies content-type, cache-control, etag, etc.
 * ```
 */
export const copyResponseHeaders = (targetResponse: Response, proxyContext: any): void => {
  // Copy relevant response headers
  for (const header of EXPOSED_CORS_HEADERS) {
    const value = targetResponse.headers.get(header)
    if (value && header !== 'content-length') {
      proxyContext.header(header, value)
    }
  }
}

/**
 * Handles redirect responses by converting absolute URLs to relative.
 * 
 * Git repositories sometimes return redirects with absolute URLs.
 * These need to be converted to relative URLs to maintain proxy routing.
 * 
 * @param {Response} targetResponse - Response from the target Git repository
 * @param {any} proxyContext - Hono context for setting headers
 * 
 * @example
 * ```typescript
 * handleRedirectResponse(response, c)
 * // Converts 'https://github.com/...' to '/github.com/...'
 * ```
 */
export const handleRedirectResponse = (targetResponse: Response, proxyContext: any): void => {
  if (targetResponse.headers.has('location')) {
    const location = targetResponse.headers.get('location')!
    const newUrl = location.replace(/^https?:\/\//, '/')
    proxyContext.header('location', newUrl)
  }
}

/**
 * Validates that a domain is safe for proxying.
 * 
 * Performs basic validation to ensure the domain appears to be
 * a legitimate Git hosting service or repository.
 * 
 * @param {string} domain - The domain to validate
 * @returns {boolean} True if the domain appears safe to proxy
 * 
 * @example
 * ```typescript
 * const safe = validateProxyDomain('github.com')
 * // Returns: true
 * 
 * const unsafe = validateProxyDomain('localhost')
 * // Returns: false (depending on configuration)
 * ```
 */
export const validateProxyDomain = (domain: string): boolean => {
  // Basic domain validation
  if (!domain || domain.length === 0) {
    return false
  }
  
  // Check for valid domain characters
  const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9\-]*[a-zA-Z0-9]*\.([a-zA-Z]{2,}|[a-zA-Z0-9\-]*[a-zA-Z0-9])$/
  
  // Allow localhost and IP addresses for development
  if (domain === 'localhost' || domain === '127.0.0.1' || /^\d+\.\d+\.\d+\.\d+$/.test(domain)) {
    return true
  }
  
  return domainRegex.test(domain)
}

/**
 * Creates an error response for invalid proxy URLs.
 * 
 * @param {any} context - Hono context for creating response
 * @returns {Response} Error response with usage instructions
 */
export const createInvalidUrlResponse = (context: any): Response => {
  const requestUrl = context.req.raw.url
  const url = new URL(requestUrl)
  
  console.log(`❌ INVALID URL: ${url.pathname}`)
  console.log(`❌ Full URL: ${requestUrl}`)
  console.log(`❌ Expected format: /github.com/user/repo.git/info/refs`)
  
  context.status(400)
  return context.text(`Invalid proxy URL format. Got: "${url.pathname}". Expected: /domain.com/path/to/repo`)
}

/**
 * Creates an error response for proxy request failures.
 * 
 * @param {any} context - Hono context for creating response
 * @param {Error} error - The error that occurred
 * @returns {Response} Error response
 */
export const createProxyErrorResponse = (context: any, error: Error): Response => {
  console.error('❌ PROXY ERROR:', error)
  context.status(500)
  return context.text("Internal proxy error")
} 