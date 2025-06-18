/**
 * @fileoverview Environment types for Fluxly-CCS
 * 
 * Defines the environment interface based on the original cors-proxy-main
 * configuration, supporting origin validation, insecure origins, and
 * other CORS configuration options.
 * 
 * @author Fluxly
 * @version 2.0.0
 */

/**
 * Environment interface for Fluxly-CCS configuration.
 * 
 * Based on the original cors-proxy-main environment variables:
 * - ALLOW_ORIGIN: CORS origin configuration
 * - INSECURE_HTTP_ORIGINS: Comma-separated list of origins to use HTTP instead of HTTPS
 * - PORT: Server port (for local development)
 */
export interface Env {
  /**
   * Port for local development server.
   * Defaults to "3000" if not specified.
   */
  PORT?: string

  /**
   * CORS origin configuration.
   * Can be "*" for all origins, a specific origin, or comma-separated list.
   * Maps to ALLOW_ORIGIN in original cors-proxy.
   */
  ALLOWED_ORIGINS?: string

  /**
   * Comma-separated list of origins that should use HTTP instead of HTTPS.
   * Used for local development against HTTP git servers.
   * Maps to INSECURE_HTTP_ORIGINS in original cors-proxy.
   */
  INSECURE_HTTP_ORIGINS?: string

  /**
   * Enable localhost CORS for development.
   * Allows requests from localhost origins.
   */
  CORS_ALLOW_LOCALHOST?: string

  /**
   * Enable CORS logging for debugging.
   * When enabled, logs CORS validation details.
   */
  CORS_ENABLE_LOGGING?: string
} 