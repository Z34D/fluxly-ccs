/**
 * @fileoverview Git Request Detection Utilities
 * 
 * Contains functions ported from allow-request.js for identifying valid Git HTTP 
 * protocol operations. These functions determine if an incoming request should be
 * proxied to a Git server based on Git's HTTP transport protocol specification.
 * 
 * @author Fluxly
 * @version 2.0.0
 * @see {@link https://git-scm.com/docs/http-protocol Git HTTP Protocol Specification}
 */

/**
 * Checks if request is a CORS preflight for Git info/refs endpoint.
 * 
 * @param {Request} request - The HTTP request object
 * @param {URL} url - Parsed URL object
 * @returns {boolean} True if this is a preflight info/refs request
 * @see {@link https://git-scm.com/docs/http-protocol#_discovering_references Git Info Refs}
 */
export function isPreflightInfoRefs(request: Request, url: URL): boolean {
  return request.method === 'OPTIONS' && 
         url.pathname.endsWith('/info/refs') && 
         (url.searchParams.get('service') === 'git-upload-pack' || 
          url.searchParams.get('service') === 'git-receive-pack')
}

/**
 * Checks if request is a GET for Git repository references.
 * 
 * @param {Request} request - The HTTP request object
 * @param {URL} url - Parsed URL object  
 * @returns {boolean} True if this is an info/refs request
 * @see {@link https://git-scm.com/docs/http-protocol#_discovering_references Git Info Refs}
 */
export function isInfoRefs(request: Request, url: URL): boolean {
  return request.method === 'GET' && 
         url.pathname.endsWith('/info/refs') && 
         (url.searchParams.get('service') === 'git-upload-pack' || 
          url.searchParams.get('service') === 'git-receive-pack')
}

/**
 * Checks if request is a CORS preflight for Git fetch/pull operation.
 * 
 * @param {Request} request - The HTTP request object
 * @param {URL} url - Parsed URL object
 * @returns {boolean} True if this is a preflight pull request
 * @see {@link https://git-scm.com/docs/http-protocol#_smart_clients Git Smart Protocol}
 */
export function isPreflightPull(request: Request, url: URL): boolean {
  const accessControlRequestHeaders = request.headers.get('access-control-request-headers')
  return request.method === 'OPTIONS' && 
         accessControlRequestHeaders?.includes('content-type') === true &&
         url.pathname.endsWith('git-upload-pack')
}

/**
 * Checks if request is a POST for Git fetch/pull operation.
 * 
 * @param {Request} request - The HTTP request object
 * @param {URL} url - Parsed URL object
 * @returns {boolean} True if this is a Git pull request
 * @see {@link https://git-scm.com/docs/http-protocol#_smart_clients Git Smart Protocol}
 */
export function isPull(request: Request, url: URL): boolean {
  return request.method === 'POST' && 
         request.headers.get('content-type') === 'application/x-git-upload-pack-request' && 
         url.pathname.endsWith('git-upload-pack')
}

/**
 * Checks if request is a CORS preflight for Git push operation.
 * 
 * @param {Request} request - The HTTP request object
 * @param {URL} url - Parsed URL object
 * @returns {boolean} True if this is a preflight push request
 * @see {@link https://git-scm.com/docs/http-protocol#_smart_clients Git Smart Protocol}
 */
export function isPreflightPush(request: Request, url: URL): boolean {
  const accessControlRequestHeaders = request.headers.get('access-control-request-headers')
  return request.method === 'OPTIONS' && 
         accessControlRequestHeaders?.includes('content-type') === true &&
         url.pathname.endsWith('git-receive-pack')
}

/**
 * Checks if request is a POST for Git push operation.
 * 
 * @param {Request} request - The HTTP request object
 * @param {URL} url - Parsed URL object
 * @returns {boolean} True if this is a Git push request
 * @see {@link https://git-scm.com/docs/http-protocol#_smart_clients Git Smart Protocol}
 */
export function isPush(request: Request, url: URL): boolean {
  return request.method === 'POST' && 
         request.headers.get('content-type') === 'application/x-git-receive-pack-request' && 
         url.pathname.endsWith('git-receive-pack')
}

/**
 * Main Git request validation function.
 * Combines all Git operation checks to determine if request should be proxied.
 * 
 * @param {Request} request - The HTTP request object
 * @param {URL} url - Parsed URL object
 * @returns {boolean} True if this is a valid Git request that should be proxied
 * @see {@link https://git-scm.com/docs/http-protocol Git HTTP Protocol Specification}
 */
export function isValidGitRequest(request: Request, url: URL): boolean {
  return (
    isPreflightInfoRefs(request, url) ||
    isInfoRefs(request, url) ||
    isPreflightPull(request, url) ||
    isPull(request, url) ||
    isPreflightPush(request, url) ||
    isPush(request, url)
  )
} 