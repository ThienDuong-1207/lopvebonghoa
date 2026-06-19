export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import type { Slot } from '@/lib/types/database'

const DAY_NAMES = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']
const DAY_FULL = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy']

function formatTime(t: string) {
  return t.slice(0, 5)
}

export default async function StaffHomePage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('auth_user_id', user?.id ?? '')
    .single()

  // Slots của staff này — dùng profiles.id, không phải auth user id
  const { data: slots } = await supabase
    .from('slots')
    .select('*')
    .eq('assigned_staff_id', profile?.id ?? '')
    .eq('is_active', true)
    .order('day_of_week')

  const today = new Date()
  const todayDow = today.getDay()

  const todaySlots = (slots ?? []).filter((s: Slot) => s.day_of_week === todayDow)

  // Đếm điểm danh hôm nay
  const todayStr = today.toISOString().split('T')[0]
  const { count: checkedInCount } = await supabase
    .from('sessions')
    .select('*', { count: 'exact', head: true })
    .in('slot_id', todaySlots.map((s: Slot) => s.id))
    .eq('session_date', todayStr)

  return (
    <div className="p-4">
      <div className="mb-6">
        <p className="text-sm text-gray-500">Xin chào,</p>
        <h2 className="text-xl font-bold text-[#0D2545]">{profile?.full_name ?? 'Trợ giảng'}</h2>
      </div>

      {/* Summary bar */}
      <div className="mb-6 grid grid-cols-3 gap-3">
        <div className="rounded-xl bg-[#0D2545] p-3 text-center text-white">
          <div className="text-2xl font-bold">{todaySlots.length}</div>
          <div className="text-xs text-white/70">Ca hôm nay</div>
        </div>
        <div className="rounded-xl bg-green-50 p-3 text-center">
          <div className="text-2xl font-bold text-green-600">{checkedInCount ?? 0}</div>
          <div className="text-xs text-gray-500">Đã điểm danh</div>
        </div>
        <div className="rounded-xl bg-[#C9A84C]/10 p-3 text-center">
          <div className="text-2xl font-bold text-[#C9A84C]">{(slots ?? []).length}</div>
          <div className="text-xs text-gray-500">Ca/tuần</div>
        </div>
      </div>

      {/* Ca hôm nay */}
      <h3 className="mb-3 font-semibold text-gray-700">Ca hôm nay — {DAY_FULL[todayDow]}</h3>
      {todaySlots.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-gray-400">
            Không có ca hôm nay
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {todaySlots.map((slot: Slot) => (
            <Card key={slot.id} className="border-l-4 border-l-green-400">
              <CardContent className="flex items-center justify-between py-4">
                <div>
                  <div className="font-semibold text-[#0D2545]">{slot.name}</div>
                  <div className="text-sm text-gray-500">
                    {formatTime(slot.time_start)} – {formatTime(slot.time_end)}
                  </div>
                </div>
                <Link href="/staff/diem-danh">
                  <Button className="bg-[#0D2545] text-white hover:bg-[#0D2545]/90">
                    Vào điểm danh
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Lịch tuần mini */}
      <h3 className="mb-3 mt-6 font-semibold text-gray-700">Lịch tuần này</h3>
      <div className="grid grid-cols-7 gap-1">
        {DAY_NAMES.map((name, idx) => {
          const hasSlot = (slots ?? []).some((s: Slot) => s.day_of_week === idx)
          const isToday = idx === todayDow
          return (
            <div
              key={idx}
              className={`rounded-lg p-2 text-center text-xs font-medium ${
                isToday
                  ? 'bg-[#0D2545] text-white'
                  : hasSlot
                  ? 'bg-[#C9A84C]/20 text-[#C9A84C]'
                  : 'bg-gray-100 text-gray-400'
              }`}
            >
              {name}
              {hasSlot && <div className="mt-1 text-[10px]">●</div>}
            </div>
          )
        })}
      </div>
    </div>
  )
}
