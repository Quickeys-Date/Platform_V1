import { createServerClient } from '@supabase/ssr'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { type NextRequest } from 'next/server'

export function createClient() {
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )
}

export function createClientFromRequest(request: NextRequest) {
  // Get all cookies from request
  const allCookies = request.cookies.getAll()
  
  // Find the auth cookie
  const authCookie = allCookies.find(c => c.name.includes('auth-token'))
  
  let accessToken: string | undefined
  
  if (authCookie) {
    try {
      let jsonStr: string
      const val = authCookie.value
      
      if (val.startsWith('base64-')) {
        // New format: base64-{base64encoded}
        jsonStr = Buffer.from(val.slice(7), 'base64').toString('utf8')
      } else {
        // Old format: URL encoded JSON
        jsonStr = decodeURIComponent(val)
      }
      
      const parsed = JSON.parse(jsonStr)
      accessToken = parsed.access_token
    } catch (e) {
      console.error('Cookie parse error:', e)
    }
  }

  // Also check Authorization header (sent by apiFetch)
  const authHeader = request.headers.get('Authorization')
  if (authHeader?.startsWith('Bearer ')) {
    accessToken = authHeader.slice(7)
  }

  if (accessToken) {
    return createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: { persistSession: false, autoRefreshToken: false },
        global: { headers: { Authorization: `Bearer ${accessToken}` } },
      }
    )
  }

  // Fallback to SSR client
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return allCookies },
        setAll() {},
      },
    }
  )
}

export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )
}
