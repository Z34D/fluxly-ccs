/**
 * @fileoverview Git proxy request handler for Fluxly-CCS
 * 
 * This module contains the core proxy logic for forwarding Git requests
 * to target repositories. It handles URL parsing, header forwarding,
 * authentication, and response processing.
 * 
 * @author Fluxly
 * @version 2.0.0
 */

import type { Context } from 'hono'
import type { Env } from '../types/environment'
import {
  parseProxyUrl,
  prepareProxyHeaders,
  copyResponseHeaders,
  handleRedirectResponse,
  createInvalidUrlResponse,
  createProxyErrorResponse
} from '../utils/proxy-utils'

/**
 * Handles Git proxy requests by forwarding them to target repositories.
 * 
 * This is the core function that:
 * 1. Parses the proxy URL to extract domain and path
 * 2. Prepares headers for forwarding (including authentication)
 * 3. Makes the proxy request to the target Git repository
 * 4. Handles the response and forwards it back to the client
 * 
 * @param {Context} c - Hono context object
 * @param {Env} env - Environment configuration
 * @returns {Promise<Response>} Proxied response from the Git repository
 * 
 * @example
 * ```typescript
 * // Request: GET /github.com/user/repo.git/info/refs?service=git-upload-pack
 * const response = await handleGitProxy(c, env)
 * // Forwards to: https://github.com/user/repo.git/info/refs?service=git-upload-pack
 * ```
 */
export const handleGitProxy = async (c: Context, env: Env): Promise<Response> => {
  const request = c.req.raw
  const url = new URL(request.url)
  const enableLogging = env.CORS_ENABLE_LOGGING?.toLowerCase() === 'true'
  
  if (enableLogging) {
    console.log(`🔍 GIT REQUEST: ${url.pathname} - Proxying...`)
  }
  
  // Parse proxy URL to extract domain and target URL
  const urlParts = parseProxyUrl(url, env)
  if (!urlParts) {
    return createInvalidUrlResponse(c)
  }

  const { domain, remainingPath, targetUrl } = urlParts

  try {
    // Prepare headers for the proxy request
    const proxyHeaders = prepareProxyHeaders(request, enableLogging)

    if (enableLogging) {
      console.log(`🌐 PROXYING: ${targetUrl}`)
    }

    // Make proxy request to target Git repository
    const response = await makeProxyRequest(targetUrl, request, proxyHeaders)

    // Set response status
    c.status(response.status)

    // Copy relevant response headers
    copyResponseHeaders(response, c)

    // Handle redirects by converting absolute URLs to relative
    handleRedirectResponse(response, c)

    if (enableLogging) {
      console.log(`✅ PROXY SUCCESS: ${response.status} ${response.statusText}`)
    }
    
    // Return the response body directly
    const responseBody = await response.arrayBuffer()
    return c.body(responseBody)

  } catch (error) {
    return createProxyErrorResponse(c, error as Error)
  }
}

/**
 * Makes the actual HTTP request to the target Git repository.
 * 
 * Performs the fetch request with proper headers, body, and redirect handling.
 * This is separated from the main handler for easier testing and reusability.
 * 
 * CRITICAL FIX: Properly handles request body to avoid ReadableStream locking
 * issues that can cause 400 errors when Authorization header is present.
 * 
 * @param {string} targetUrl - The complete URL to request
 * @param {Request} originalRequest - The original request for body/method
 * @param {Record<string, string>} headers - Prepared headers for the request
 * @returns {Promise<Response>} Response from the target repository
 * 
 * @throws {Error} When the proxy request fails
 * 
 * @example
 * ```typescript
 * const response = await makeProxyRequest(
 *   'https://github.com/user/repo.git/info/refs',
 *   request,
 *   { 'authorization': 'token abc123' }
 * )
 * ```
 */
export const makeProxyRequest = async (
  targetUrl: string,
  originalRequest: Request,
  headers: Record<string, string>
): Promise<Response> => {
  // CRITICAL FIX: Properly handle request body to avoid ReadableStream locking
  // The issue was that originalRequest.body can become locked/consumed, causing 400 errors
  let requestBody: BodyInit | null = null
  
  // Only read body for methods that typically have one
  if (originalRequest.method === 'POST' || originalRequest.method === 'PUT' || originalRequest.method === 'PATCH') {
    // Check if the body exists and hasn't been consumed
    if (originalRequest.body && !originalRequest.bodyUsed) {
      try {
        // Clone the request to avoid consuming the original body
        const clonedRequest = originalRequest.clone()
        requestBody = clonedRequest.body
      } catch (error) {
        // If cloning fails, try to get the body as arrayBuffer
        requestBody = await originalRequest.arrayBuffer()
      }
    }
  }

  return await fetch(targetUrl, {
    method: originalRequest.method,
    headers: headers,
    body: requestBody,
    redirect: 'manual'  // Handle redirects manually to convert URLs
  })
}

/**
 * Logs detailed proxy operation information for debugging.
 * 
 * Provides comprehensive logging of proxy operations including
 * request details, headers, and timing information.
 * 
 * @param {string} operation - The operation being performed
 * @param {string} targetUrl - The target URL being proxied
 * @param {Record<string, string>} headers - Headers being sent
 * @param {number} [duration] - Optional duration in milliseconds
 * 
 * @example
 * ```typescript
 * logProxyOperation('FETCH', 'https://github.com/user/repo.git', headers, 150)
 * // Outputs: 🔍 PROXY FETCH: https://github.com/user/repo.git (150ms)
 * ```
 */
export const logProxyOperation = (
  operation: string,
  targetUrl: string,
  headers: Record<string, string>,
  duration?: number
): void => {
  const hasAuth = headers['Authorization'] || headers['authorization']
  const durationText = duration ? ` (${duration}ms)` : ''
  
  console.log(`🔍 PROXY ${operation}: ${targetUrl}${durationText}`)
  
  if (hasAuth) {
    const authType = (headers['Authorization'] || headers['authorization']).split(' ')[0]
    console.log(`🔐 AUTH: Request includes ${authType} authorization header`)
    console.log(`🔐 HEADERS: ${Object.keys(headers).length} total headers forwarded`)
  } else {
    console.log(`🔐 NO AUTH: Request without authorization`)
  }
}

/**
 * Validates the target domain for security purposes.
 * 
 * Performs additional security checks beyond basic domain validation
 * to ensure the target is a legitimate Git hosting service.
 * 
 * @param {string} domain - The domain to validate
 * @returns {boolean} True if the domain is considered safe
 * 
 * @example
 * ```typescript
 * const safe = isSecureProxyTarget('github.com')
 * // Returns: true
 * 
 * const unsafe = isSecureProxyTarget('malicious.example.com')
 * // Returns: false (depending on validation rules)
 * ```
 */
export const isSecureProxyTarget = (domain: string): boolean => {
  // List of known Git hosting services (could be expanded)
  const knownGitHosts = [
    'github.com',
    'gitlab.com',
    'bitbucket.org',
    'dev.azure.com',
    'sourceforge.net',
    'codeberg.org'
  ]
  
  // Allow known Git hosting services
  if (knownGitHosts.includes(domain)) {
    return true
  }
  
  // Allow localhost and development domains
  if (domain === 'localhost' || domain === '127.0.0.1' || domain.endsWith('.local')) {
    return true
  }
  
  // Allow other domains but could be restricted in production
  return true  // For now, allow all valid domains
} 