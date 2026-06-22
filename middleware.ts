import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

const PUBLIC_ROUTES = ['/', '/gallery', '/about', '/dang-ky']
const AUTH_ROUTES = ['/auth/login', '/auth/callback', '/auth/unauthorized', '/auth/signout']

const ROLE_COOKIE = 'lvst_role'
const ROLE_COOKIE_MAX_AGE = 3600 // 1 hour — RLS still enforces real permissions

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (
    PUBLIC_ROUTES.some((r) => pathname === r) ||
    AUTH_ROUTES.some((r) => pathname.startsWith(r))
  ) {
    return NextResponse.next()
  }

  const { supabaseResponse, user, supabase } = await updateSession(request)

  if (!user) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  // Fast path: read role from cookie (avoids DB query on every request)
  const cachedRole = request.cookies.get(ROLE_COOKIE)?.value as 'admin' | 'staff' | undefined

  let role: 'admin' | 'staff'

  if (cachedRole === 'admin' || cachedRole === 'staff') {
    role = cachedRole
  } else {
    // Slow path: query DB and cache result in cookie
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, is_active')
      .eq('auth_user_id', user.id)
      .single()

    if (!profile || !profile.is_active) {
      return NextResponse.redirect(new URL('/auth/unauthorized', request.url))
    }

    role = profile.role as 'admin' | 'staff'

    supabaseResponse.cookies.set(ROLE_COOKIE, role, {
      httpOnly: true,
      sameSite: 'strict',
      maxAge: ROLE_COOKIE_MAX_AGE,
      path: '/',
    })
  }

  if (pathname.startsWith('/admin') && role !== 'admin') {
    return NextResponse.redirect(new URL('/staff', request.url))
  }
  if (pathname.startsWith('/staff') && role !== 'staff') {
    return NextResponse.redirect(new URL('/admin', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
