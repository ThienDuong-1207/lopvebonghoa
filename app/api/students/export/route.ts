import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
import { formatDays } from '@/lib/types/database'

export async function GET() {
  const supabase = createClient()

  const { data: students } = await supabase
    .from('students')
    .select('*, parents(full_name, phone, phone_2, address), classes(name, days_of_week, time_start, time_end)')
    .order('full_name')

  const rows = (students ?? []).map((s: {
    full_name: string
    nickname: string | null
    age: number | null
    notes: string | null
    status: string
    parents: { full_name: string; phone: string; phone_2: string | null; address: string | null } | null
    classes: { name: string; days_of_week: number[]; time_start: string; time_end: string } | null
  }) => ({
    'Họ tên học sinh': s.full_name,
    'Biệt danh':       s.nickname ?? '',
    'Tuổi':            s.age ?? '',
    'Lớp học':         s.classes?.name ?? '',
    'Lịch học':        s.classes ? formatDays(s.classes.days_of_week) : '',
    'Giờ học':         s.classes ? `${s.classes.time_start.slice(0,5)}–${s.classes.time_end.slice(0,5)}` : '',
    'Trạng thái':      s.status,
    'Ghi chú':         s.notes ?? '',
    'Tên phụ huynh':   s.parents?.full_name ?? '',
    'SĐT Zalo':        s.parents?.phone ?? '',
    'SĐT phụ':         s.parents?.phone_2 ?? '',
    'Địa chỉ':         s.parents?.address ?? '',
  }))

  const ws = XLSX.utils.json_to_sheet(rows)
  ws['!cols'] = [20, 15, 5, 18, 15, 12, 12, 25, 20, 14, 14, 30].map((w) => ({ wch: w }))

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Danh sách học sinh')

  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
  const date = new Date().toISOString().split('T')[0]

  return new NextResponse(buf, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="hoc-sinh-${date}.xlsx"`,
    },
  })
}
