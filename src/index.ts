import { app } from "./app"
import { Env } from "./types/env";

/**
 * Development environment configuration for Node.js/Bun runtime.
 * Reads configuration from process.env and provides defaults for development.
 * 
 * Uses development defaults:
 * - allowLocalhost: true (convenience - allow localhost access for development)
 * - enableLogging: false (can be overridden with CORS_ENABLE_LOGGING=true)
 */
const env: Env = {
  PORT: process.env.PORT || "3000",
  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS || "https://fluxly.app",
  INSECURE_HTTP_ORIGINS: process.env.INSECURE_HTTP_ORIGINS,
  CORS_ALLOW_LOCALHOST: process.env.CORS_ALLOW_LOCALHOST ?? 'true', // Default true for development
  CORS_ENABLE_LOGGING: process.env.CORS_ENABLE_LOGGING ?? 'false'   // Default false, can be overridden
};

/**
 * Initialize and start the Git CORS Proxy server.
 * Creates the app instance with environment configuration and starts listening.
 */
const server = app(env).listen(env.PORT);