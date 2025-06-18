/**
 * @fileoverview Root Route Handler
 * 
 * Main landing endpoint following Hono best practices.
 * Returns JSON response with basic proxy information.
 * 
 * @author Fluxly
 * @version 2.0.0
 * @see {@link https://hono.dev/docs/guides/best-practices Hono Best Practices}
 */

import { Hono } from 'hono'
import type { Context } from 'hono'
import type { Env } from '../types/environment'

const app = new Hono<{ Bindings: Env }>()

/**
 * Root endpoint (GET /)
 * Returns JSON with basic proxy information and configuration.
 * 
 * @route GET /
 * @param {Context<{ Bindings: Env }>} c - Hono context object
 * @returns {Promise<Response>} JSON response with proxy information
 */
app.get('/', (c: Context<{ Bindings: Env }>) => {
  const env = c.env
  
  return c.json({
    status: 'online',
    service: 'Fluxly-CCS Git Proxy',
    description: 'TypeScript port of @isomorphic-git/cors-proxy for browser-based Git operations',
    version: '2.0.0',
    repository: 'https://github.com/isomorphic-git/cors-proxy',
    configuration: {
      allowedOrigins: env?.ALLOWED_ORIGINS || '*'
    },
    endpoints: {
      health: '/health',
      documentation: 'https://github.com/isomorphic-git/cors-proxy'
    },
    termsOfUse: 'This service is provided AS IS with no guarantees. By using this service, you promise not to use excessive amounts of bandwidth.'
  })
})

export default app 