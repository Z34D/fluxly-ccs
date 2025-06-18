/**
 * @fileoverview Local server entry point for Fluxly-CCS
 * 
 * This file serves as the local server entry point that reads environment variables
 * and starts the server with proper configuration. It's separate from the main
 * index.ts which is used for Cloudflare Workers deployment.
 * 
 * @author Fluxly
 * @version 2.0.0
 */

import app from './app'
import type { Env } from './types/environment'

/**
 * Local server environment configuration with defaults.
 * 
 * Reads from process.env and provides sensible defaults for local development.
 */
const serverEnv: Env = {
  PORT: process.env.PORT || "3000",
  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS || "*",
  CORS_ALLOW_LOCALHOST: process.env.CORS_ALLOW_LOCALHOST || "true",
  CORS_ENABLE_LOGGING: process.env.CORS_ENABLE_LOGGING || "false",
  INSECURE_HTTP_ORIGINS: process.env.INSECURE_HTTP_ORIGINS
}

/**
 * Log startup configuration for operational visibility.
 */
console.log('🚀 Starting Fluxly-CCS server...')
console.log('📋 Environment Configuration:')
console.log(`   PORT: ${serverEnv.PORT}`)
console.log(`   ALLOWED_ORIGINS: ${serverEnv.ALLOWED_ORIGINS}`)
console.log(`   INSECURE_HTTP_ORIGINS: ${serverEnv.INSECURE_HTTP_ORIGINS || 'none'}`)
console.log(`   CORS_ALLOW_LOCALHOST: ${serverEnv.CORS_ALLOW_LOCALHOST}`)
console.log(`   CORS_ENABLE_LOGGING: ${serverEnv.CORS_ENABLE_LOGGING}`)

/**
 * Start the Bun server with the configured environment.
 */
const server = Bun.serve({
  port: parseInt(serverEnv.PORT || "3000"),
  fetch: (request: Request) => app.fetch(request, serverEnv),
})

console.log(`🦊 Fluxly-CCS is running at http://localhost:${server.port}`) 