export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import Topbar from '@/components/admin/Topbar'
import { redirect, notFound } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import type { Profile } from '@/lib/types/database'

const DAY_FULL = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy']

async function updateSlot(id: string, formData: FormData) {
  'use server'
  const supabase = createClient()
  await supabase.from('slots').update({
    name: formData.get('name') as string,
    day_of_week: Number(formData.get('day_of_week')),
    time_start: formData.get('time_start') as string,
    time_end: formData.get('time_end') as string,
    max_capacity: Number(formData.get('max_capacity')),
    assigned_staff_id: (formData.get('assigned_staff_id') as string) || null,
  }).eq('id', id)
  redirect('/admin/lich-hoc')
}

export default async function EditSlotPage({ params }: { params: { id: string } }) {
  const supabase = createClient()

  const [{ data: slot }, { data: staffList }] = await Promise.all([
    supabase.from('slots').select('*').eq('id', params.id).single(),
    supabase.from('profiles').select('id, full_name').eq('role', 'staff').eq('is_active', true),
  ])

  if (!slot) notFound()

  const boundUpdate = updateSlot.bind(null, params.id)

  return (
    <>
      <Topbar title="Chỉnh sửa ca học" backHref="/admin/lich-hoc" backLabel="Lịch & Ca học" />
      <div className="p-6">
        <div className="mx-auto max-w-md">
          <form action={boundUpdate} className="space-y-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Tên ca *</label>
              <Input name="name" required defaultValue={slot.name} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Thứ *</label>
              <select
                name="day_of_week"
                required
                defaultValue={slot.day_of_week}
                className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-700 dark:text-gray-200"
              >
                {DAY_FULL.map((d, i) => <option key={i} value={i}>{d}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Giờ bắt đầu</label>
                <Input name="time_start" type="time" defaultValue={slot.time_start.slice(0, 5)} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Giờ kết thúc</label>
                <Input name="time_end" type="time" defaultValue={slot.time_end.slice(0, 5)} />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Sĩ số tối đa</label>
              <Input name="max_capacity" type="number" min={1} defaultValue={slot.max_capacity} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Trợ giảng</label>
              <select
                name="assigned_staff_id"
                defaultValue={slot.assigned_staff_id ?? ''}
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
