import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (!code) {
    return NextResponse.redirect(`${origin}/auth/unauthorized?reason=no_code`)
  }

  const supabase = createClient()
  const { error: sessionError } = await supabase.auth.exchangeCodeForSession(code)

  if (sessionError) {
    return NextResponse.redirect(`${origin}/auth/unauthorized?reason=session`)
  }

  const { data: { user } } = await supabase.auth.getUser()

  if (!user?.email) {
    return NextResponse.redirect(`${origin}/auth/unauthorized?reason=no_user`)
  }

  const admin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Bước 1: Tìm profile theo email (case-insensitive, chưa linked)
  const { data: unlinkedProfile, error: findError } = await admin
    .from('profiles')
    .select('id, role, is_active')
    .ilike('email', user.email)
    .is('auth_user_id', null)
    .eq('is_active', true)
    .maybeSingle()

  if (unlinkedProfile) {
    const { error: updateError } = await admin
      .from('profiles')
      .update({
        auth_user_id: user.id,
        full_name: user.user_metadata?.full_name || user.email,
        avatar_url: user.user_metadata?.avatar_url || null,
      })
      .eq('id', unlinkedProfile.id)
  }

  // Bước 3: Lấy profile đã linked (dù vừa link hay đã link từ trước)
  const { data: profile, error: profileError } = await admin
    .from('profiles')
    .select('role, is_active')
    .eq('auth_user_id', user.id)
    .maybeSingle()

  if (!profile) {
    return NextResponse.redirect(`${origin}/auth/unauthorized?reason=no_profile`)
  }
  if (!profile.is_active) {
    return NextResponse.redirect(`${origin}/auth/unauthorized?reason=inactive`)
  }

  if (profile.role === 'admin') return NextResponse.redirect(`${origin}/admin`)
  if (profile.role === 'staff') return NextResponse.redirect(`${origin}/staff`)

  return NextResponse.redirect(`${origin}/auth/unauthorized?reason=unknown_role`)
}
