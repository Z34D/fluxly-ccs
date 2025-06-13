import { Elysia } from 'elysia';

/**
 * Configuration options for Git request detection
 */
export interface GitDetectionOptions {
  /** Whether to enable debug logging for Git detection (default: false) */
  enableLogging?: boolean;
  /** Additional user-agent patterns to recognize as Git clients */
  customUserAgents?: string[];
  /** Additional service parameters to recognize as Git services */
  customServices?: string[];
  /** Additional path patterns to recognize as Git paths */
  customPaths?: string[];
  /** Whether to detect Git requests by user-agent (default: true) */
  detectByUserAgent?: boolean;
  /** Whether to detect Git requests by service parameters (default: true) */
  detectByService?: boolean;
  /** Whether to detect Git requests by path patterns (default: true) */
  detectByPath?: boolean;
}

/**
 * Git Request Detection Plugin for Elysia
 * 
 * Provides Git protocol request detection functionality with multiple
 * detection methods including service parameters, path patterns, and
 * user-agent strings. Designed for Git proxy servers but flexible
 * enough for general Git protocol handling.
 * 
 * @param options - Configuration options for Git detection
 * @returns Elysia plugin instance with Git detection functionality
 * 
 * @example
 * ```typescript
 * import { Elysia } from 'elysia'
 * import { gitDetection } from './plugins/git-detection'
 * 
 * const app = new Elysia()
 *   .use(gitDetection({
 *     enableLogging: true,
 *     customUserAgents: ['my-git-client/1.0'],
 *     customServices: ['git-custom-service']
 *   }))
 *   .get('/*', ({ request, isGitRequest }) => {
 *     const url = new URL(request.url)
 *     const isGit = isGitRequest(request, url)
 *     return { isGitRequest: isGit }
 *   })
 * ```
 */
export const gitDetection = (options: GitDetectionOptions = {}) => {
  const {
    enableLogging = false,
    customUserAgents = [],
    customServices = [],
    customPaths = [],
    detectByUserAgent = true,
    detectByService = true,
    detectByPath = true
  } = options;

  // Standard Git services
  const standardServices = ['git-upload-pack', 'git-receive-pack'];
  const allServices = [...standardServices, ...customServices];

  // Standard Git path patterns
  const standardPaths = ['/info/refs', '.git/'];
  const allPaths = [...standardPaths, ...customPaths];

  // Standard Git user-agent patterns
  const standardUserAgents = ['git/'];
  const allUserAgents = [...standardUserAgents, ...customUserAgents];

  /**
   * Detects if a request is a Git protocol request
   * 
   * Uses multiple detection methods:
   * 1. Service parameters (git-upload-pack, git-receive-pack)
   * 2. Path patterns (/info/refs, .git/)
   * 3. User-agent strings (git/)
   * 
   * @param request - The HTTP request object
   * @param url - The parsed URL object
   * @returns True if the request appears to be a Git protocol request
   * 
   * @example
   * ```typescript
   * const request = new Request('https://github.com/user/repo.git/info/refs?service=git-upload-pack')
   * const url = new URL(request.url)
   * const isGit = isGitRequest(request, url)
   * // Returns true due to service parameter and path
   * ```
   */
  const isGitRequest = (request: Request, url: URL): boolean => {
    const detectionResults: string[] = [];

    // Method 1: Check for Git-specific query parameters
    if (detectByService && url.searchParams.has('service')) {
      const service = url.searchParams.get('service');
      if (service && allServices.includes(service)) {
        detectionResults.push(`service=${service}`);
        
        if (enableLogging) {
          console.log(`🔍 Git Detection: Service parameter "${service}" detected`);
        }
      }
    }
    
    // Method 2: Check for Git-specific paths
    if (detectByPath) {
      const path = url.pathname;
      const matchedPath = allPaths.find(pattern => path.includes(pattern));
      
      if (matchedPath) {
        detectionResults.push(`path=${matchedPath}`);
        
        if (enableLogging) {
          console.log(`🔍 Git Detection: Path pattern "${matchedPath}" detected in ${path}`);
        }
      }
    }
    
    // Method 3: Check for Git-specific headers (user-agent)
    if (detectByUserAgent) {
      const userAgent = request.headers.get('user-agent') || '';
      const matchedAgent = allUserAgents.find(pattern => userAgent.startsWith(pattern));
      
      if (matchedAgent) {
        detectionResults.push(`user-agent=${matchedAgent}`);
        
        if (enableLogging) {
          console.log(`🔍 Git Detection: User-agent pattern "${matchedAgent}" detected`);
        }
      }
    }

    const isGit = detectionResults.length > 0;

    if (enableLogging) {
      if (isGit) {
        console.log(`✅ Git Detection: Request identified as Git (${detectionResults.join(', ')})`);
      } else {
        console.log(`❌ Git Detection: Request not identified as Git`);
        console.log(`   URL: ${url.pathname}${url.search}`);
        console.log(`   User-Agent: ${request.headers.get('user-agent') || 'none'}`);
      }
    }
    
    return isGit;
  };

  /**
   * Gets detailed information about Git request detection
   * 
   * @param request - The HTTP request object
   * @param url - The parsed URL object
   * @returns Object with detection details and results
   * 
   * @example
   * ```typescript
   * const info = getGitRequestInfo(request, url)
   * console.log(`Git request: ${info.isGit}`)
   * console.log(`Detection methods: ${info.detectedBy.join(', ')}`)
   * ```
   */
  const getGitRequestInfo = (request: Request, url: URL) => {
    const detectedBy: string[] = [];
    const details: Record<string, any> = {};

    // Check service parameter
    if (detectByService && url.searchParams.has('service')) {
      const service = url.searchParams.get('service');
      if (service && allServices.includes(service)) {
        detectedBy.push('service');
        details.service = service;
      }
    }

    // Check path patterns
    if (detectByPath) {
      const path = url.pathname;
      const matchedPath = allPaths.find(pattern => path.includes(pattern));
      if (matchedPath) {
        detectedBy.push('path');
        details.pathPattern = matchedPath;
        details.fullPath = path;
      }
    }

    // Check user-agent
    if (detectByUserAgent) {
      const userAgent = request.headers.get('user-agent') || '';
      const matchedAgent = allUserAgents.find(pattern => userAgent.startsWith(pattern));
      if (matchedAgent) {
        detectedBy.push('user-agent');
        details.userAgentPattern = matchedAgent;
        details.fullUserAgent = userAgent;
      }
    }

    return {
      isGit: detectedBy.length > 0,
      detectedBy,
      details,
      url: url.toString(),
      method: request.method
    };
  };

  /**
   * Gets the current Git detection configuration
   * 
   * @returns Object containing current detection configuration
   * 
   * @example
   * ```typescript
   * const config = getGitDetectionConfig()
   * console.log(`Detecting ${config.services.length} service types`)
   * ```
   */
  const getGitDetectionConfig = () => ({
    services: [...allServices],
    paths: [...allPaths],
    userAgents: [...allUserAgents],
    detectByService,
    detectByPath,
    detectByUserAgent,
    enableLogging
  });

  return new Elysia({ name: 'git-detection' })
    .decorate({
      /**
       * Function to detect if a request is a Git protocol request
       * Available in route handlers via destructuring
       */
      isGitRequest,
      
      /**
       * Function to get detailed Git request detection information
       * Available in route handlers via destructuring
       */
      getGitRequestInfo,
      
      /**
       * Function to get current Git detection configuration
       * Available in route handlers via destructuring
       */
      getGitDetectionConfig
    });
}; 