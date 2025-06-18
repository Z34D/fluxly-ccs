/**
 * @fileoverview Health Check Routes
 * 
 * Dedicated health check endpoints following Hono best practices.
 * Returns JSON responses with proxy status and configuration.
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
 * Health check endpoint (GET /health)
 * Returns JSON with detailed proxy status and configuration.
 * 
 * @route GET /health
 * @param {Context<{ Bindings: Env }>} c - Hono context object
 * @returns {Promise<Response>} JSON response with detailed health status
 */
app.get('/', (c: Context<{ Bindings: Env }>) => {
  const env = c.env
  
  return c.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Fluxly-CCS Git Proxy',
    version: '2.0.0',
    uptime: process.uptime ? Math.floor(process.uptime()) : 'unknown',
    configuration: {
      allowedOrigins: env?.ALLOWED_ORIGINS || '*',
      corsAllowLocalhost: env?.CORS_ALLOW_LOCALHOST || 'true',
      corsEnableLogging: env?.CORS_ENABLE_LOGGING || 'false',
      port: env?.PORT || '3000'
    },
    termsOfUse: 'This service is provided AS IS with no guarantees. By using this service, you promise not to use excessive amounts of bandwidth.'
  })
})

export default app 