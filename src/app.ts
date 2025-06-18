/**
 * @fileoverview Fluxly-CCS Git Proxy Application
 * 
 * Main application factory following Hono best practices.
 * Implements CORS-enabled Git operations for browser-based isomorphic-git usage.
 * Uses app.route() pattern for proper route organization.
 * 
 * @author Fluxly
 * @version 2.0.0
 * @see {@link https://github.com/isomorphic-git/cors-proxy Original cors-proxy}
 * @see {@link https://hono.dev Hono Framework}
 * @see {@link https://hono.dev/docs/guides/best-practices Hono Best Practices}
 */

import { Hono } from 'hono'
import type { Env } from './types/environment'

// Import route modules following Hono best practices
import rootRoutes from './routes/root'
import healthRoutes from './routes/health'
import proxyRoutes from './routes/proxy'

/**
 * Creates and configures the main Hono application instance.
 * 
 * Follows Hono best practices by using app.route() to mount
 * separate route modules for different functionalities:
 * - Root route (/)
 * - Health check routes (/health)
 * - Git proxy routes (all other paths)
 * 
 * @returns {Hono<{ Bindings: Env }>} Configured Hono application
 * @see {@link https://hono.dev/docs/guides/building-a-larger-application Building Larger Applications}
 */
export function createApp(): Hono<{ Bindings: Env }> {
  const app = new Hono<{ Bindings: Env }>()

  // Mount root route
  // Handles: GET /
  app.route('/', rootRoutes)
  
  // Mount health check routes  
  // Handles: GET /health
  app.route('/health', healthRoutes)
  
  // Mount Git proxy routes for all other paths
  // Handles: OPTIONS /*, ALL /* (Git operations)
  app.route('/', proxyRoutes)

  return app
}

/**
 * The main Hono application instance.
 * 
 * This is the configured application that handles all requests
 * and is exported for use by:
 * - Cloudflare Workers runtime
 * - Bun development server  
 * - Testing frameworks
 * 
 * @type {Hono<{ Bindings: Env }>}
 */
const app = createApp()

/**
 * Default export of the configured Hono application.
 * 
 * @see {@link createApp} Application factory function
 */
export default app 