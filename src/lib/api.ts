// src/lib/api.ts
// Reads JWT directly from cookie and sends as Authorization header

function getAccessTokenFromCookie(): string | null {
  try {
    const cookies = document.cookie.split(';')
    const authCookie = cookies.find(c => c.trim().includes('sb-') && c.includes('auth-token'))
    if (!authCookie) return null

    const value = authCookie.split('=').slice(1).join('=').trim()
    
    let jsonStr: string
    if (value.startsWith('base64-')) {
      jsonStr = atob(value.slice(7))
    } else {
      jsonStr = decodeURIComponent(value)
    }

    const parsed = JSON.parse(jsonStr)
    return parsed.access_token || null
  } catch {
    return null
  }
}

export async function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = getAccessTokenFromCookie()

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {}),
  }

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const controller = new AbortController()
  // Development can spend several seconds compiling a newly edited API route.
  // Allow that first compilation to finish instead of showing a false network
  // error; production requests still fail fast when the service is unavailable.
  const requestTimeout = process.env.NODE_ENV === 'development' ? 45000 : 12000
  const timeout = window.setTimeout(() => controller.abort(), requestTimeout)

  if (options.signal) {
    if (options.signal.aborted) controller.abort()
    else options.signal.addEventListener('abort', () => controller.abort(), { once: true })
  }

  try {
    return await fetch(url, {
      ...options,
      headers,
      credentials: 'same-origin',
      signal: controller.signal,
    })
  } finally {
    window.clearTimeout(timeout)
  }
}
