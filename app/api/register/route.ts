import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const body = await request.json()
  const { child_name, child_age, parent_name, phone, preferred_slot, message } = body

  if (!child_name || !parent_name || !phone) {
    return NextResponse.json({ error: 'Thiếu thông tin bắt buộc' }, { status: 400 })
  }

  const supabase = createClient()
  const { data, error } = await supabase
    .from('registrations')
    .insert({
      child_name,
      child_age: child_age ? Number(child_age) : null,
      parent_name,
      phone,
      preferred_slot: preferred_slot || null,
      message: message || null,
      status: 'pending',
    })
    .select('id')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ id: data.id }, { status: 201 })
}
