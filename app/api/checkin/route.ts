import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { student_id, package_id, slot_id, session_date, status = 'present', note } = body

  // Kiểm tra đã điểm danh chưa
  const { data: existing } = await supabase
    .from('sessions')
    .select('id')
    .eq('student_id', student_id)
    .eq('slot_id', slot_id)
    .eq('session_date', session_date)
    .single()

  if (existing) {
    return NextResponse.json({ error: 'Đã điểm danh rồi' }, { status: 409 })
  }

  const { data, error } = await supabase
    .from('sessions')
    .insert({
      package_id,
      student_id,
      slot_id,
      session_date,
      checked_in_by: user.id,
      status,
      note: note || null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data, { status: 201 })
}
