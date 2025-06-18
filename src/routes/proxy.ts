/**
 * @fileoverview Git Proxy Routes
 * 
 * Dedicated Git proxy endpoints following Hono best practices.
 * Handles CORS preflight and Git HTTP protocol requests.
 * Excludes root and health endpoints.
 * 
 * @author Fluxly
 * @version 2.0.0
 * @see {@link https://hono.dev/docs/guides/best-practices Hono Best Practices}
 * @see {@link https://git-scm.com/docs/http-protocol Git HTTP Protocol}
 */

import { Hono } from 'hono'
import type { Context } from 'hono'
import type { Env } from '../types/environment'
import { isValidGitRequest } from '../utils/git-detection'
import { createPreflightHeaders } from '../utils/cors-utils'
import { parseProxyUrl, buildTargetUrl, prepareUpstreamHeaders } from '../utils/request-processor'
import { processResponseHeaders } from '../utils/response-processor'

const app = new Hono<{ Bindings: Env }>()

/**
 * CORS preflight handler for Git requests (OPTIONS /*)
 * Handles preflight requests with appropriate CORS headers.
 * Excludes root and health endpoints.
 * 
 * @route OPTIONS /*
 * @param {Context<{ Bindings: Env }>} c - Hono context object
 * @returns {Promise<Response>} CORS preflight response or pass-through
 */
app.options('/*', (c: Context<{ Bindings: Env }>) => {
  const request = c.req.raw
  const url = new URL(request.url)

  // Skip root and health endpoints
  if (url.pathname === '/' || url.pathname === '/health') {
    return c.text('Not Found', 404)
  }

  // Validate Git request
  if (!isValidGitRequest(request, url)) {
    return c.text('', 403)
  }

  const env = c.env
  const origin = env?.ALLOWED_ORIGINS || '*'
  
  return new Response('', {
    status: 200,
    headers: createPreflightHeaders(origin)
  })
})

/**
 * Git proxy handler for all HTTP methods (GET, POST, etc.)
 * Processes Git requests and proxies them to upstream servers.
 * Excludes root and health endpoints.
 * 
 * @route ALL /*
 * @param {Context<{ Bindings: Env }>} c - Hono context object
 * @returns {Promise<Response>} Proxied Git response or pass-through
 */
app.all('/*', async (c: Context<{ Bindings: Env }>) => {
  const request = c.req.raw
  const url = new URL(request.url)

  // Skip root and health endpoints
  if (url.pathname === '/' || url.pathname === '/health') {
    return c.text('Not Found', 404)
  }

  // Validate Git request
  if (!isValidGitRequest(request, url)) {
    return c.text('', 403)
  }

  // Parse proxy URL to extract target information
  const urlParts = parseProxyUrl(url)
  if (!urlParts) {
    return c.text('Invalid URL format', 400)
  }

  const env = c.env
  
  // Prepare configuration
  const origin = env?.ALLOWED_ORIGINS || '*'
  const insecureOrigins = env?.INSECURE_HTTP_ORIGINS?.split(',') || []
  
  // Build target URL and prepare headers
  const targetUrl = buildTargetUrl(urlParts.domain, urlParts.path, insecureOrigins)
  const upstreamHeaders = prepareUpstreamHeaders(request)

  try {
    // Make the proxy request to upstream Git server
    const upstreamResponse = await fetch(targetUrl, {
      method: request.method,
      redirect: 'manual',
      headers: upstreamHeaders,
      body: (request.method !== 'GET' && request.method !== 'HEAD') ? request.body : undefined
    })

    // Process response headers for client
    const responseHeaders = processResponseHeaders(upstreamResponse, origin)

    // Return proxied response
    return new Response(upstreamResponse.body, {
      status: upstreamResponse.status,
      statusText: upstreamResponse.statusText,
      headers: responseHeaders
    })

  } catch (error) {
    console.error('Proxy error:', error)
    return c.text('Proxy error', 500)
  }
})

export default app 