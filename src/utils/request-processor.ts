/**
 * @fileoverview Request Processing Utilities
 * 
 * Handles header filtering, URL parsing, and proxy request preparation.
 * Contains utilities for processing incoming client requests before forwarding
 * them to upstream Git servers.
 * 
 * @author Fluxly
 * @version 2.0.0
 * @see {@link https://git-scm.com/docs/http-protocol Git HTTP Protocol}
 */

import { ALLOWED_HEADERS, GIT_USER_AGENT } from '../config/constants'

/**
 * Filters and prepares headers for upstream Git server request.
 * Only forwards headers that are in the allowed list.
 * 
 * @param {Request} request - Original client request
 * @returns {Record<string, string>} Filtered headers for upstream request
 */
export function prepareUpstreamHeaders(request: Request): Record<string, string> {
  const headers: Record<string, string> = {}
  
  for (const headerName of ALLOWED_HEADERS) {
    const value = request.headers.get(headerName)
    if (value) {
      headers[headerName] = value
    }
  }

  // GitHub uses user-agent sniffing for git/* and changes its behavior
  if (!headers['user-agent'] || !headers['user-agent'].startsWith('git/')) {
    headers['user-agent'] = GIT_USER_AGENT
  }

  return headers
}

/**
 * Parses proxy URL to extract domain and remaining path.
 * 
 * @param {URL} url - Parsed request URL
 * @returns {{ domain: string; path: string } | null} Parsed URL components or null if invalid
 */
export function parseProxyUrl(url: URL): { domain: string; path: string } | null {
  const parts = url.pathname.match(/\/([^\/]*)\/(.*)/)
  if (!parts) {
    return null
  }

  return {
    domain: parts[1],
    path: parts[2] + url.search
  }
}

/**
 * Constructs target URL for upstream Git server.
 * 
 * @param {string} domain - Target domain (e.g., 'github.com')
 * @param {string} path - Repository path and query parameters
 * @param {string[]} insecureOrigins - Domains that should use HTTP instead of HTTPS
 * @returns {string} Complete target URL for upstream request
 */
export function buildTargetUrl(domain: string, path: string, insecureOrigins: string[]): string {
  const protocol = insecureOrigins.includes(domain) ? 'http' : 'https'
  return `${protocol}://${domain}/${path}`
} 