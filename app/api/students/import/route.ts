import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import * as XLSX from 'xlsx'

interface ExcelRow {
  'Họ tên học sinh *'?: string
  'Họ tên học sinh'?:  string
  'Biệt danh'?:        string
  'Tuổi'?:             number | string
  'Lớp học'?:          string
  'Ghi chú'?:          string
  'Tên phụ huynh *'?:  string
  'Tên phụ huynh'?:    string
  'SĐT Zalo *'?:       string
  'SĐT Zalo'?:         string
  'SĐT phụ'?:          string
  'Địa chỉ'?:          string
  [key: string]: unknown
}

function str(v: unknown): string {
  return String(v ?? '').trim()
}

export async function POST(request: Request) {
  const formData = await request.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'Không có file' }, { status: 400 })

  const buf = await file.arrayBuffer()
  const wb = XLSX.read(buf, { type: 'array' })

  const targetSheet =
    wb.SheetNames.find((n) => n === 'Template' || n === 'Danh sách học sinh') ?? wb.SheetNames[0]
  const ws = wb.Sheets[targetSheet]
  const rows = XLSX.utils.sheet_to_json<ExcelRow>(ws, { defval: '' })

  const supabase = createClient()

  // Pre-fetch classes for name → id mapping
  const { data: classes } = await supabase.from('classes').select('id, name').eq('is_active', true)
  const classMap = new Map(
    (classes ?? []).map((c: { id: string; name: string }) => [c.name.toLowerCase().trim(), c.id])
  )

  let created = 0
  let updated = 0
  const errors: string[] = []

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const rowNum = i + 2

    const studentName = str(row['Họ tên học sinh *'] || row['Họ tên học sinh'])
    const parentName  = str(row['Tên phụ huynh *']  || row['Tên phụ huynh'])
    const parentPhone = str(row['SĐT Zalo *']        || row['SĐT Zalo'])
    const nickname    = str(row['Biệt danh'])
    const ageRaw      = str(row['Tuổi'])
    const className   = str(row['Lớp học'])
    const notes       = str(row['Ghi chú'])
    const phone2      = str(row['SĐT phụ'])
    const address     = str(row['Địa chỉ'])

    if (!studentName && !parentPhone) continue

    if (!studentName) { errors.push(`Dòng ${rowNum}: Thiếu họ tên học sinh`); continue }
    if (!parentPhone) { errors.push(`Dòng ${rowNum}: Thiếu SĐT Zalo (${studentName})`); continue }

    const age = ageRaw ? Number(ageRaw) : null
    const classId = className ? (classMap.get(className.toLowerCase().trim()) ?? null) : null
    if (className && !classId) {
      errors.push(`Dòng ${rowNum}: Không tìm thấy lớp "${className}" — bỏ qua trường lớp`)
    }

    // 1. Find or create parent by phone
    let parentId: string
    const { data: existingParent } = await supabase
      .from('parents').select('id').eq('phone', parentPhone).single()

    if (existingParent) {
      parentId = existingParent.id
      if (parentName) {
        await supabase.from('parents')
          .update({ full_name: parentName, phone_2: phone2 || null, address: address || null })
          .eq('id', parentId)
      }
    } else {
      if (!parentName) { errors.push(`Dòng ${rowNum}: Thiếu tên phụ huynh cho SĐT mới ${parentPhone}`); continue }
      const { data: newParent, error: pErr } = await supabase
        .from('parents')
        .insert({ full_name: parentName, phone: parentPhone, phone_2: phone2 || null, address: address || null })
        .select('id').single()
      if (pErr || !newParent) { errors.push(`Dòng ${rowNum}: Lỗi tạo phụ huynh — ${pErr?.message}`); continue }
      parentId = newParent.id
    }

    // 2. Find or upsert student by (full_name + parent_id)
    const { data: existingStudent } = await supabase
      .from('students').select('id').eq('full_name', studentName).eq('parent_id', parentId).single()

    if (existingStudent) {
      const { error: uErr } = await supabase.from('students').update({
        nickname:  nickname || null,
        age:       age || null,
        class_id:  classId,
        notes:     notes || null,
      }).eq('id', existingStudent.id)
      if (uErr) { errors.push(`Dòng ${rowNum}: Lỗi cập nhật "${studentName}" — ${uErr.message}`); continue }
      updated++
    } else {
      const { error: iErr } = await supabase.from('students').insert({
        full_name: studentName,
        nickname:  nickname || null,
        age:       age || null,
        parent_id: parentId,
        class_id:  classId,
        notes:     notes || null,
        status:    'active',
      })
      if (iErr) { errors.push(`Dòng ${rowNum}: Lỗi tạo "${studentName}" — ${iErr.message}`); continue }
      created++
    }
  }

  return NextResponse.json({ created, updated, errors, total: created + updated })
}
