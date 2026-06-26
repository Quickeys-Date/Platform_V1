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

  return fetch(url, { ...options, headers })
}
