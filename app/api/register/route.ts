import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const body = await request.json()
  const { child_name, birth_year, parent_name, phone, message } = body

  if (!child_name || !parent_name || !phone) {
    return NextResponse.json({ error: 'Thiếu thông tin bắt buộc' }, { status: 400 })
  }

  const currentYear = new Date().getFullYear()
  const child_age = birth_year ? currentYear - Number(birth_year) : null

  const supabase = createClient()
  const { data, error } = await supabase
    .from('registrations')
    .insert({
      child_name:  child_name.trim(),
      child_age,
      parent_name: parent_name.trim(),
      phone:       phone.trim(),
      message:     message?.trim() || null,
      status:      'pending',
    })
    .select('id')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ id: data.id }, { status: 201 })
}
