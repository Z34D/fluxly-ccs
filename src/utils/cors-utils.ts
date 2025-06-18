/**
 * @fileoverview CORS Utilities
 * 
 * Utilities for Cross-Origin Resource Sharing (CORS) operations.
 * Handles preflight requests and response header management for Git proxy operations.
 * 
 * @author Fluxly
 * @version 2.0.0
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS CORS Documentation}
 */

import { ALLOWED_HEADERS, EXPOSED_HEADERS, ALLOWED_METHODS } from '../config/constants'

/**
 * Creates CORS preflight response headers.
 * 
 * @param {string} origin - Allowed origin for CORS
 * @returns {Headers} Headers object with CORS preflight configuration
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS CORS Documentation}
 */
export function createPreflightHeaders(origin: string): Headers {
  return new Headers({
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': ALLOWED_METHODS.join(', '),
    'Access-Control-Allow-Headers': ALLOWED_HEADERS.join(', '),
    'Access-Control-Expose-Headers': EXPOSED_HEADERS.join(', '),
    'Access-Control-Allow-Credentials': 'false'
  })
}

/**
 * Adds CORS headers to an existing Headers object.
 * 
 * @param {Headers} headers - Headers object to modify
 * @param {string} origin - Allowed origin for CORS
 * @returns {void}
 */
export function addCorsHeaders(headers: Headers, origin: string): void {
  headers.set('Access-Control-Allow-Origin', origin)
  headers.set('Access-Control-Allow-Methods', ALLOWED_METHODS.join(', '))
  headers.set('Access-Control-Allow-Headers', ALLOWED_HEADERS.join(', '))
  headers.set('Access-Control-Expose-Headers', EXPOSED_HEADERS.join(', '))
  headers.set('Access-Control-Allow-Credentials', 'false')
} 