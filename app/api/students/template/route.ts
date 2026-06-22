import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
import { formatDays } from '@/lib/types/database'

export async function GET() {
  const supabase = createClient()
  const { data: classes } = await supabase
    .from('classes')
    .select('name, days_of_week, time_start, time_end')
    .eq('is_active', true)
    .order('name')

  // Sheet 1: Template nhập liệu
  const templateRows = [
    {
      'Họ tên học sinh *': 'Nguyễn Văn An',
      'Biệt danh':         'An',
      'Tuổi':              6,
      'Lớp học':           (classes ?? [])[0]?.name ?? 'Tối 2-4-6 A',
      'Ghi chú':           'Thích vẽ động vật',
      'Tên phụ huynh *':   'Nguyễn Thị B',
      'SĐT Zalo *':        '0901234567',
      'SĐT phụ':           '0912345678',
      'Địa chỉ':           '123 Đường ABC, Phường X, Quận Y, TP.HCM',
    },
  ]

  const wsTemplate = XLSX.utils.json_to_sheet(templateRows)
  wsTemplate['!cols'] = [22, 14, 5, 18, 25, 20, 14, 14, 35].map((w) => ({ wch: w }))

  // Sheet 2: Danh sách lớp học để tham khảo
  const classRows = (classes ?? []).map((c: { name: string; days_of_week: number[]; time_start: string; time_end: string }) => ({
    'Tên lớp':   c.name,
    'Lịch học':  formatDays(c.days_of_week),
    'Giờ học':   `${c.time_start.slice(0,5)}–${c.time_end.slice(0,5)}`,
  }))
  const wsClasses = XLSX.utils.json_to_sheet(classRows.length ? classRows : [{ 'Tên lớp': '(Chưa có lớp nào)', 'Lịch học': '', 'Giờ học': '' }])
  wsClasses['!cols'] = [20, 20, 14].map((w) => ({ wch: w }))

  // Sheet 3: Hướng dẫn
  const wsGuide = XLSX.utils.aoa_to_sheet([
    ['HƯỚNG DẪN NHẬP LIỆU'],
    [''],
    ['1. Điền dữ liệu vào sheet "Template"'],
    ['2. Cột có dấu * là bắt buộc'],
    ['3. Cột "Lớp học": nhập đúng tên lớp theo sheet "Danh sách lớp"'],
    ['4. Nếu phụ huynh đã có trong hệ thống (cùng SĐT), học sinh sẽ tự được liên kết'],
    ['5. Học sinh đã tồn tại (cùng tên + phụ huynh) sẽ được CẬP NHẬT, không bị trùng'],
    ['6. Sau khi điền xong, lưu file và nhập vào hệ thống qua nút "Nhập từ Excel"'],
  ])

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, wsTemplate, 'Template')
  XLSX.utils.book_append_sheet(wb, wsClasses, 'Danh sách lớp')
  XLSX.utils.book_append_sheet(wb, wsGuide, 'Hướng dẫn')

  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

  return new NextResponse(buf, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="template-hoc-sinh.xlsx"',
    },
  })
}
