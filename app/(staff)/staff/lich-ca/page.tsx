export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/supabase/queries'
import { CalendarDays } from 'lucide-react'
import type { Slot, Student } from '@/lib/types/database'

const DAY_FULL = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy']
const DAY_SHORT = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']

function formatTime(t: string) {
  return t.slice(0, 5)
}

export default async function LichCaPage() {
  const supabase = createClient()
  const profile = await getProfile()

  const { data: slots } = await supabase
    .from('slots')
    .select('*')
    .eq('assigned_staff_id', profile?.id ?? '')
    .eq('is_active', true)
    .order('day_of_week')
    .order('time_start')

  const slotIds = (slots ?? []).map((s: Slot) => s.id)
  const { data: students } = slotIds.length
    ? await supabase
        .from('students')
        .select('preferred_slot_id')
        .in('preferred_slot_id', slotIds)
        .eq('status', 'active')
    : { data: [] }

  const countBySlot = (slots ?? []).reduce<Record<string, number>>((acc, slot: Slot) => {
    acc[slot.id] = (students ?? []).filter(
      (s: Pick<Student, 'preferred_slot_id'>) => s.preferred_slot_id === slot.id
    ).length
    return acc
  }, {})

  const today = new Date().getDay()
  const grouped = (slots ?? []).reduce<Record<number, Slot[]>>((acc, slot: Slot) => {
    if (!acc[slot.day_of_week]) acc[slot.day_of_week] = []
    acc[slot.day_of_week].push(slot)
    return acc
  }, {})

  const allDays = [1, 2, 3, 4, 5, 6, 0]

  return (
    <div className="p-4">
      {/* Mini week calendar */}
      <div className="mb-5 grid grid-cols-7 gap-1.5">
        {allDays.map((dow) => {
          const hasSlot = !!grouped[dow]
          const isToday = dow === today
          return (
            <div
              key={dow}
              className={`rounded-xl py-2.5 text-center text-xs font-medium shadow-sm transition-colors ${
                isToday
                  ? 'bg-[#0D2545] text-white'
                  : hasSlot
                  ? 'bg-[#C9A84C]/15 text-[#C9A84C]'
                  : 'bg-white text-gray-300'
              }`}
            >
              <div>{DAY_SHORT[dow]}</div>
              {hasSlot && (
                <div className="mx-auto mt-1 h-1 w-1 rounded-full bg-[#C9A84C]" />
              )}
            </div>
          )
        })}
      </div>

      {/* Danh sách ca */}
      {allDays.map((dow) => {
        if (!grouped[dow]) return null
        return (
          <div key={dow} className="mb-5">
            <div className="mb-2 flex items-center gap-2">
              <h3 className="text-sm font-semibold text-gray-700">{DAY_FULL[dow]}</h3>
              {dow === today && (
                <span className="rounded-full bg-[#0D2545] px-2 py-0.5 text-[10px] font-medium text-white">
                  Hôm nay
                </span>
              )}
            </div>
            <div className="space-y-2">
              {grouped[dow].map((slot: Slot) => (
                <div
                  key={slot.id}
                  className={`flex items-center justify-between rounded-xl bg-white p-4 ${
                    dow === today
                      ? 'border-l-4 border-[#C9A84C] shadow-sm'
                      : 'shadow-sm'
                  }`}
                >
                  <div>
                    <div className="font-semibold text-[#0D2545]">{slot.name}</div>
                    <div className="mt-0.5 text-sm text-gray-400">
                      {formatTime(slot.time_start)} – {formatTime(slot.time_end)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-[#0D2545]">
                      {countBySlot[slot.id] ?? 0}
                      <span className="text-sm font-normal text-gray-400">/{slot.max_capacity}</span>
                    </div>
                    <div className="text-xs text-gray-400">học sinh</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })}

      {(slots ?? []).length === 0 && (
        <div className="flex h-[50vh] items-center justify-center text-center text-gray-400">
          <div>
            <CalendarDays className="mx-auto h-10 w-10 text-gray-200" />
            <p className="mt-3 text-sm">Chưa được phân công ca nào</p>
          </div>
        </div>
      )}
    </div>
  )
}
