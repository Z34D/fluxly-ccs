/// <reference types="@cloudflare/workers-types" />

/**
 * Environment configuration interface for the Git CORS Proxy server.
 * Supports both Node.js process.env and Cloudflare Worker environment variables.
 */
export interface Env {
  /** Server port number */
  PORT: string;
  
  /** 
   * Comma-separated list of allowed origins for CORS.
   * Example: "https://fluxly.app,http://localhost:3000,http://localhost:3001"
   */
  ALLOWED_ORIGINS?: string;
  
  /**
   * Comma-separated list of domains that should use HTTP instead of HTTPS.
   * Used for development environments or specific insecure origins.
   * Example: "localhost,127.0.0.1"
   */
  INSECURE_HTTP_ORIGINS?: string;
  
  /**
   * Whether to automatically allow all localhost and 127.0.0.1 origins.
   * Set to "true" to enable, "false" to disable.
   * Default: "true" for local development, "false" for Cloudflare deployment
   */
  CORS_ALLOW_LOCALHOST?: string;
  
  /**
   * Whether to enable debug logging for CORS operations.
   * Set to "true" to enable, "false" to disable.
   * Default: "false" for production environments
   */
  CORS_ENABLE_LOGGING?: string;
} 