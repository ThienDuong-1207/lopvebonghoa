export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { CalendarCheck, CheckCircle, CalendarDays } from 'lucide-react'
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

  const { data: slots } = await supabase
    .from('slots')
    .select('*')
    .eq('assigned_staff_id', profile?.id ?? '')
    .eq('is_active', true)
    .order('day_of_week')

  const today = new Date()
  const todayDow = today.getDay()
  const todayStr = today.toISOString().split('T')[0]

  const todaySlots = (slots ?? []).filter((s: Slot) => s.day_of_week === todayDow)

  const { count: checkedInCount } = await supabase
    .from('sessions')
    .select('*', { count: 'exact', head: true })
    .in('slot_id', todaySlots.map((s: Slot) => s.id))
    .eq('session_date', todayStr)

  const stats = [
    {
      label: 'Ca hôm nay',
      value: todaySlots.length,
      icon: CalendarCheck,
      accent: 'text-[#0D2545]',
      iconBg: 'bg-[#0D2545]/8',
    },
    {
      label: 'Đã điểm danh',
      value: checkedInCount ?? 0,
      icon: CheckCircle,
      accent: 'text-emerald-600',
      iconBg: 'bg-emerald-50',
    },
    {
      label: 'Ca / tuần',
      value: (slots ?? []).length,
      icon: CalendarDays,
      accent: 'text-[#C9A84C]',
      iconBg: 'bg-amber-50',
    },
  ]

  return (
    <div className="p-4">
      {/* Greeting */}
      <div className="mb-5">
        <p className="text-xs font-medium uppercase tracking-widest text-gray-400">Xin chào</p>
        <h2 className="mt-0.5 text-xl font-bold text-[#0D2545]">
          {profile?.full_name ?? 'Trợ giảng'}
        </h2>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-3 gap-3">
        {stats.map(({ label, value, icon: Icon, accent, iconBg }) => (
          <div key={label} className="rounded-xl bg-white p-3.5 shadow-sm">
            <div className={`mb-2 inline-flex rounded-lg p-1.5 ${iconBg}`}>
              <Icon className={`h-4 w-4 ${accent}`} />
            </div>
            <div className={`text-2xl font-bold ${accent}`}>{value}</div>
            <div className="mt-0.5 text-xs text-gray-500">{label}</div>
          </div>
        ))}
      </div>

      {/* Ca hôm nay */}
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700">
          Ca hôm nay —{' '}
          <span className="font-normal text-gray-400">{DAY_FULL[todayDow]}</span>
        </h3>
      </div>

      {todaySlots.length === 0 ? (
        <div className="rounded-xl bg-white py-8 text-center shadow-sm">
          <CalendarCheck className="mx-auto h-8 w-8 text-gray-200" />
          <p className="mt-2 text-sm text-gray-400">Không có ca hôm nay</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {todaySlots.map((slot: Slot) => (
            <div
              key={slot.id}
              className="flex items-center justify-between rounded-xl border-l-4 border-emerald-400 bg-white py-3.5 pl-4 pr-4 shadow-sm"
            >
              <div>
                <div className="font-semibold text-[#0D2545]">{slot.name}</div>
                <div className="mt-0.5 text-sm text-gray-400">
                  {formatTime(slot.time_start)} – {formatTime(slot.time_end)}
                </div>
              </div>
              <Link href="/staff/diem-danh">
                <Button size="sm" className="bg-[#0D2545] text-white hover:bg-[#0D2545]/90">
                  Điểm danh
                </Button>
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* Lịch tuần */}
      <h3 className="mb-2.5 mt-6 text-sm font-semibold text-gray-700">Lịch tuần này</h3>
      <div className="grid grid-cols-7 gap-1.5">
        {DAY_NAMES.map((name, idx) => {
          const hasSlot = (slots ?? []).some((s: Slot) => s.day_of_week === idx)
          const isToday = idx === todayDow
          return (
            <div
              key={idx}
              className={`rounded-xl py-2.5 text-center text-xs font-medium shadow-sm transition-colors ${
                isToday
                  ? 'bg-[#0D2545] text-white'
                  : hasSlot
                  ? 'bg-[#C9A84C]/15 text-[#C9A84C]'
                  : 'bg-white text-gray-300'
              }`}
            >
              <div>{name}</div>
              {hasSlot && (
                <div className={`mx-auto mt-1 h-1 w-1 rounded-full ${isToday ? 'bg-[#C9A84C]' : 'bg-[#C9A84C]'}`} />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
