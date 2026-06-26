import { createServerClient } from '@supabase/ssr'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { type NextRequest } from 'next/server'

// For Server Components
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

function extractAccessToken(cookieValue: string): string | undefined {
  try {
    // Handle base64- prefix (new Supabase format)
    if (cookieValue.startsWith('base64-')) {
      const base64 = cookieValue.slice(7)
      const decoded = Buffer.from(base64, 'base64').toString('utf-8')
      const parsed = JSON.parse(decoded)
      return parsed.access_token
    }
    // Handle URL-encoded JSON (old format)
    const decoded = decodeURIComponent(cookieValue)
    const parsed = JSON.parse(decoded)
    return parsed.access_token
  } catch {
    return undefined
  }
}

// For API Route Handlers
export function createClientFromRequest(request: NextRequest) {
  const projectRef = process.env.NEXT_PUBLIC_SUPABASE_URL!.split('//')[1].split('.')[0]
  const authCookieName = `sb-${projectRef}-auth-token`
  const cookieValue = request.cookies.get(authCookieName)?.value

  let accessToken: string | undefined
  if (cookieValue) {
    accessToken = extractAccessToken(cookieValue)
  }

  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      global: {
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
      },
    }
  )
}

// Admin client
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { persistSession: false, autoRefreshToken: false }
    }
  )
}
