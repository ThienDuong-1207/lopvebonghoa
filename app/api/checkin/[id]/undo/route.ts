import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const today = new Date().toISOString().split('T')[0]

  const { data: session } = await supabase
    .from('sessions')
    .select('session_date, checked_in_by')
    .eq('id', params.id)
    .single()

  if (!session) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (session.session_date !== today) {
    return NextResponse.json({ error: 'Chỉ được xoá điểm danh trong ngày' }, { status: 403 })
  }

  await supabase.from('sessions').delete().eq('id', params.id)
  return NextResponse.json({ ok: true })
}
