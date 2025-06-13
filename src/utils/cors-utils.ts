/**
 * @fileoverview CORS utilities for Fluxly-CCS
 * 
 * This module provides functions for Cross-Origin Resource Sharing (CORS) validation,
 * origin checking, and header management. It handles security policies for web clients
 * accessing Git repositories through the proxy.
 * 
 * @author Fluxly
 * @version 2.0.0
 */

import type { Context } from 'hono'
import { CORS_CONFIG } from '../config/constants'

/**
 * Validates whether a given origin is allowed to make CORS requests.
 * 
 * Checks the origin against a list of allowed origins and optionally
 * allows localhost/127.0.0.1 addresses for development. Requests with
 * no origin header (same-origin requests) are always allowed.
 * 
 * @param {string | undefined} origin - The origin header from the request
 * @param {string[]} allowedOrigins - Array of explicitly allowed origin URLs
 * @param {boolean} [allowLocalhost=true] - Whether to allow localhost origins
 * @returns {boolean} True if the origin is allowed, false otherwise
 * 
 * @example
 * ```typescript
 * const allowed = isOriginAllowed(
 *   'https://fluxly.app',
 *   ['https://fluxly.app', 'https://app.fluxly.com'],
 *   true
 * )
 * // Returns: true
 * ```
 * 
 * @example
 * ```typescript
 * // Same-origin request (no origin header)
 * const allowed = isOriginAllowed(undefined, ['https://fluxly.app'])
 * // Returns: true
 * ```
 */
export const isOriginAllowed = (
  origin: string | undefined, 
  allowedOrigins: string[], 
  allowLocalhost: boolean = true
): boolean => {
  // No origin header means same-origin request (always allowed)
  if (!origin) {
    return true
  }

  try {
    const url = new URL(origin)
    
    // Check localhost and 127.0.0.1 addresses if enabled
    if (allowLocalhost && (url.hostname === 'localhost' || url.hostname === '127.0.0.1')) {
      return true
    }
    
    // Check against explicit allowed origins
    return allowedOrigins.includes(origin)
    
  } catch (error) {
    // Invalid URL format - reject the request
    return false
  }
}

/**
 * Adds appropriate CORS headers to the response.
 * 
 * Sets the necessary CORS headers based on whether the origin is allowed.
 * Includes Access-Control-Allow-Origin, methods, headers, exposed headers,
 * and cache control for preflight requests.
 * 
 * @param {Context} c - The Hono context object
 * @param {string | undefined} origin - The origin header from the request
 * @param {boolean} isAllowed - Whether the origin is allowed (from isOriginAllowed)
 * @returns {boolean} Returns the isAllowed parameter for chaining
 * 
 * @example
 * ```typescript
 * const corsAdded = addCorsHeaders(c, 'https://fluxly.app', true)
 * if (!corsAdded) {
 *   return c.json({ error: 'Forbidden' }, 403)
 * }
 * ```
 */
export const addCorsHeaders = (
  c: Context, 
  origin: string | undefined, 
  isAllowed: boolean
): boolean => {
  // Set Access-Control-Allow-Origin header
  if (isAllowed && origin) {
    c.header('access-control-allow-origin', origin)
  } else if (isAllowed && !origin) {
    // Same-origin request - allow all origins
    c.header('access-control-allow-origin', '*')
  }
  
  // Set standard CORS headers for all responses
  c.header('access-control-allow-methods', CORS_CONFIG.ALLOWED_METHODS)
  c.header('access-control-allow-headers', CORS_CONFIG.ALLOWED_HEADERS)
  c.header('access-control-expose-headers', 'content-type, content-length, cache-control, etag, location')
  c.header('access-control-max-age', CORS_CONFIG.MAX_AGE)
  
  return isAllowed
}

/**
 * Parses environment origins configuration into an array.
 * 
 * Takes a comma-separated string of origins from environment variables
 * and returns a cleaned array of origin URLs.
 * 
 * @param {string | undefined} originsConfig - Comma-separated origins string
 * @param {string[]} defaultOrigins - Default origins if config is empty
 * @returns {string[]} Array of allowed origin URLs
 * 
 * @example
 * ```typescript
 * const origins = parseAllowedOrigins(
 *   'https://fluxly.app, https://app.fluxly.com',
 *   ['https://fluxly.app']
 * )
 * // Returns: ['https://fluxly.app', 'https://app.fluxly.com']
 * ```
 */
export const parseAllowedOrigins = (
  originsConfig: string | undefined,
  defaultOrigins: readonly string[]
): string[] => {
  if (!originsConfig) {
    return [...defaultOrigins]
  }
  
  return originsConfig
    .split(',')
    .map((origin: string) => origin.trim())
    .filter(origin => origin.length > 0)
}

/**
 * Parses boolean environment variable values.
 * 
 * Converts string environment variables to boolean values,
 * with support for common true/false representations.
 * 
 * @param {string | undefined} value - The environment variable value
 * @param {boolean} defaultValue - Default value if undefined or invalid
 * @returns {boolean} Parsed boolean value
 * 
 * @example
 * ```typescript
 * const allowLocalhost = parseBooleanEnv('true', false)
 * // Returns: true
 * 
 * const enableLogging = parseBooleanEnv('false', true)
 * // Returns: false
 * ```
 */
export const parseBooleanEnv = (
  value: string | undefined,
  defaultValue: boolean
): boolean => {
  if (!value) {
    return defaultValue
  }
  
  const lowerValue = value.toLowerCase()
  return lowerValue === 'true' || lowerValue === '1' || lowerValue === 'yes'
} 