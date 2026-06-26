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

// For API Route Handlers — extracts JWT from cookie and uses it directly
export function createClientFromRequest(request: NextRequest) {
  // Find the auth cookie
  const authCookieName = `sb-${process.env.NEXT_PUBLIC_SUPABASE_URL!.split('//')[1].split('.')[0]}-auth-token`
  const cookieValue = request.cookies.get(authCookieName)?.value

  let accessToken: string | undefined

  if (cookieValue) {
    try {
      const decoded = decodeURIComponent(cookieValue)
      const parsed = JSON.parse(decoded)
      accessToken = parsed.access_token
    } catch {}
  }

  // Create client with the access token
  const client = createSupabaseClient(
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

  return client
}

// Admin client — bypasses RLS
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { persistSession: false, autoRefreshToken: false }
    }
  )
}
