import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import * as XLSX from 'xlsx'

export async function GET() {
  const supabase = createClient()

  const { data: students, error } = await supabase
    .from('students')
    .select('*, parents(full_name, phone, phone_2, address), slots(name)')
    .order('full_name')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const rows = (students ?? []).map((s: any) => ({
    'Họ tên học sinh': s.full_name,
    'Biệt danh': s.nickname ?? '',
    'Tuổi': s.age ?? '',
    'Ca học': s.slots?.name ?? '',
    'Trạng thái': s.status === 'active' ? 'Đang học' : s.status === 'paused' ? 'Tạm nghỉ' : 'Nghỉ học',
    'Ghi chú': s.notes ?? '',
    'Tên phụ huynh': s.parents?.full_name ?? '',
    'SĐT Zalo': s.parents?.phone ?? '',
    'SĐT phụ': s.parents?.phone_2 ?? '',
    'Địa chỉ': s.parents?.address ?? '',
  }))

  const wb = XLSX.utils.book_new()

  // Sheet 1: data
  const ws = XLSX.utils.json_to_sheet(rows)
  ws['!cols'] = [
    { wch: 25 }, { wch: 12 }, { wch: 6 }, { wch: 18 },
    { wch: 12 }, { wch: 25 }, { wch: 22 }, { wch: 14 }, { wch: 14 }, { wch: 40 },
  ]
  XLSX.utils.book_append_sheet(wb, ws, 'Danh sách học sinh')

  // Sheet 2: hướng dẫn
  const guide = XLSX.utils.aoa_to_sheet([
    ['HƯỚNG DẪN IMPORT'],
    [],
    ['Cột bắt buộc (*)', 'Mô tả'],
    ['Họ tên học sinh *', 'Tên đầy đủ của học sinh'],
    ['Tên phụ huynh *', 'Tên phụ huynh / người giám hộ'],
    ['SĐT Zalo *', 'Số điện thoại Zalo (dùng để nhận diện, tránh trùng lặp)'],
    [],
    ['Cột tùy chọn', 'Mô tả'],
    ['Biệt danh', 'Tên gọi tắt'],
    ['Tuổi', 'Số tuổi (4–12)'],
    ['Ca học', 'Tên ca học chính xác (xem sheet "Ca học")'],
    ['Ghi chú', 'Thông tin thêm'],
    ['SĐT phụ', 'SĐT dự phòng'],
    [],
    ['Lưu ý:', 'Nếu SĐT Zalo đã tồn tại → phụ huynh sẽ được tái sử dụng'],
    ['', 'Nếu (Họ tên HS + SĐT PH) đã tồn tại → học sinh sẽ được CẬP NHẬT'],
    ['', 'Nếu chưa có → học sinh sẽ được TẠO MỚI'],
  ])
  guide['!cols'] = [{ wch: 25 }, { wch: 55 }]
  XLSX.utils.book_append_sheet(wb, guide, 'Hướng dẫn')

  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
  const now = new Date().toISOString().split('T')[0]

  return new NextResponse(buf, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="hoc-sinh-${now}.xlsx"`,
    },
  })
}
