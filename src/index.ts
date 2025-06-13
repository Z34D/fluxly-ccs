/**
 * @fileoverview Entry point for Fluxly-CCS
 * 
 * This file serves as the main entry point for the application,
 * exporting the configured Hono app from the modular architecture.
 * 
 * For the full implementation, see:
 * - src/app.ts - Main application configuration
 * - src/types/ - TypeScript type definitions
 * - src/utils/ - Utility functions for CORS, Git detection, and proxy operations
 * - src/handlers/ - Route handlers and proxy logic
 * - src/config/ - Configuration and constants
 * 
 * @author Fluxly
 * @version 2.0.0
 */

export { default } from './app'
