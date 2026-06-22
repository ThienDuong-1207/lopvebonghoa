export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import Topbar from '@/components/admin/Topbar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import type { Class } from '@/lib/types/database'
import { formatDays } from '@/lib/types/database'

async function updateStudent(id: string, formData: FormData) {
  'use server'
  const supabase = createClient()

  await Promise.all([
    supabase.from('students').update({
      full_name: (formData.get('full_name') as string).trim(),
      nickname:  (formData.get('nickname') as string).trim() || null,
      age:       formData.get('age') ? Number(formData.get('age')) : null,
      class_id:  (formData.get('class_id') as string) || null,
      notes:     (formData.get('notes') as string).trim() || null,
    }).eq('id', id),

    supabase.from('parents').update({
      full_name: (formData.get('parent_name') as string).trim(),
      phone:     (formData.get('parent_phone') as string).trim(),
      phone_2:   (formData.get('parent_phone_2') as string).trim() || null,
      address:   (formData.get('parent_address') as string).trim() || null,
    }).eq('id', formData.get('parent_id') as string),
  ])

  redirect(`/admin/hoc-sinh/${id}`)
}

export default async function ChinhSuaHocSinhPage({ params }: { params: { id: string } }) {
  const supabase = createClient()

  const [{ data: student }, { data: classes }] = await Promise.all([
    supabase
      .from('students')
      .select('*, parents(id, full_name, phone, phone_2, address)')
      .eq('id', params.id)
      .single(),
    supabase.from('classes').select('id, name, days_of_week, time_start, time_end').eq('is_active', true).order('name'),
  ])

  if (!student) notFound()

  const boundUpdate = updateStudent.bind(null, params.id)

  return (
    <>
      <Topbar title="Chỉnh sửa học sinh" backHref={`/admin/hoc-sinh/${params.id}`} backLabel={student.full_name} />
      <div className="p-6">
        <div className="mx-auto max-w-xl">
          <form action={boundUpdate} className="space-y-4">
            {/* Thông tin học sinh */}
            <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-700 dark:bg-gray-800/50">
              <h3 className="mb-3 font-semibold text-gray-700 dark:text-gray-200">Thông tin học sinh</h3>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Họ tên *</label>
                    <Input name="full_name" required defaultValue={student.full_name} />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Biệt danh</label>
                    <Input name="nickname" defaultValue={student.nickname ?? ''} />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Tuổi</label>
                  <Input name="age" type="number" min={4} max={12} defaultValue={student.age ?? ''} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Lớp học</label>
                  <select
                    name="class_id"
                    defaultValue={student.class_id ?? ''}
                    className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                  >
                    <option value="">Chưa xếp lớp</option>
                    {(classes ?? []).map((c: Pick<Class, 'id' | 'name' | 'days_of_week' | 'time_start' | 'time_end'>) => (
                      <option key={c.id} value={c.id}>
                        {c.name} — {formatDays(c.days_of_week)} · {c.time_start.slice(0, 5)}–{c.time_end.slice(0, 5)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Ghi chú</label>
                  <Textarea name="notes" defaultValue={student.notes ?? ''} placeholder="Dị ứng, sở thích vẽ, ..." />
                </div>
              </div>
            </div>

            {/* Thông tin phụ huynh */}
            <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-700 dark:bg-gray-800/50">
              <h3 className="mb-3 font-semibold text-gray-700 dark:text-gray-200">Thông tin phụ huynh</h3>
              <input type="hidden" name="parent_id" value={student.parents?.id} />
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Tên phụ huynh *</label>
                    <Input name="parent_name" required defaultValue={student.parents?.full_name ?? ''} />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Số điện thoại *</label>
                    <Input name="parent_phone" type="tel" required defaultValue={student.parents?.phone ?? ''} />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">SĐT phụ</label>
                  <Input name="parent_phone_2" defaultValue={student.parents?.phone_2 ?? ''} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Địa chỉ</label>
                  <Input name="parent_address" defaultValue={student.parents?.address ?? ''} placeholder="123 Đường ABC, Quận Y" />
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" className="bg-[#C9A84C] text-white hover:bg-[#C9A84C]/90">
                Lưu thay đổi
              </Button>
              <Link href={`/admin/hoc-sinh/${params.id}`}>
                <Button type="button" variant="outline">Hủy</Button>
              </Link>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
