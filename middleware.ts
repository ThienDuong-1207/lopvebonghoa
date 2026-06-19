import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

const PUBLIC_ROUTES = ['/', '/gallery', '/about', '/dang-ky']
const AUTH_ROUTES = ['/auth/login', '/auth/callback', '/auth/unauthorized', '/auth/signout']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow public and auth routes through without checking
  if (
    PUBLIC_ROUTES.some((r) => pathname === r) ||
    AUTH_ROUTES.some((r) => pathname.startsWith(r))
  ) {
    return NextResponse.next()
  }

  const { supabaseResponse, user, supabase } = await updateSession(request)

  // Not logged in → redirect to login
  if (!user) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  // Fetch role from profiles table
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, is_active')
    .eq('auth_user_id', user.id)
    .single()

  // Profile not found or inactive → unauthorized
  if (!profile || !profile.is_active) {
    return NextResponse.redirect(new URL('/auth/unauthorized', request.url))
  }

  const role = profile.role as 'admin' | 'staff'

  // /admin/* → only admin
  if (pathname.startsWith('/admin') && role !== 'admin') {
    return NextResponse.redirect(new URL('/staff', request.url))
  }

  // /staff/* → only staff
  if (pathname.startsWith('/staff') && role !== 'staff') {
    return NextResponse.redirect(new URL('/admin', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
