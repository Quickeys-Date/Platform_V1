// src/middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const AUTH_TIMEOUT_MS = 4000

async function getUserWithDeadline(supabase: ReturnType<typeof createServerClient>) {
  return Promise.race([
    supabase.auth.getUser(),
    new Promise<null>(resolve => setTimeout(() => resolve(null), AUTH_TIMEOUT_MS)),
  ])
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // API routes authenticate inside their route handlers. Returning here avoids
  // a second remote auth request for every API call made by a page.
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/') ||
    pathname.includes('.') ||
    pathname === '/admin/login'
  ) {
    return NextResponse.next({ request })
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const authResult = await getUserWithDeadline(supabase)

  // Do not leave the whole application on a blank navigation when the auth
  // provider is temporarily unreachable. API routes still enforce access.
  if (!authResult) return supabaseResponse

  const { data: { user } } = authResult
  // Public routes
  const publicRoutes = [
    '/',
    '/auth/signin',
    '/auth/signup',
    '/auth/verify',
    '/auth/verified',
    '/auth/callback',
    '/auth/reset-password',
    '/auth/update-password',
  ]

  if (publicRoutes.includes(pathname)) {
    if (user && pathname === '/') {
      return NextResponse.redirect(new URL('/feed', request.url))
    }
    return supabaseResponse
  }

  // Admin routes
  if (pathname.startsWith('/admin')) {
    if (!user) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, status')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'ADMIN' || profile.status !== 'ACTIVE') {
      return NextResponse.redirect(new URL('/feed', request.url))
    }

    return supabaseResponse
  }

  // Protected routes — need session
  if (!user) {
    return NextResponse.redirect(new URL('/auth/signin', request.url))
  }

  const isDevelopmentOnboardingPreview =
    process.env.NODE_ENV === 'development' &&
    [
      '/auth/age-verification',
      '/auth/pending-approval',
      '/onboarding/profile',
      '/onboarding/welcome',
      '/onboarding/pax',
    ].includes(pathname) &&
    request.nextUrl.searchParams.get('preview') === '1'

  if (isDevelopmentOnboardingPreview) {
    return supabaseResponse
  }

  const { data: onboardingProfile } = await supabase
    .from('profiles')
    .select('role, status, age_confirmed_at, profile_complete, pax_onboarded')
    .eq('id', user.id)
    .single()

  const isAgeVerification = pathname === '/auth/age-verification'
  const isPendingApproval = pathname === '/auth/pending-approval'
  const isBasicInformation = pathname === '/onboarding/profile'
  const isPaxWelcome = pathname === '/onboarding/welcome'
  const isPaxOnboarding = pathname === '/onboarding/pax'

  if (!onboardingProfile || onboardingProfile.status === 'PENDING_EMAIL') {
    if (isAgeVerification) return supabaseResponse
    return NextResponse.redirect(new URL('/auth/age-verification', request.url))
  }

  if (onboardingProfile.status !== 'ACTIVE') {
    if (isPendingApproval) return supabaseResponse
    return NextResponse.redirect(new URL('/auth/pending-approval', request.url))
  }

  // Active administrators can review the normal member experience without
  // completing a separate dating profile. Their Profile page links back to
  // the role-protected admin dashboard.
  if (onboardingProfile.role === 'ADMIN') {
    if (isAgeVerification || isPendingApproval || isBasicInformation || isPaxWelcome || isPaxOnboarding) {
      return NextResponse.redirect(new URL('/feed', request.url))
    }
    return supabaseResponse
  }

  if (!onboardingProfile.profile_complete) {
    if (isBasicInformation || isPaxWelcome) return supabaseResponse

    if (!isPaxWelcome) {
      return NextResponse.redirect(new URL('/onboarding/welcome', request.url))
    }

    return supabaseResponse
  }

  if (!onboardingProfile.pax_onboarded) {
    if (isPaxWelcome || isPaxOnboarding) return supabaseResponse
    return NextResponse.redirect(new URL('/onboarding/welcome', request.url))
  }

  if (isAgeVerification || isPendingApproval || isBasicInformation || isPaxWelcome || isPaxOnboarding) {
    return NextResponse.redirect(new URL('/feed', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
