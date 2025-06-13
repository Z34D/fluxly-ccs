/**
 * @fileoverview Main application file for Fluxly-CCS
 * 
 * This module creates and configures the Hono application with all routes,
 * middleware, and handlers. It serves as the entry point that ties together
 * all the modular components of the proxy server.
 * 
 * @author Fluxly
 * @version 2.0.0
 */

import { Hono } from 'hono'
import type { Env } from './types/environment'
import { logStartup } from './config/server-config'
import {
  handleHealth,
  handleRoot,
  handleOptions,
  handleUniversal
} from './handlers/route-handlers'

/**
 * Creates and configures the main Hono application.
 * 
 * Sets up all routes and handlers for Fluxly-CCS:
 * - Health check endpoint
 * - Root information page
 * - CORS preflight handler
 * - Universal Git proxy router
 * 
 * @returns {Hono} Configured Hono application instance
 * 
 * @example
 * ```typescript
 * const app = createApp()
 * export default app
 * ```
 */
export const createApp = (): Hono<{ Bindings: Env }> => {
  const app = new Hono<{ Bindings: Env }>()

  /**
   * Health endpoint for monitoring and service discovery.
   * 
   * @route GET /health
   * @returns {object} Server health and status information
   */
  app.get('/health', handleHealth)

  /**
   * Root endpoint with server information and usage documentation.
   * 
   * @route GET /
   * @returns {string} HTML page with server documentation
   */
  app.get('/', handleRoot)

  /**
   * CORS preflight handler for all routes.
   * 
   * Handles OPTIONS requests for Cross-Origin Resource Sharing
   * by validating origins and setting appropriate headers.
   * 
   * @route OPTIONS /*
   * @returns {string} Empty response with CORS headers
   */
  app.options('/*', handleOptions)

  /**
   * Universal handler for all HTTP methods and routes.
   * 
   * The main request router that processes all requests,
   * validates CORS, detects Git requests, and forwards
   * them to the appropriate handlers.
   * 
   * @route ALL /*
   * @returns {Response} Proxied Git response or informational response
   */
  app.all('/*', handleUniversal)

  return app
}

/**
 * The main Hono application instance.
 * 
 * This is the configured application that handles all requests
 * for Fluxly-CCS.
 */
const app = createApp()

/**
 * Initializes the server in development mode.
 * 
 * Logs startup information and configuration when running
 * in a local development environment.
 */
if (typeof process !== 'undefined' && process.env) {
  logStartup(process.env as Env)
}

/**
 * Export the configured Hono application.
 * 
 * This is used by:
 * - Cloudflare Workers runtime
 * - Bun development server
 * - Testing frameworks
 */
export default app 