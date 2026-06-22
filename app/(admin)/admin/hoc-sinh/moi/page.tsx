export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import Topbar from '@/components/admin/Topbar'
import { redirect } from 'next/navigation'
import StudentForm from './StudentForm'

async function createStudent(_prev: string | null, formData: FormData): Promise<string | null> {
  'use server'
  const supabase = createClient()

  const fullName = (formData.get('full_name') as string)?.trim()
  if (!fullName) return 'Vui lòng nhập họ tên học sinh.'

  const existingParentId = (formData.get('existing_parent_id') as string) || null
  const parentName = (formData.get('parent_name') as string)?.trim()
  const parentPhone = (formData.get('parent_phone') as string)?.trim()
  const parentPhone2 = (formData.get('parent_phone_2') as string)?.trim() || null
  const parentAddress = (formData.get('parent_address') as string)?.trim() || null

  let parentId: string | null = existingParentId

  if (!parentId) {
    if (!parentName) {
      return 'Vui lòng chọn phụ huynh có sẵn hoặc nhập tên phụ huynh mới.'
    }
    const { data: newParent, error: parentErr } = await supabase
      .from('parents')
      .insert({ full_name: parentName, phone: parentPhone, phone_2: parentPhone2, address: parentAddress })
      .select('id')
      .single()
    if (parentErr || !newParent) return `Không thể tạo phụ huynh: ${parentErr?.message ?? 'Lỗi không xác định'}`
    parentId = newParent.id
  }

  const { error: studentErr } = await supabase.from('students').insert({
    full_name: fullName,
    nickname:  (formData.get('nickname') as string)?.trim() || null,
    age:       formData.get('age') ? Number(formData.get('age')) : null,
    parent_id: parentId,
    class_id:  (formData.get('class_id') as string) || null,
    notes:     (formData.get('notes') as string)?.trim() || null,
    status:    'active',
  })

  if (studentErr) return `Không thể tạo học sinh: ${studentErr.message}`

  redirect('/admin/hoc-sinh')
}

export default async function TaoHocSinhPage() {
  const supabase = createClient()
  const [{ data: classes }, { data: parents }] = await Promise.all([
    supabase.from('classes').select('*').eq('is_active', true).order('name'),
    supabase.from('parents').select('id, full_name, phone').order('full_name'),
  ])

  return (
    <>
      <Topbar title="Thêm học sinh mới" backHref="/admin/hoc-sinh" backLabel="Học sinh" />
      <div className="min-h-screen bg-gray-50 p-6 dark:bg-gray-900">
        <div className="mx-auto max-w-xl">
          <StudentForm classes={classes ?? []} parents={parents ?? []} action={createStudent} />
        </div>
      </div>
    </>
  )
}
