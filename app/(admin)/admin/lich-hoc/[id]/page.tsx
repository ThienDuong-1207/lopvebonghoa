export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import Topbar from '@/components/admin/Topbar'
import { redirect, notFound } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import type { Profile } from '@/lib/types/database'

const DAYS_OPTIONS = [
  { dow: 1, label: 'T2' }, { dow: 2, label: 'T3' }, { dow: 3, label: 'T4' },
  { dow: 4, label: 'T5' }, { dow: 5, label: 'T6' }, { dow: 6, label: 'T7' },
  { dow: 0, label: 'CN' },
]

async function updateClass(id: string, formData: FormData) {
  'use server'
  const supabase = createClient()
  const days = formData.getAll('days_of_week').map(Number)
  if (days.length === 0) redirect(`/admin/lich-hoc/${id}?error=no_days`)

  const staffIds = formData.getAll('assigned_staff_ids') as string[]

  await supabase.from('classes').update({
    name:         (formData.get('name') as string).trim(),
    days_of_week: days,
    time_start:   formData.get('time_start') as string,
    time_end:     formData.get('time_end') as string,
    max_capacity: Number(formData.get('max_capacity')),
  }).eq('id', id)

  // Ghi lại toàn bộ danh sách trợ giảng phụ trách lớp này
  await supabase.from('class_staff').delete().eq('class_id', id)
  if (staffIds.length > 0) {
    await supabase.from('class_staff').insert(staffIds.map((staff_id) => ({ class_id: id, staff_id })))
  }

  redirect('/admin/lich-hoc')
}

export default async function EditClassPage({ params }: { params: { id: string } }) {
  const supabase = createClient()

  const [{ data: cls }, { data: staffList }, { data: assignedRows }] = await Promise.all([
    supabase.from('classes').select('*').eq('id', params.id).single(),
    supabase.from('profiles').select('id, full_name').eq('role', 'staff').eq('is_active', true),
    supabase.from('class_staff').select('staff_id').eq('class_id', params.id),
  ])

  if (!cls) notFound()

  const assignedStaffIds = new Set((assignedRows ?? []).map((r) => r.staff_id))

  const boundUpdate = updateClass.bind(null, params.id)

  return (
    <>
      <Topbar title="Chỉnh sửa lớp học" backHref="/admin/lich-hoc" backLabel="Lịch & Lớp học" />
      <div className="p-6">
        <div className="mx-auto max-w-md">
          <form action={boundUpdate} className="space-y-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Tên lớp *</label>
              <Input name="name" required defaultValue={cls.name} />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Ngày học * <span className="font-normal text-gray-400 text-xs">(chọn 1 hoặc nhiều ngày)</span>
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {DAYS_OPTIONS.map(({ dow, label }) => (
                  <label key={dow} className="relative flex cursor-pointer select-none">
                    <input
                      type="checkbox"
                      name="days_of_week"
                      value={dow}
                      defaultChecked={cls.days_of_week.includes(dow)}
                      className="peer sr-only"
                    />
                    <span className="flex h-9 w-full items-center justify-center rounded-lg border border-gray-200 text-xs font-semibold text-gray-500 transition-colors peer-checked:border-[#0D2545] peer-checked:bg-[#0D2545] peer-checked:text-white dark:border-gray-600 dark:text-gray-400 dark:peer-checked:border-[#C9A84C] dark:peer-checked:bg-[#C9A84C]/20 dark:peer-checked:text-[#C9A84C]">
                      {label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Giờ bắt đầu</label>
                <Input name="time_start" type="time" defaultValue={cls.time_start.slice(0, 5)} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Giờ kết thúc</label>
                <Input name="time_end" type="time" defaultValue={cls.time_end.slice(0, 5)} />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Sĩ số tối đa</label>
              <Input name="max_capacity" type="number" min={1} defaultValue={cls.max_capacity} />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Trợ giảng phụ trách <span className="font-normal text-gray-400 text-xs">(chọn 0, 1 hoặc nhiều)</span>
              </label>
              <div className="space-y-1">
                {(staffList ?? []).length === 0 && (
                  <p className="text-xs text-gray-400">Chưa có trợ giảng nào.</p>
                )}
                {(staffList ?? []).map((s: Pick<Profile, 'id' | 'full_name'>) => (
                  <label key={s.id} className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm has-[:checked]:border-[#0D2545] has-[:checked]:bg-[#0D2545]/5 dark:border-gray-600 dark:has-[:checked]:border-[#C9A84C] dark:has-[:checked]:bg-[#C9A84C]/10">
                    <input
                      type="checkbox"
                      name="assigned_staff_ids"
                      value={s.id}
                      defaultChecked={assignedStaffIds.has(s.id)}
                      className="h-4 w-4 rounded border-gray-300 text-[#0D2545] focus:ring-[#0D2545]"
                    />
                    <span className="text-gray-700 dark:text-gray-200">{s.full_name}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" className="bg-[#C9A84C] text-white hover:bg-[#C9A84C]/90">
                Lưu thay đổi
              </Button>
              <Link href="/admin/lich-hoc">
                <Button type="button" variant="outline">Hủy</Button>
              </Link>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
