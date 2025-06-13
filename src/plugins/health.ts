import { Elysia } from 'elysia';

/**
 * Configuration options for the health endpoint
 */
export interface HealthOptions {
  /** Custom endpoint path for health checks (default: '/health') */
  path?: string;
  /** Whether to include detailed system information */
  includeDetails?: boolean;
  /** Whether to enable debug logging for health checks */
  enableLogging?: boolean;
  /** Custom service name to include in health response */
  serviceName?: string;
  /** Custom version to override package.json version */
  version?: string;
}

/**
 * Health endpoint response interface
 */
export interface HealthResponse {
  /** Service status */
  status: 'healthy' | 'unhealthy';
  /** Service name */
  service: string;
  /** Service version */
  version: string;
  /** Additional details if enabled */
  details?: {
    /** Memory usage information */
    memory?: {
      used: number;
      total: number;
      percentage: number;
    };
    /** Environment information */
    environment?: string;
  };
}

/**
 * Health Endpoint Plugin for Elysia
 * 
 * Provides a production-ready health check endpoint with version information
 * and optional system details. Designed for monitoring and load balancer
 * health checks in production environments.
 * 
 * @param options - Configuration options for the health endpoint
 * @returns Elysia plugin instance with health endpoint
 * 
 * @example
 * ```typescript
 * import { Elysia } from 'elysia'
 * import { health } from './plugins/health'
 * 
 * const app = new Elysia()
 *   .use(health({
 *     serviceName: 'Git CORS Proxy',
 *     includeDetails: true,
 *     enableLogging: true
 *   }))
 *   .listen(3000)
 * 
 * // GET /health
 * // {
 * //   "status": "healthy",
 * //   "service": "Git CORS Proxy",
 * //   "version": "1.0.50"
 * // }
 * ```
 */
export const health = (options: HealthOptions = {}) => {
  const {
    path = '/health',
    includeDetails = false,
    enableLogging = false,
    serviceName = 'Fluxly CORS Proxy',
    version = '1.1.0' // Default from package.json
  } = options;

  /**
   * Generates health check response with current system status
   * 
   * @returns Health response object with status and system information
   */
  const generateHealthResponse = (): HealthResponse => {
    const response: HealthResponse = {
      status: 'healthy',
      service: serviceName,
      version
    };

    // Add detailed system information if requested
    if (includeDetails) {
      const memUsage = process.memoryUsage();
      
      response.details = {
        memory: {
          used: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
          total: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
          percentage: Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100)
        },
        environment: process.env.NODE_ENV || 'development'
      };
    }

    return response;
  };

  return new Elysia({ name: 'health' })
    /**
     * Health check endpoint
     * 
     * Returns service status, version information.
     * Used by load balancers and monitoring systems to verify service health.
     */
    .get(path, ({ set }) => {
      const healthResponse = generateHealthResponse();
      
      // Set appropriate headers for health checks
      set.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
      set.headers['Content-Type'] = 'application/json';
      
      if (enableLogging) {
        console.log(`🏥 Health Check: ${healthResponse.status} - ${healthResponse.service} v${healthResponse.version}`);
      }
      
      return healthResponse;
    });
}; 