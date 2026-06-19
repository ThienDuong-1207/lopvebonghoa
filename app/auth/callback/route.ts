import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        // Check profile exists and is active
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, is_active')
          .eq('id', user.id)
          .single()

        if (profile && profile.is_active) {
          if (profile.role === 'admin') {
            return NextResponse.redirect(`${origin}/admin`)
          }
          if (profile.role === 'staff') {
            return NextResponse.redirect(`${origin}/staff`)
          }
        }
      }

      return NextResponse.redirect(`${origin}/auth/unauthorized`)
    }
  }

  return NextResponse.redirect(`${origin}/auth/unauthorized`)
}
