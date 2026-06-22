export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import Topbar from '@/components/admin/Topbar'
import { redirect, notFound } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import type { Profile } from '@/lib/types/database'
import { DAY_SHORT, SCHEDULE_PRESETS, detectPreset } from '@/lib/types/database'

const PRESET_DAYS: Record<string, number[]> = {
  '246': [1, 3, 5],
  '357': [2, 4, 6],
  '7':   [6],
  'CN':  [0],
}

async function updateClass(id: string, formData: FormData) {
  'use server'
  const supabase = createClient()
  const preset = formData.get('schedule_preset') as string
  const days = PRESET_DAYS[preset] ?? [6]

  await supabase.from('classes').update({
    name:              (formData.get('name') as string).trim(),
    days_of_week:      days,
    time_start:        formData.get('time_start') as string,
    time_end:          formData.get('time_end') as string,
    max_capacity:      Number(formData.get('max_capacity')),
    assigned_staff_id: (formData.get('assigned_staff_id') as string) || null,
  }).eq('id', id)

  redirect('/admin/lich-hoc')
}

export default async function EditClassPage({ params }: { params: { id: string } }) {
  const supabase = createClient()

  const [{ data: cls }, { data: staffList }] = await Promise.all([
    supabase.from('classes').select('*').eq('id', params.id).single(),
    supabase.from('profiles').select('id, full_name').eq('role', 'staff').eq('is_active', true),
  ])

  if (!cls) notFound()

  const currentPreset = detectPreset(cls.days_of_week)
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
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Lịch học *</label>
              <select
                name="schedule_preset"
                required
                defaultValue={currentPreset !== 'custom' ? currentPreset : '246'}
                className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-700 dark:text-gray-200"
              >
                {SCHEDULE_PRESETS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label} ({p.days.map((d) => DAY_SHORT[d]).join(', ')})
                  </option>
                ))}
              </select>
              {currentPreset === 'custom' && (
                <p className="mt-1 text-xs text-amber-500">
                  Lớp hiện có lịch tùy chỉnh ({cls.days_of_week.map((d: number) => DAY_SHORT[d]).join(', ')}) — sẽ được chuyển về preset khi lưu.
                </p>
              )}
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
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Trợ giảng phụ trách</label>
              <select
                name="assigned_staff_id"
                defaultValue={cls.assigned_staff_id ?? ''}
                className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-700 dark:text-gray-200"
              >
                <option value="">Chưa phân công</option>
                {(staffList ?? []).map((s: Pick<Profile, 'id' | 'full_name'>) => (
                  <option key={s.id} value={s.id}>{s.full_name}</option>
                ))}
              </select>
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
