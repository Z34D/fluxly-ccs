/**
 * @fileoverview Server configuration utilities for Fluxly-CCS
 * 
 * This module provides functions for displaying server configuration,
 * handling environment setup, and managing development vs production
 * configuration differences.
 * 
 * @author Fluxly
 * @version 2.0.0
 */

import type { Env } from '../types/environment'

/**
 * Displays server configuration information in development mode.
 * 
 * Shows key configuration values like port, allowed origins, and
 * debugging settings. Only runs in development environments to
 * avoid exposing configuration in production logs.
 * 
 * @param {Env} env - Environment configuration object
 * 
 * @example
 * ```typescript
 * displayConfig({
 *   PORT: '3000',
 *   ALLOWED_ORIGINS: 'https://fluxly.app',
 *   CORS_ENABLE_LOGGING: 'true'
 * })
 * // Outputs:
 * // 🦊 Fluxly-CCS is running at http://localhost:3000
 * // 📋 Allowed Origins: https://fluxly.app
 * // 🌐 CORS Allow Localhost: true
 * // 📝 CORS Enable Logging: true
 * ```
 */
export const displayConfig = (env: Env): void => {
  const port = env.PORT || '3000'
  
  console.log(`🦊 Fluxly-CCS is running at http://localhost:${port}`)
  console.log(`📋 Allowed Origins: ${env.ALLOWED_ORIGINS || 'https://fluxly.app'}`)
  console.log(`🌐 CORS Allow Localhost: ${env.CORS_ALLOW_LOCALHOST || 'true'}`)
  console.log(`📝 CORS Enable Logging: ${env.CORS_ENABLE_LOGGING || 'false'}`)
  
  if (env.CORS_ENABLE_LOGGING?.toLowerCase() === 'true') {
    console.log(`🔧 Debug logging enabled for CORS operations`)
    console.log(`🔒 Insecure HTTP Origins: ${env.INSECURE_HTTP_ORIGINS || 'None'}`)
  }
}

/**
 * Determines if the server is running in development mode.
 * 
 * Checks for the presence of Node.js process environment variables
 * to determine if this is a local development environment or
 * a Cloudflare Workers deployment.
 * 
 * @returns {boolean} True if running in development mode
 * 
 * @example
 * ```typescript
 * if (isDevelopmentMode()) {
 *   displayConfig(env)
 * }
 * ```
 */
export const isDevelopmentMode = (): boolean => {
  return typeof process !== 'undefined' && !!process.env
}

/**
 * Gets the server port from environment or default.
 * 
 * @param {Env} env - Environment configuration object
 * @returns {string} Port number as string
 * 
 * @example
 * ```typescript
 * const port = getServerPort(env)
 * // Returns: '3000' (default) or env.PORT value
 * ```
 */
export const getServerPort = (env: Env): string => {
  return env.PORT || '3000'
}

/**
 * Validates environment configuration.
 * 
 * Checks that required environment variables are present and
 * have valid values. Logs warnings for missing or invalid
 * configuration values.
 * 
 * @param {Env} env - Environment configuration object
 * @returns {boolean} True if configuration is valid
 * 
 * @example
 * ```typescript
 * if (!validateConfig(env)) {
 *   console.warn('Configuration validation failed')
 * }
 * ```
 */
export const validateConfig = (env: Env): boolean => {
  let isValid = true
  
  // Validate CORS_ENABLE_LOGGING if present
  if (env.CORS_ENABLE_LOGGING && !['true', 'false'].includes(env.CORS_ENABLE_LOGGING.toLowerCase())) {
    console.warn('⚠️ Invalid CORS_ENABLE_LOGGING value. Expected "true" or "false".')
    isValid = false
  }
  
  // Validate CORS_ALLOW_LOCALHOST if present
  if (env.CORS_ALLOW_LOCALHOST && !['true', 'false'].includes(env.CORS_ALLOW_LOCALHOST.toLowerCase())) {
    console.warn('⚠️ Invalid CORS_ALLOW_LOCALHOST value. Expected "true" or "false".')
    isValid = false
  }
  
  // Validate PORT if present
  if (env.PORT && (isNaN(Number(env.PORT)) || Number(env.PORT) <= 0)) {
    console.warn('⚠️ Invalid PORT value. Expected a positive number.')
    isValid = false
  }
  
  return isValid
}

/**
 * Creates a health check response object.
 * 
 * Provides standardized health information for monitoring
 * and service discovery purposes.
 * 
 * @returns {object} Health check response data
 * 
 * @example
 * ```typescript
 * const health = createHealthResponse()
 * // Returns: {
 * //   status: 'healthy',
 * //   service: 'Fluxly-CCS',
 * //   version: '2.0.0-hono',
 * //   framework: 'Hono',
 * //   timestamp: '2024-12-19T00:20:00.000Z'
 * // }
 * ```
 */
export const createHealthResponse = () => {
  return {
    status: 'healthy',
    service: 'Fluxly-CCS',
    version: '2.0.0-hono',
    framework: 'Hono',
    timestamp: new Date().toISOString()
  }
}

/**
 * Logs startup information when the server begins.
 * 
 * @param {Env} env - Environment configuration object
 */
export const logStartup = (env: Env): void => {
  if (isDevelopmentMode()) {
    console.log('\n🚀 Starting Fluxly-CCS...')
    displayConfig(env)
    console.log('\n✅ Server initialization complete\n')
  }
} 