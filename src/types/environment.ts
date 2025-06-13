/**
 * @fileoverview Environment configuration types for Fluxly-CCS
 * 
 * This module defines TypeScript interfaces for environment variables and
 * configuration options used throughout the application.
 * 
 * @author Fluxly
 * @version 2.0.0
 */

/**
 * Environment configuration interface for Cloudflare Workers and development.
 * 
 * Defines the structure of environment variables that control server behavior,
 * CORS settings, logging, and protocol handling.
 * 
 * @interface Env
 * @example
 * ```typescript
 * const env: Env = {
 *   ALLOWED_ORIGINS: 'https://fluxly.app,https://app.fluxly.com',
 *   CORS_ALLOW_LOCALHOST: 'true',
 *   CORS_ENABLE_LOGGING: 'false',
 *   INSECURE_HTTP_ORIGINS: 'localhost,127.0.0.1',
 *   PORT: '3000'
 * }
 * ```
 */
export interface Env {
  /**
   * Comma-separated list of allowed CORS origins.
   * 
   * Controls which domains can make cross-origin requests to the proxy.
   * If not specified, defaults to 'https://fluxly.app'.
   * 
   * @example 'https://fluxly.app,https://app.fluxly.com'
   */
  ALLOWED_ORIGINS?: string

  /**
   * Whether to allow localhost origins for CORS requests.
   * 
   * When set to 'true' (default), allows requests from localhost and 127.0.0.1
   * on any port. Useful for development environments.
   * 
   * @default 'true'
   * @example 'false' to disable localhost access
   */
  CORS_ALLOW_LOCALHOST?: string

  /**
   * Enable detailed logging for CORS operations and proxy requests.
   * 
   * When set to 'true', logs detailed information about CORS validation,
   * proxy operations, and authentication handling. Should be 'false' in production.
   * 
   * @default 'false'
   * @example 'true' for development debugging
   */
  CORS_ENABLE_LOGGING?: string

  /**
   * Comma-separated list of domains that should use HTTP instead of HTTPS.
   * 
   * Allows specific domains to be proxied via HTTP for testing or internal
   * environments. Most production Git services should use HTTPS.
   * 
   * @example 'localhost,internal.git.company.com'
   */
  INSECURE_HTTP_ORIGINS?: string

  /**
   * Port number for the development server.
   * 
   * Used only in development environments when running locally.
   * Cloudflare Workers ignore this setting.
   * 
   * @default '3000'
   * @example '8080'
   */
  PORT?: string
} 