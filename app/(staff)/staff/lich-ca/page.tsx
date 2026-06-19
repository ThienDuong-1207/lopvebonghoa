export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import type { Slot, Student } from '@/lib/types/database'

const DAY_FULL = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy']
const DAY_SHORT = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']

function formatTime(t: string) {
  return t.slice(0, 5)
}

export default async function LichCaPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('auth_user_id', user?.id ?? '')
    .single()

  const { data: slots } = await supabase
    .from('slots')
    .select('*')
    .eq('assigned_staff_id', profile?.id ?? '')
    .eq('is_active', true)
    .order('day_of_week')
    .order('time_start')

  // Đếm học sinh mỗi ca
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

  // Lịch tuần mini
  const allDays = [1, 2, 3, 4, 5, 6, 0]

  return (
    <div className="p-4">
      {/* Mini week calendar */}
      <div className="mb-5 grid grid-cols-7 gap-1">
        {allDays.map((dow) => {
          const hasSlot = !!grouped[dow]
          const isToday = dow === today
          return (
            <div
              key={dow}
              className={`rounded-lg p-2 text-center text-xs font-medium ${
                isToday
                  ? 'bg-[#0D2545] text-white'
                  : hasSlot
                  ? 'bg-[#C9A84C]/20 text-[#C9A84C]'
                  : 'bg-gray-100 text-gray-400'
              }`}
            >
              {DAY_SHORT[dow]}
              {hasSlot && <div className="mt-1 text-[10px]">●</div>}
            </div>
          )
        })}
      </div>

      {/* Danh sách ca */}
      {allDays.map((dow) => {
        if (!grouped[dow]) return null
        return (
          <div key={dow} className="mb-5">
            <h3 className="mb-2 font-semibold text-gray-700">
              {DAY_FULL[dow]}
              {dow === today && (
                <span className="ml-2 rounded-full bg-[#0D2545] px-2 py-0.5 text-xs text-white">
                  Hôm nay
                </span>
              )}
            </h3>
            <div className="space-y-2">
              {grouped[dow].map((slot: Slot) => (
                <div
                  key={slot.id}
                  className={`flex items-center justify-between rounded-xl p-4 ${
                    dow === today ? 'border-2 border-[#C9A84C] bg-white' : 'bg-white shadow-sm'
                  }`}
                >
                  <div>
                    <div className="font-medium text-[#0D2545]">{slot.name}</div>
                    <div className="text-sm text-gray-500">
                      {formatTime(slot.time_start)} – {formatTime(slot.time_end)}
                    </div>
                  </div>
                  <div className="text-right text-sm">
                    <span className="font-semibold text-[#0D2545]">{countBySlot[slot.id] ?? 0}</span>
                    <span className="text-gray-400">/{slot.max_capacity}</span>
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
            <div className="text-4xl">📭</div>
            <p className="mt-3">Chưa được phân công ca nào</p>
          </div>
        </div>
      )}
    </div>
  )
}
