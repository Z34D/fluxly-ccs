/**
 * @fileoverview Route handlers for Fluxly-CCS
 * 
 * This module contains HTTP route handlers for non-proxy endpoints including
 * health checks, root information page, CORS preflight, and the universal
 * Git request router.
 * 
 * @author Fluxly
 * @version 2.0.0
 */

import type { Context } from 'hono'
import type { Env } from '../types/environment'
import { DEFAULT_ALLOWED_ORIGINS } from '../config/constants'
import { createHealthResponse } from '../config/server-config'
import {
  isOriginAllowed,
  addCorsHeaders,
  parseAllowedOrigins,
  parseBooleanEnv
} from '../utils/cors-utils'
import { isGitRequest } from '../utils/git-detection'
import { handleGitProxy } from './proxy-handler'

/**
 * Handles health check requests.
 * 
 * Provides a standardized health endpoint for monitoring and
 * service discovery. Returns server status and configuration info.
 * 
 * @param {Context} c - Hono context object
 * @returns {Response} JSON response with health information
 * 
 * @example
 * ```typescript
 * // GET /health
 * const response = await handleHealth(c)
 * // Returns: {
 * //   status: 'healthy',
 * //   service: 'Fluxly-CCS',
 * //   version: '2.0.0-hono',
 * //   framework: 'Hono',
 * //   timestamp: '2024-12-19T00:20:00.000Z'
 * // }
 * ```
 */
export const handleHealth = (c: Context): Response => {
  const env = c.env
  const enableLogging = parseBooleanEnv(env.CORS_ENABLE_LOGGING, false)
  
  if (enableLogging) {
    console.log(`🔍 HEALTH: Health check requested`)
  }
  
  return c.json(createHealthResponse())
}



/**
 * Handles CORS preflight OPTIONS requests.
 * 
 * Processes CORS preflight requests by validating origins
 * and setting appropriate CORS headers for subsequent requests.
 * 
 * @param {Context} c - Hono context object
 * @returns {Response} Empty response with CORS headers
 * 
 * @example
 * ```typescript
 * // OPTIONS /*
 * const response = await handleOptions(c)
 * // Returns: 204 No Content with CORS headers
 * ```
 */
export const handleOptions = (c: Context): Response => {
  const env = c.env
  const enableLogging = parseBooleanEnv(env.CORS_ENABLE_LOGGING, false)
  const allowedOrigins = parseAllowedOrigins(env.ALLOWED_ORIGINS, DEFAULT_ALLOWED_ORIGINS)
  const allowLocalhost = parseBooleanEnv(env.CORS_ALLOW_LOCALHOST, true)
  
  const origin = c.req.header('origin')
  const corsAdded = addCorsHeaders(c, origin, isOriginAllowed(origin, allowedOrigins, allowLocalhost))
  
  if (enableLogging) {
    console.log(`🔍 OPTIONS: Origin "${origin}" - CORS ${corsAdded ? 'ALLOWED' : 'BLOCKED'}`)
  }
  
  c.status(204)
  return c.text('')
}

/**
 * Universal handler for all HTTP methods and routes.
 * 
 * The main request router that:
 * 1. Validates CORS origins and adds headers
 * 2. Detects Git protocol requests
 * 3. Routes Git requests to the proxy handler
 * 4. Returns informational responses for non-Git requests
 * 
 * @param {Context} c - Hono context object
 * @returns {Promise<Response>} Appropriate response based on request type
 * 
 * @example
 * ```typescript
 * // Git request: GET /github.com/user/repo.git/info/refs
 * const response = await handleUniversal(c)
 * // Routes to: handleGitProxy()
 * 
 * // Non-Git request: GET /api/status
 * const response = await handleUniversal(c)
 * // Returns: { message: 'Not a Git request', ... }
 * ```
 */
export const handleUniversal = async (c: Context): Promise<Response> => {
  const env = c.env
  const request = c.req.raw
  const url = new URL(request.url)
  const origin = c.req.header('origin')
  const method = request.method
  const enableLogging = parseBooleanEnv(env.CORS_ENABLE_LOGGING, false)
  
  // Parse CORS configuration
  const allowedOrigins = parseAllowedOrigins(env.ALLOWED_ORIGINS, DEFAULT_ALLOWED_ORIGINS)
  const allowLocalhost = parseBooleanEnv(env.CORS_ALLOW_LOCALHOST, true)
  
  // Always add CORS headers first
  const corsAdded = addCorsHeaders(c, origin, isOriginAllowed(origin, allowedOrigins, allowLocalhost))
  if (!corsAdded) {
    if (enableLogging) {
      console.log(`🚫 ${method}: Origin "${origin}" - BLOCKED`)
    }
    c.status(403)
    return c.json({ error: 'Forbidden - Origin not allowed' })
  }

  // Check if this is a Git request
  if (!isGitRequest(request, url)) {
    if (enableLogging) {
      console.log(`📝 ${method}: ${url.pathname} - Not a Git request`)
    }
    
    // For POST requests to non-Git endpoints, return 403 (more restrictive)
    if (method === 'POST') {
      c.status(403)
      return c.json({ error: 'Forbidden - Not a Git request' })
    }
    
    // For GET and other methods, return informational response
    return c.json({
      message: 'Not a Git request',
      url: request.url,
      method: method,
      isGit: false,
      framework: 'Hono'
    })
  }

  // Log method-specific information for Git requests
  if (enableLogging && method === 'POST') {
    console.log(`🔍 GIT POST: ${url.pathname} - Proxying...`)
  }
  
  // Handle Git proxy request (works for all HTTP methods)
  return handleGitProxy(c, env)
}

/**
 * Creates a CORS error response when origin is not allowed.
 * 
 * @param {Context} c - Hono context object
 * @param {string | undefined} origin - The blocked origin
 * @returns {Response} 403 Forbidden response
 */
export const createCorsErrorResponse = (c: Context, origin: string | undefined): Response => {
  c.status(403)
  return c.json({
    error: 'Forbidden - Origin not allowed',
    origin: origin || 'undefined',
    message: 'This request origin is not in the allowed origins list'
  })
}

/**
 * Creates a non-Git request information response.
 * 
 * @param {Context} c - Hono context object
 * @param {Request} request - The original request
 * @returns {Response} Informational JSON response
 */
export const createNonGitResponse = (c: Context, request: Request): Response => {
  return c.json({
    message: 'Not a Git request',
    url: request.url,
    method: request.method,
    isGit: false,
    framework: 'Hono',
    hint: 'Use URLs like /github.com/user/repo.git/info/refs for Git operations'
  })
}

/**
 * Logs request information for debugging purposes.
 * 
 * @param {string} method - HTTP method
 * @param {string} pathname - Request pathname
 * @param {string | undefined} origin - Request origin
 * @param {string} status - Request status (ALLOWED, BLOCKED, etc.)
 */
export const logRequest = (
  method: string,
  pathname: string,
  origin: string | undefined,
  status: string
): void => {
  const originText = origin || 'no-origin'
  console.log(`🔍 ${method}: ${pathname} - Origin: ${originText} - ${status}`)
} 