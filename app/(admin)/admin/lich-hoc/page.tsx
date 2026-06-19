export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import Topbar from '@/components/admin/Topbar'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { UserRound } from 'lucide-react'
import type { Slot, Profile } from '@/lib/types/database'

const DAY_FULL = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy']

async function createSlot(formData: FormData) {
  'use server'
  const supabase = createClient()
  await supabase.from('slots').insert({
    name: formData.get('name') as string,
    day_of_week: Number(formData.get('day_of_week')),
    time_start: formData.get('time_start') as string,
    time_end: formData.get('time_end') as string,
    max_capacity: Number(formData.get('max_capacity')),
    assigned_staff_id: (formData.get('assigned_staff_id') as string) || null,
    is_active: true,
  })
  redirect('/admin/lich-hoc')
}

async function toggleSlot(id: string, isActive: boolean) {
  'use server'
  const supabase = createClient()
  await supabase.from('slots').update({ is_active: !isActive }).eq('id', id)
  redirect('/admin/lich-hoc')
}

export default async function LichHocPage() {
  const supabase = createClient()

  const [{ data: slots }, { data: staffList }] = await Promise.all([
    supabase.from('slots').select('*, profiles(full_name)').order('day_of_week').order('time_start'),
    supabase.from('profiles').select('id, full_name').eq('role', 'staff').eq('is_active', true),
  ])

  const grouped = (slots ?? []).reduce<Record<number, (Slot & { profiles: { full_name: string } | null })[]>>(
    (acc, slot) => {
      if (!acc[slot.day_of_week]) acc[slot.day_of_week] = []
      acc[slot.day_of_week].push(slot)
      return acc
    },
    {}
  )

  return (
    <>
      <Topbar title="Lịch & Ca học" />
      <div className="p-6">
        <div className="grid gap-6 xl:grid-cols-3">
          {/* Danh sách ca theo ngày */}
          <div className="xl:col-span-2">
            {[1, 2, 3, 4, 5, 6, 0].map((dow) => (
              <div key={dow} className="mb-5">
                <h3 className="mb-2 font-semibold text-gray-700">{DAY_FULL[dow]}</h3>
                {grouped[dow] ? (
                  <div className="space-y-2">
                    {grouped[dow].map((slot) => (
                      <div
                        key={slot.id}
                        className="flex items-center justify-between rounded-xl border border-gray-100 bg-white px-4 py-3"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{slot.name}</span>
                            {!slot.is_active && <Badge variant="outline">Tắt</Badge>}
                          </div>
                          <div className="text-sm text-gray-500">
                            {slot.time_start.slice(0, 5)}–{slot.time_end.slice(0, 5)} · Tối đa {slot.max_capacity}
                          </div>
                          {slot.profiles && (
                            <div className="flex items-center gap-1 text-xs text-gray-400">
                              <UserRound className="h-3 w-3" />
                              {slot.profiles.full_name}
                            </div>
                          )}
                        </div>
                        <form action={toggleSlot.bind(null, slot.id, slot.is_active)}>
                          <button className="text-xs text-gray-400 hover:text-[#0D2545]">
                            {slot.is_active ? 'Tắt' : 'Bật'}
                          </button>
                        </form>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed py-4 text-center text-sm text-gray-300">
                    Không có ca
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Form tạo ca mới */}
          <div>
            <h3 className="mb-4 font-semibold">Tạo ca học mới</h3>
            <form action={createSlot} className="space-y-3 rounded-xl border border-gray-200 bg-white p-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Tên ca *</label>
                <Input name="name" required placeholder="VD: Thứ 2 sáng" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Thứ *</label>
                <select name="day_of_week" required className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm">
                  {DAY_FULL.map((d, i) => <option key={i} value={i}>{d}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">Giờ bắt đầu</label>
                  <Input name="time_start" type="time" defaultValue="08:00" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">Giờ kết thúc</label>
                  <Input name="time_end" type="time" defaultValue="10:00" />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Sĩ số tối đa</label>
                <Input name="max_capacity" type="number" defaultValue={10} min={1} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Trợ giảng</label>
                <select name="assigned_staff_id" className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm">
                  <option value="">Chưa phân công</option>
                  {(staffList ?? []).map((s: Pick<Profile, 'id' | 'full_name'>) => (
                    <option key={s.id} value={s.id}>{s.full_name}</option>
                  ))}
                </select>
              </div>
              <Button type="submit" className="w-full bg-[#0D2545] text-white hover:bg-[#0D2545]/90">
                Tạo ca học
              </Button>
            </form>
          </div>
        </div>
      </div>
    </>
  )
}
