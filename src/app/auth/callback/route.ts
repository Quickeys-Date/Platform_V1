// src/app/auth/callback/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type')
  const error = searchParams.get('error')

  // Handle error from Supabase (expired/invalid link)
  if (error) {
    return NextResponse.redirect(`${origin}/auth/verify?error_code=otp_expired`)
  }

  const supabase = createClient()

  // Handle PKCE code exchange
  if (code) {
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
    if (!exchangeError && data.user) {
      // Check if profile is complete
      const { data: profile } = await supabase
        .from('profiles')
        .select('profile_complete, pax_onboarded')
        .eq('id', data.user.id)
        .single()

      if (!profile || !profile.profile_complete) {
        return NextResponse.redirect(`${origin}/onboarding/profile`)
      } else if (!profile.pax_onboarded) {
        return NextResponse.redirect(`${origin}/onboarding/pax`)
      } else {
        return NextResponse.redirect(`${origin}/feed`)
      }
    }
  }

  // Handle token hash (email confirmation)
  if (tokenHash && type) {
    const { data, error: otpError } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as any,
    })
    if (!otpError && data.user) {
      return NextResponse.redirect(`${origin}/onboarding/profile`)
    }
  }

  return NextResponse.redirect(`${origin}/auth/verify?error_code=otp_expired`)
}
