import { Hono } from 'hono'

/**
 * Git Proxy Server - Hono Implementation
 * 
 * Complete port of ElysiaJS Git CORS Proxy to Hono framework.
 * Maintains all functionality including CORS handling, Git detection,
 * proxy logic, and authentication forwarding.
 */

// Environment configuration with defaults
interface Env {
  ALLOWED_ORIGINS?: string
  CORS_ALLOW_LOCALHOST?: string
  CORS_ENABLE_LOGGING?: string
  INSECURE_HTTP_ORIGINS?: string
  PORT?: string
}

// CORS origin validation function (ported from corsOrigin plugin)
const isOriginAllowed = (origin: string | undefined, allowedOrigins: string[], allowLocalhost: boolean = true): boolean => {
  // No origin header means same-origin request (always allowed)
  if (!origin) {
    return true
  }

  try {
    const url = new URL(origin)
    
    // Check localhost and 127.0.0.1 addresses if enabled
    if (allowLocalhost && (url.hostname === 'localhost' || url.hostname === '127.0.0.1')) {
      return true
    }
    
    // Check against explicit allowed origins
    return allowedOrigins.includes(origin)
    
  } catch (error) {
    // Invalid URL format
    return false
  }
}

// Git request detection function (ported from gitDetection plugin)
const isGitRequest = (request: Request, url: URL): boolean => {
  const standardServices = ['git-upload-pack', 'git-receive-pack']
  const standardPaths = ['/info/refs', '.git/']
  const standardUserAgents = ['git/']

  // Method 1: Check for Git-specific query parameters
  if (url.searchParams.has('service')) {
    const service = url.searchParams.get('service')
    if (service && standardServices.includes(service)) {
      return true
    }
  }
  
  // Method 2: Check for Git-specific paths
  const path = url.pathname
  const matchedPath = standardPaths.find(pattern => path.includes(pattern))
  if (matchedPath) {
    return true
  }
  
  // Method 3: Check for Git-specific headers (user-agent)
  const userAgent = request.headers.get('user-agent') || ''
  const matchedAgent = standardUserAgents.find(pattern => userAgent.startsWith(pattern))
  if (matchedAgent) {
    return true
  }

  return false
}

// CORS headers middleware
const addCorsHeaders = (c: any, origin: string | undefined, isAllowed: boolean) => {
  if (isAllowed && origin) {
    c.header('access-control-allow-origin', origin)
  } else if (isAllowed && !origin) {
    c.header('access-control-allow-origin', '*')
  }
  
  c.header('access-control-allow-methods', 'GET, POST, OPTIONS')
  c.header('access-control-allow-headers', 'accept-encoding, accept-language, accept, authorization, cache-control, content-length, content-type, git-protocol, pragma, range, referer, user-agent')
  c.header('access-control-expose-headers', 'content-type, content-length, cache-control, etag, location')
  c.header('access-control-max-age', '86400')
  
  return isAllowed
}

// Proxy request handler (ported from ElysiaJS handleGitProxy function)
const handleGitProxy = async (c: any, env: Env) => {
  const request = c.req.raw
  const url = new URL(request.url)
  const enableLogging = env.CORS_ENABLE_LOGGING?.toLowerCase() === 'true'
  
  if (enableLogging) {
    console.log(`🔍 GIT REQUEST: ${url.pathname} - Proxying...`)
  }
  
  // Parse proxy URL: /domain.com/path/to/repo
  const path = url.pathname
  const parts = path.match(/\/([^\/]+)\/(.*)/)
  
  if (!parts) {
    c.status(400)
    return c.text("Invalid proxy URL format. Use /domain.com/path/to/repo")
  }

  const [, domain, remainingPath] = parts
  
  // Determine protocol based on insecure origins configuration
  const insecureOrigins = (env.INSECURE_HTTP_ORIGINS || '').split(',')
  const protocol = insecureOrigins.includes(domain) ? 'http' : 'https'
  const targetUrl = `${protocol}://${domain}/${remainingPath}${url.search}`

  try {
    // Prepare headers for proxy request
    const allowedHeaders = [
      'accept-encoding', 'accept-language', 'accept', 'authorization',
      'cache-control', 'connection', 'content-length', 'content-type',
      'git-protocol', 'pragma', 'range', 'referer', 'user-agent'
    ]

    const proxyHeaders: Record<string, string> = {}
    
    // Copy allowed headers from the original request
    for (const header of allowedHeaders) {
      const value = request.headers.get(header)
      if (value) {
        proxyHeaders[header] = value
      }
    }

    // CRITICAL: Ensure Authorization header is forwarded (case-insensitive)
    const authHeader = request.headers.get('Authorization') || request.headers.get('authorization')
    if (authHeader) {
      proxyHeaders['Authorization'] = authHeader
      if (enableLogging) {
        console.log(`🔐 AUTHORIZATION: Added auth header (${authHeader.substring(0, 15)}...)`)
      }
    }

    // Set proper User-Agent for Git if not already set or not Git-specific
    if (!proxyHeaders['user-agent'] || !proxyHeaders['user-agent'].startsWith('git/')) {
      proxyHeaders['user-agent'] = 'git/@hono-git/cors-proxy'
    }

    if (enableLogging) {
      console.log(`🌐 PROXYING: ${targetUrl}`)
    }

    // Make proxy request to target Git repository
    const response = await fetch(targetUrl, {
      method: request.method,
      headers: proxyHeaders,
      body: request.body,
      redirect: 'manual'
    })

    c.status(response.status)

    // Copy relevant response headers
    const exposeHeaders = ['content-type', 'content-length', 'cache-control', 'etag', 'location']
    
    for (const header of exposeHeaders) {
      const value = response.headers.get(header)
      if (value && header !== 'content-length') {
        c.header(header, value)
      }
    }

    // Handle redirects by converting absolute URLs to relative
    if (response.headers.has('location')) {
      const newUrl = response.headers.get('location')!.replace(/^https?:\/\//, '/')
      c.header('location', newUrl)
    }

    if (enableLogging) {
      console.log(`✅ PROXY SUCCESS: ${response.status} ${response.statusText}`)
    }
    
    // Return the response body directly
    const responseBody = await response.arrayBuffer()
    return c.body(responseBody)

  } catch (error) {
    console.error('❌ PROXY ERROR:', error)
    c.status(500)
    return c.text("Internal proxy error")
  }
}

// Create Hono app
const app = new Hono<{ Bindings: Env }>()

// Display server configuration (only in development)
const displayConfig = (env: Env) => {
  const port = env.PORT || '3000'
  console.log(`🦊 Git CORS Proxy Server (Hono) is running at http://localhost:${port}`)
  console.log(`📋 Allowed Origins: ${env.ALLOWED_ORIGINS || 'https://fluxly.app'}`)
  console.log(`🌐 CORS Allow Localhost: ${env.CORS_ALLOW_LOCALHOST || 'true'}`)
  console.log(`📝 CORS Enable Logging: ${env.CORS_ENABLE_LOGGING || 'false'}`)
  
  if (env.CORS_ENABLE_LOGGING?.toLowerCase() === 'true') {
    console.log(`🔧 Debug logging enabled for CORS operations`)
    console.log(`🔒 Insecure HTTP Origins: ${env.INSECURE_HTTP_ORIGINS || 'None'}`)
  }
}

// Health endpoint (ported from health plugin)
app.get('/health', (c) => {
  const env = c.env
  const enableLogging = env.CORS_ENABLE_LOGGING?.toLowerCase() === 'true'
  
  if (enableLogging) {
    console.log(`🔍 HEALTH: Health check requested`)
  }
  
  return c.json({
    status: 'healthy',
    service: 'Fluxly-CCS',
    version: '2.0.0-hono',
    framework: 'Hono'
  })
})

// Root endpoint with information
app.get('/', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Git CORS Proxy (Hono)</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .container { max-width: 800px; margin: 0 auto; }
        .header { color: #2563eb; }
        .code { background: #f3f4f6; padding: 20px; border-radius: 8px; }
        .method { color: #059669; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1 class="header">🦊 Git CORS Proxy Server (Hono)</h1>
        <p>This server provides CORS-enabled proxy access to Git repositories.</p>
        
        <h2>Usage</h2>
        <div class="code">
          <p><span class="method">GET/POST</span> /{domain}/{path/to/repo}</p>
          <p><strong>Example:</strong> /github.com/user/repo.git/info/refs?service=git-upload-pack</p>
        </div>
        
        <h2>Features</h2>
        <ul>
          <li>✅ CORS support for web applications</li>
          <li>✅ Git protocol proxy (upload-pack, receive-pack)</li>
          <li>✅ Authentication header forwarding</li>
          <li>✅ Secure origin validation</li>
          <li>✅ Optimized for Cloudflare Workers</li>
        </ul>
        
        <h2>Health</h2>
        <p>Check server status: <a href="/health">/health</a></p>
        
        <hr>
        <p><em>Powered by Hono • Ported from ElysiaJS</em></p>
      </div>
    </body>
    </html>
  `)
})

// OPTIONS preflight handler
app.options('/*', (c) => {
  const env = c.env
  const enableLogging = env.CORS_ENABLE_LOGGING?.toLowerCase() === 'true'
  const allowedOrigins = env.ALLOWED_ORIGINS ? env.ALLOWED_ORIGINS.split(',').map(o => o.trim()) : ['https://fluxly.app']
  const allowLocalhost = env.CORS_ALLOW_LOCALHOST?.toLowerCase() !== 'false'
  
  const origin = c.req.header('origin')
  const corsAdded = addCorsHeaders(c, origin, isOriginAllowed(origin, allowedOrigins, allowLocalhost))
  
  if (enableLogging) {
    console.log(`🔍 OPTIONS: Origin "${origin}" - CORS ${corsAdded ? 'ALLOWED' : 'BLOCKED'}`)
  }
  
  c.status(204)
  return c.text('')
})

// Universal handler for all HTTP methods
app.all('/*', async (c) => {
  const env = c.env
  const request = c.req.raw
  const url = new URL(request.url)
  const origin = c.req.header('origin')
  const method = request.method
  const enableLogging = env.CORS_ENABLE_LOGGING?.toLowerCase() === 'true'
  
  // Parse configuration
  const allowedOrigins = env.ALLOWED_ORIGINS ? env.ALLOWED_ORIGINS.split(',').map(o => o.trim()) : ['https://fluxly.app']
  const allowLocalhost = env.CORS_ALLOW_LOCALHOST?.toLowerCase() !== 'false'
  
  // Always add CORS headers first
  const corsAdded = addCorsHeaders(c, origin, isOriginAllowed(origin, allowedOrigins, allowLocalhost))
  if (!corsAdded) {
    if (enableLogging) {
      console.log(`🚫 ${method}: Origin "${origin}" - BLOCKED`)
    }
    c.status(403)
    return c.json({ error: 'Forbidden - Origin not allowed' })
  }

  // Check if this is a Git request
  if (!isGitRequest(request, url)) {
    if (enableLogging) {
      console.log(`📝 ${method}: ${url.pathname} - Not a Git request`)
    }
    
    // For POST requests to non-Git endpoints, return 403 (more restrictive)
    if (method === 'POST') {
      c.status(403)
      return c.json({ error: 'Forbidden - Not a Git request' })
    }
    
    // For GET and other methods, return informational response
    return c.json({
      message: 'Not a Git request',
      url: request.url,
      method: method,
      isGit: false,
      framework: 'Hono'
    })
  }

  // Log method-specific information for Git requests
  if (enableLogging && method === 'POST') {
    console.log(`🔍 GIT POST: ${url.pathname} - Proxying...`)
  }
  
  // Handle Git proxy request (works for all HTTP methods)
  return handleGitProxy(c, env)
})

// Only display config in development (not on Cloudflare Workers)
if (typeof process !== 'undefined' && process.env) {
  displayConfig(process.env as Env)
}

export default app
