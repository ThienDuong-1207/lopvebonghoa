import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import * as XLSX from 'xlsx'

export async function GET() {
  const supabase = createClient()
  const { data: slots } = await supabase.from('slots').select('name').eq('is_active', true).order('name')

  const wb = XLSX.utils.book_new()

  // Sheet 1: template với 3 hàng ví dụ
  const headers = [
    'Họ tên học sinh *',
    'Biệt danh',
    'Tuổi',
    'Ca học',
    'Ghi chú',
    'Tên phụ huynh *',
    'SĐT Zalo *',
    'SĐT phụ',
  ]
  const examples = [
    ['Nguyễn Văn An', 'An', 6, 'Thứ 2 sáng', '', 'Nguyễn Thị Bình', '0901234567', ''],
    ['Trần Thị Bảo', 'Bảo', 5, 'Thứ 4 chiều', 'Thích vẽ màu nước', 'Trần Văn Cường', '0912345678', '0987654321'],
    ['', '', '', '', '', '', '', ''],
  ]

  const ws = XLSX.utils.aoa_to_sheet([headers, ...examples])
  ws['!cols'] = [
    { wch: 25 }, { wch: 12 }, { wch: 6 }, { wch: 18 },
    { wch: 25 }, { wch: 22 }, { wch: 14 }, { wch: 14 },
  ]
  XLSX.utils.book_append_sheet(wb, ws, 'Template')

  // Sheet 2: danh sách ca học
  const slotRows = [
    ['Tên ca học (copy chính xác vào cột Ca học)'],
    ...((slots ?? []).map((s: { name: string }) => [s.name])),
  ]
  const wsSlots = XLSX.utils.aoa_to_sheet(slotRows)
  wsSlots['!cols'] = [{ wch: 30 }]
  XLSX.utils.book_append_sheet(wb, wsSlots, 'Ca học')

  // Sheet 3: hướng dẫn
  const guide = XLSX.utils.aoa_to_sheet([
    ['HƯỚNG DẪN SỬ DỤNG TEMPLATE'],
    [],
    ['1. Điền thông tin vào sheet "Template"'],
    ['2. Cột có dấu * là bắt buộc'],
    ['3. Tên ca học: copy chính xác từ sheet "Ca học"'],
    ['4. SĐT Zalo dùng để nhận diện phụ huynh — tránh trùng lặp'],
    ['5. Upload file vào trang Học sinh → Nhập từ Excel'],
    [],
    ['Kết quả sau import:'],
    ['  • TẠO MỚI: học sinh chưa có trong hệ thống'],
    ['  • CẬP NHẬT: học sinh đã có (cùng tên + SĐT phụ huynh)'],
  ])
  wsSlots['!cols'] = [{ wch: 50 }]
  XLSX.utils.book_append_sheet(wb, guide, 'Hướng dẫn')

  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

  return new NextResponse(buf, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="template-hoc-sinh.xlsx"',
    },
  })
}
