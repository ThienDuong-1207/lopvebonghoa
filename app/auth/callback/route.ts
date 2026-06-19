import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        // Service role client để bypass RLS khi link profile
        const admin = createAdmin(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        )

        // Tự động link auth_user_id nếu chưa có (lần đăng nhập đầu tiên)
        await admin
          .from('profiles')
          .update({
            auth_user_id: user.id,
            full_name: user.user_metadata?.full_name || user.email || 'User',
            avatar_url: user.user_metadata?.avatar_url || null,
          })
          .eq('email', user.email!)
          .eq('is_active', true)
          .is('auth_user_id', null)

        // Lấy profile sau khi đã link
        const { data: profile } = await admin
          .from('profiles')
          .select('role, is_active')
          .eq('auth_user_id', user.id)
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
