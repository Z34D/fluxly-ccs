import { app } from "./app"
import { Env } from "./types/env"

/**
 * Cloudflare Worker export for the Git CORS Proxy.
 * Handles requests in the Cloudflare Workers environment with automatic
 * environment variable injection from the Worker's environment.
 * 
 * Uses production defaults:
 * - allowLocalhost: false (security - no localhost access in production)
 * - enableLogging: false (performance - minimal logging in production)
 */
export default {
    /**
     * Cloudflare Worker fetch handler.
     * Receives environment variables directly from the Worker runtime,
     * which automatically includes ALLOWED_ORIGINS and other configured variables.
     * 
     * @param request - The incoming HTTP request
     * @param env - Environment variables from Cloudflare Worker
     * @param ctx - Execution context for the Worker
     * @returns Response from the Git CORS Proxy
     */
    async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
        // Set production defaults (both false for security and performance)
        const envWithDefaults: Env = {
            ...env,
            ALLOWED_ORIGINS: env.ALLOWED_ORIGINS ?? 'https://fluxly.app',
            CORS_ALLOW_LOCALHOST: env.CORS_ALLOW_LOCALHOST ?? 'false',
            CORS_ENABLE_LOGGING: env.CORS_ENABLE_LOGGING ?? 'false'
        };

        return app(envWithDefaults).fetch(request);
    }
}
