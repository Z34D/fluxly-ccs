import { Elysia } from 'elysia';

/**
 * Configuration options for CORS headers management
 */
export interface CorsHeadersOptions {
  /** HTTP methods to allow in CORS requests (default: ['GET', 'POST', 'OPTIONS']) */
  allowedMethods?: string[];
  /** Headers to allow in CORS requests (default: common Git and web headers) */
  allowedHeaders?: string[];
  /** Maximum age for preflight cache in seconds (default: 86400 = 24 hours) */
  maxAge?: number;
  /** Whether to include credentials in CORS requests (default: false) */
  credentials?: boolean;
  /** Whether to enable debug logging for header operations */
  enableLogging?: boolean;
  /** Default origin to use when no origin is provided */
  defaultOrigin?: string;
}

/**
 * CORS Headers Management Plugin for Elysia
 * 
 * Provides CORS header management functionality with configurable options
 * for methods, headers, and caching. Designed specifically for Git proxy
 * operations but flexible enough for general use.
 * 
 * @param options - Configuration options for CORS headers
 * @returns Elysia plugin instance with CORS header management functionality
 * 
 * @example
 * ```typescript
 * import { Elysia } from 'elysia'
 * import { corsHeaders } from './plugins/cors-headers'
 * 
 * const app = new Elysia()
 *   .use(corsHeaders({
 *     allowedMethods: ['GET', 'POST', 'PUT'],
 *     allowedHeaders: ['authorization', 'content-type'],
 *     maxAge: 3600,
 *     enableLogging: true
 *   }))
 *   .get('/', ({ addCorsHeaders, set }) => {
 *     const origin = 'https://example.com'
 *     const success = addCorsHeaders(set, origin)
 *     return { corsAdded: success }
 *   })
 * ```
 */
export const corsHeaders = (options: CorsHeadersOptions = {}) => {
  const {
    allowedMethods = ['GET', 'POST', 'OPTIONS'],
    allowedHeaders = [
      'accept-encoding', 'accept-language', 'accept', 'authorization',
      'cache-control', 'connection', 'content-length', 'content-type',
      'git-protocol', 'pragma', 'range', 'referer', 'user-agent'
    ],
    maxAge = 86400, // 24 hours
    credentials = false,
    enableLogging = false,
    defaultOrigin = '*' // Use wildcard instead of hardcoded port
  } = options;

  /**
   * Adds CORS headers to the response if the origin is allowed
   * 
   * @param set - Elysia's response setter object
   * @param origin - The origin requesting access (optional)
   * @param isOriginAllowed - Function to validate if origin is allowed (optional)
   * @returns True if CORS headers were added, false if origin was blocked
   * 
   * @example
   * ```typescript
   * const success = addCorsHeaders(set, 'https://localhost:3000')
   * if (success) {
   *   console.log('CORS headers added successfully')
   * }
   * ```
   */
  const addCorsHeaders = (
    set: any, 
    origin?: string, 
    isOriginAllowed?: (origin?: string) => boolean
  ): boolean => {
    // If origin validation function is provided, use it
    if (isOriginAllowed && !isOriginAllowed(origin)) {
      if (enableLogging) {
        console.log(`🚫 CORS Headers: Origin "${origin}" blocked by validation`);
      }
      return false;
    }

    // Set CORS headers
    const responseOrigin = origin || defaultOrigin;
    
    set.headers['Access-Control-Allow-Origin'] = responseOrigin;
    set.headers['Access-Control-Allow-Methods'] = allowedMethods.join(', ');
    set.headers['Access-Control-Allow-Headers'] = allowedHeaders.join(', ');
    set.headers['Access-Control-Max-Age'] = maxAge.toString();
    
    if (credentials) {
      set.headers['Access-Control-Allow-Credentials'] = 'true';
    }

    if (enableLogging) {
      console.log(`✅ CORS Headers: Added for origin "${responseOrigin}"`);
      console.log(`   Methods: ${allowedMethods.join(', ')}`);
      console.log(`   Headers: ${allowedHeaders.length} headers allowed`);
      console.log(`   Max-Age: ${maxAge}s`);
    }

    return true;
  };

  /**
   * Adds CORS headers specifically for preflight OPTIONS requests
   * 
   * @param set - Elysia's response setter object
   * @param origin - The origin requesting access (optional)
   * @param isOriginAllowed - Function to validate if origin is allowed (optional)
   * @returns True if CORS headers were added, false if origin was blocked
   * 
   * @example
   * ```typescript
   * // In an OPTIONS route handler
   * const success = addPreflightHeaders(set, origin, isOriginAllowed)
   * set.status = success ? 204 : 403
   * ```
   */
  const addPreflightHeaders = (
    set: any,
    origin?: string,
    isOriginAllowed?: (origin?: string) => boolean
  ): boolean => {
    const success = addCorsHeaders(set, origin, isOriginAllowed);
    
    if (success) {
      // Set appropriate status for preflight
      set.status = 204;
      
      if (enableLogging) {
        console.log(`🔍 CORS Preflight: Headers added for origin "${origin || defaultOrigin}"`);
      }
    } else {
      set.status = 403;
      
      if (enableLogging) {
        console.log(`🚫 CORS Preflight: Blocked for origin "${origin}"`);
      }
    }
    
    return success;
  };

  /**
   * Gets the current CORS configuration
   * 
   * @returns Object containing current CORS configuration
   * 
   * @example
   * ```typescript
   * const config = getCorsConfig()
   * console.log(`Allowing ${config.allowedMethods.length} methods`)
   * ```
   */
  const getCorsConfig = () => ({
    allowedMethods: [...allowedMethods],
    allowedHeaders: [...allowedHeaders],
    maxAge,
    credentials,
    defaultOrigin
  });

  return new Elysia({ name: 'cors-headers' })
    .decorate({
      /**
       * Function to add CORS headers to responses
       * Available in route handlers via destructuring
       */
      addCorsHeaders,
      
      /**
       * Function to add CORS headers for preflight requests
       * Available in route handlers via destructuring
       */
      addPreflightHeaders,
      
      /**
       * Function to get current CORS configuration
       * Available in route handlers via destructuring
       */
      getCorsConfig
    });
}; 