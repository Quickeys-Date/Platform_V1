// src/lib/api.ts
// Client-side fetch wrapper that sends auth token in Authorization header
'use client'
import { createClient } from '@/lib/supabase/client'

export async function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {}),
  }

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
  }

  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`
  }

  return fetch(url, { ...options, headers })
}
