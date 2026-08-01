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
      return NextResponse.redirect(`${origin}/auth/verified`)
    }
  }

  if (tokenHash && type) {
    const { data, error: otpError } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as any,
    })
    if (!otpError && data.user) {
      return NextResponse.redirect(`${origin}/auth/verified`)
    }
  }

  return NextResponse.redirect(`${origin}/auth/verify?error_code=otp_expired`)
}
