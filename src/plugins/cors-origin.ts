import { Elysia } from 'elysia';

/**
 * Configuration options for CORS origin validation
 */
export interface CorsOriginOptions {
  /** Array of explicitly allowed origins (e.g., ['https://example.com']) */
  allowedOrigins?: string[];
  /** Whether to automatically allow localhost and 127.0.0.1 addresses (default: true) */
  allowLocalhost?: boolean;
  /** Custom ports to allow for localhost (if not allowing all localhost) */
  allowedPorts?: number[];
  /** Whether to enable debug logging for origin validation */
  enableLogging?: boolean;
}

/**
 * CORS Origin Validation Plugin for Elysia
 * 
 * Provides origin validation functionality with automatic localhost support
 * and configurable allowed origins. Follows security best practices by
 * defaulting to a restrictive allowlist approach.
 * 
 * @param options - Configuration options for origin validation
 * @returns Elysia plugin instance with origin validation functionality
 * 
 * @example
 * ```typescript
 * import { Elysia } from 'elysia'
 * import { corsOrigin } from './plugins/cors-origin'
 * 
 * const app = new Elysia()
 *   .use(corsOrigin({
 *     allowedOrigins: ['https://myapp.com'],
 *     allowLocalhost: true,
 *     enableLogging: true
 *   }))
 *   .get('/', ({ isOriginAllowed }) => {
 *     const origin = 'https://myapp.com'
 *     return { allowed: isOriginAllowed(origin) }
 *   })
 * ```
 */
export const corsOrigin = (options: CorsOriginOptions = {}) => {
  const {
    allowedOrigins = [],
    allowLocalhost = true,
    allowedPorts = [],
    enableLogging = false
  } = options;

  /**
   * Validates if a given origin is allowed based on configuration
   * 
   * @param origin - The origin to validate (e.g., 'https://example.com')
   * @returns True if the origin is allowed, false otherwise
   * 
   * @example
   * ```typescript
   * const isAllowed = isOriginAllowed('https://localhost:3000')
   * // Returns true if allowLocalhost is enabled
   * ```
   */
  const isOriginAllowed = (origin?: string): boolean => {
    // No origin header means same-origin request (always allowed)
    if (!origin) {
      if (enableLogging) {
        console.log('🔍 CORS Origin: No origin header (same-origin) - ALLOWED');
      }
      return true;
    }

    try {
      const url = new URL(origin);
      
      // Check localhost and 127.0.0.1 addresses if enabled
      if (allowLocalhost && (url.hostname === 'localhost' || url.hostname === '127.0.0.1')) {
        // If specific ports are configured, check them
        if (allowedPorts.length > 0) {
          const port = parseInt(url.port) || (url.protocol === 'https:' ? 443 : 80);
          const portAllowed = allowedPorts.includes(port);
          
          if (enableLogging) {
            console.log(`🔍 CORS Origin: ${origin} (localhost:${port}) - ${portAllowed ? 'ALLOWED' : 'BLOCKED'}`);
          }
          
          return portAllowed;
        }
        
        // Allow all localhost ports if no specific ports configured
        if (enableLogging) {
          console.log(`🔍 CORS Origin: ${origin} (localhost) - ALLOWED`);
        }
        return true;
      }
      
      // Check against explicit allowed origins
      const isExplicitlyAllowed = allowedOrigins.includes(origin);
      
      if (enableLogging) {
        console.log(`🔍 CORS Origin: ${origin} - ${isExplicitlyAllowed ? 'ALLOWED' : 'BLOCKED'}`);
      }
      
      return isExplicitlyAllowed;
      
    } catch (error) {
      // Invalid URL format
      if (enableLogging) {
        console.log(`🔍 CORS Origin: ${origin} (invalid URL) - BLOCKED`);
      }
      return false;
    }
  };

  return new Elysia({ name: 'cors-origin' })
    .decorate({
      /**
       * Function to validate if an origin is allowed
       * Available in route handlers via destructuring
       */
      isOriginAllowed
    });
}; 