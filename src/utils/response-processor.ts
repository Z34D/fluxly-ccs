/**
 * @fileoverview Response Processing Utilities
 * 
 * Handles upstream response processing and header management.
 * Contains utilities for processing responses from upstream Git servers
 * before returning them to clients.
 * 
 * @author Fluxly
 * @version 2.0.0
 * @see {@link https://git-scm.com/docs/http-protocol Git HTTP Protocol}
 */

import { EXPOSED_HEADERS } from '../config/constants'
import { addCorsHeaders } from './cors-utils'

/**
 * Processes upstream response headers for client.
 * Copies allowed headers and modifies location headers for proxy transparency.
 * 
 * @param {Response} upstreamResponse - Response from upstream Git server
 * @param {string} origin - CORS origin to set
 * @returns {Headers} Processed headers for client response
 */
export function processResponseHeaders(upstreamResponse: Response, origin: string): Headers {
  const responseHeaders = new Headers()
  
  // Set CORS headers
  addCorsHeaders(responseHeaders, origin)

  // Copy allowed response headers (exclude content-length as it's handled automatically)
  for (const headerName of EXPOSED_HEADERS) {
    if (headerName === 'content-length') continue
    
    const value = upstreamResponse.headers.get(headerName)
    if (value) {
      responseHeaders.set(headerName, value)
    }
  }

  // Handle location header modification for proxy transparency
  const location = upstreamResponse.headers.get('location')
  if (location) {
    const newUrl = location.replace(/^https?:\//, '')
    responseHeaders.set('location', newUrl)
  }

  // Add x-redirected-url if the upstream response was redirected
  if (upstreamResponse.redirected) {
    responseHeaders.set('x-redirected-url', upstreamResponse.url)
  }

  return responseHeaders
} 