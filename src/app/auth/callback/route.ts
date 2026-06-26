import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type')
  const error = searchParams.get('error')

  if (error) {
    return NextResponse.redirect(`${origin}/auth/verify?error_code=otp_expired`)
  }

  const supabase = await createClient()

  if (code) {
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
    if (!exchangeError && data.user) {
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
