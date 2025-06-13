/**
 * @fileoverview Git request detection utilities for Fluxly-CCS
 * 
 * This module provides functions to detect whether incoming HTTP requests
 * are Git protocol requests. It uses multiple detection methods including
 * service parameters, URL paths, and User-Agent headers.
 * 
 * @author Fluxly
 * @version 2.0.0
 */

import { GIT_SERVICES, GIT_PATHS, GIT_USER_AGENTS } from '../config/constants'

/**
 * Determines if an HTTP request is a Git protocol request.
 * 
 * Uses multiple detection methods to identify Git requests:
 * 1. Service parameter detection (service=git-upload-pack)
 * 2. URL path pattern matching (/info/refs, .git/)
 * 3. User-Agent header analysis (git/ prefix)
 * 
 * @param {Request} request - The HTTP request object
 * @param {URL} url - Parsed URL object from the request
 * @returns {boolean} True if this appears to be a Git request
 * 
 * @example
 * ```typescript
 * const request = new Request('https://proxy.com/github.com/user/repo.git/info/refs?service=git-upload-pack')
 * const url = new URL(request.url)
 * const isGit = isGitRequest(request, url)
 * // Returns: true
 * ```
 * 
 * @example
 * ```typescript
 * const request = new Request('https://proxy.com/api/status')
 * const url = new URL(request.url)
 * const isGit = isGitRequest(request, url)
 * // Returns: false
 * ```
 */
export const isGitRequest = (request: Request, url: URL): boolean => {
  // Method 1: Check for Git-specific query parameters
  if (hasGitServiceParameter(url)) {
    return true
  }
  
  // Method 2: Check for Git-specific paths
  if (hasGitPath(url)) {
    return true
  }
  
  // Method 3: Check for Git-specific User-Agent headers
  if (hasGitUserAgent(request)) {
    return true
  }

  return false
}

/**
 * Checks if the URL contains a Git service parameter.
 * 
 * Git clients typically include a 'service' query parameter that specifies
 * the Git operation being performed (git-upload-pack or git-receive-pack).
 * 
 * @param {URL} url - The parsed URL object
 * @returns {boolean} True if a valid Git service parameter is found
 * 
 * @example
 * ```typescript
 * const url = new URL('https://example.com/repo.git/info/refs?service=git-upload-pack')
 * const hasService = hasGitServiceParameter(url)
 * // Returns: true
 * ```
 */
export const hasGitServiceParameter = (url: URL): boolean => {
  if (!url.searchParams.has('service')) {
    return false
  }
  
  const service = url.searchParams.get('service')
  return service !== null && GIT_SERVICES.includes(service as any)
}

/**
 * Checks if the URL path contains Git-specific patterns.
 * 
 * Looks for standard Git endpoint paths like '/info/refs' or any path
 * containing '.git/' which typically indicates Git repository access.
 * 
 * @param {URL} url - The parsed URL object
 * @returns {boolean} True if a Git path pattern is found
 * 
 * @example
 * ```typescript
 * const url = new URL('https://example.com/repo.git/info/refs')
 * const hasPath = hasGitPath(url)
 * // Returns: true
 * ```
 */
export const hasGitPath = (url: URL): boolean => {
  const path = url.pathname
  return GIT_PATHS.some(pattern => path.includes(pattern))
}

/**
 * Checks if the request has a Git-specific User-Agent header.
 * 
 * Git clients identify themselves with User-Agent headers that typically
 * start with 'git/' followed by version information.
 * 
 * @param {Request} request - The HTTP request object
 * @returns {boolean} True if a Git User-Agent is detected
 * 
 * @example
 * ```typescript
 * const request = new Request('https://example.com/', {
 *   headers: { 'User-Agent': 'git/2.39.0' }
 * })
 * const hasAgent = hasGitUserAgent(request)
 * // Returns: true
 * ```
 */
export const hasGitUserAgent = (request: Request): boolean => {
  const userAgent = request.headers.get('user-agent') || ''
  return GIT_USER_AGENTS.some(pattern => userAgent.startsWith(pattern))
}

/**
 * Extracts Git service type from request parameters.
 * 
 * Returns the specific Git service being requested (upload-pack or receive-pack)
 * if available, otherwise returns null.
 * 
 * @param {URL} url - The parsed URL object
 * @returns {string | null} The Git service name or null if not found
 * 
 * @example
 * ```typescript
 * const url = new URL('https://example.com/repo.git/info/refs?service=git-upload-pack')
 * const service = extractGitService(url)
 * // Returns: 'git-upload-pack'
 * ```
 */
export const extractGitService = (url: URL): string | null => {
  const service = url.searchParams.get('service')
  
  if (service && GIT_SERVICES.includes(service as any)) {
    return service
  }
  
  return null
}

/**
 * Determines if a request is a Git clone/fetch operation.
 * 
 * Git clone and fetch operations typically use the git-upload-pack service.
 * 
 * @param {URL} url - The parsed URL object
 * @returns {boolean} True if this is a clone/fetch operation
 * 
 * @example
 * ```typescript
 * const url = new URL('https://example.com/repo.git/info/refs?service=git-upload-pack')
 * const isClone = isGitCloneRequest(url)
 * // Returns: true
 * ```
 */
export const isGitCloneRequest = (url: URL): boolean => {
  const service = extractGitService(url)
  return service === 'git-upload-pack'
}

/**
 * Determines if a request is a Git push operation.
 * 
 * Git push operations typically use the git-receive-pack service.
 * 
 * @param {URL} url - The parsed URL object
 * @returns {boolean} True if this is a push operation
 * 
 * @example
 * ```typescript
 * const url = new URL('https://example.com/repo.git/info/refs?service=git-receive-pack')
 * const isPush = isGitPushRequest(url)
 * // Returns: true
 * ```
 */
export const isGitPushRequest = (url: URL): boolean => {
  const service = extractGitService(url)
  return service === 'git-receive-pack'
} 