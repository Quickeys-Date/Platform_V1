// src/middleware.ts
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Always pass through these without any checks
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/') ||
    pathname.includes('.') ||
    pathname === '/admin/login'
  ) {
    return NextResponse.next()
  }

  // Cookie name for this Supabase project
  const cookieName = 'sb-rhystpxkmmkxjxhhamxi-auth-token'
  const hasSession = !!request.cookies.get(cookieName)?.value

  // Public routes — always accessible
  const publicRoutes = [
    '/',
    '/auth/signin',
    '/auth/signup',
    '/auth/verify',
    '/auth/callback',
    '/auth/reset-password',
    '/auth/update-password',
  ]

  if (publicRoutes.includes(pathname)) {
    // Only redirect away from landing page if logged in
    // Keep signin/signup always open so any user can sign in/out
    if (hasSession && pathname === '/') {
      return NextResponse.redirect(new URL('/feed', request.url))
    }
    return NextResponse.next()
  }

  // Admin routes
  if (pathname.startsWith('/admin')) {
    if (!hasSession) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
    return NextResponse.next()
  }

  // All other protected routes
  if (!hasSession) {
    return NextResponse.redirect(new URL('/auth/signin', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
