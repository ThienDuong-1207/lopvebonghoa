export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/supabase/queries'
import CheckinButton from '@/components/staff/CheckinButton'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import type { Slot, Student, Package, Session } from '@/lib/types/database'

function formatTime(t: string) {
  return t.slice(0, 5)
}

export default async function DiemDanhPage() {
  const supabase = createClient()
  const profile = await getProfile()

  const today = new Date()
  const todayDow = today.getDay()
  const todayStr = today.toISOString().split('T')[0]

  const { data: slots } = await supabase
    .from('slots')
    .select('*')
    .eq('assigned_staff_id', profile?.id ?? '')
    .eq('day_of_week', todayDow)
    .eq('is_active', true)

  if (!slots || slots.length === 0) {
    return (
      <div className="flex h-[60vh] items-center justify-center p-4 text-center text-gray-400">
        <div>
          <div className="text-4xl">📭</div>
          <p className="mt-3">Không có ca hôm nay</p>
        </div>
      </div>
    )
  }

  const slotIds = slots.map((s: Slot) => s.id)

  // students + sessions chạy song song, không phụ thuộc nhau
  const [{ data: students }, { data: todaySessions }] = await Promise.all([
    supabase.from('students').select('*').in('preferred_slot_id', slotIds).eq('status', 'active'),
    supabase.from('sessions').select('*').in('slot_id', slotIds).eq('session_date', todayStr),
  ])

  // packages phụ thuộc vào studentIds nên chạy sau
  const studentIds = (students ?? []).map((s: Student) => s.id)
  const { data: packages } = studentIds.length
    ? await supabase.from('packages').select('*').in('student_id', studentIds).eq('status', 'active')
    : { data: [] }

  const checkedIn = (todaySessions ?? []).filter((s: Session) => s.status === 'present').length
  const absent = (todaySessions ?? []).filter((s: Session) => s.status === 'absent').length
  const total = (students ?? []).length

  return (
    <div className="p-4">
      {/* Header tóm tắt */}
      <div className="mb-4 flex gap-3">
        <div className="flex-1 rounded-xl bg-green-50 py-3 text-center">
          <div className="text-xl font-bold text-green-600">{checkedIn}</div>
          <div className="text-xs text-gray-500">Có mặt</div>
        </div>
        <div className="flex-1 rounded-xl bg-red-50 py-3 text-center">
          <div className="text-xl font-bold text-red-400">{absent}</div>
          <div className="text-xs text-gray-500">Vắng</div>
        </div>
        <div className="flex-1 rounded-xl bg-gray-50 py-3 text-center">
          <div className="text-xl font-bold text-gray-600">{total - checkedIn - absent}</div>
          <div className="text-xs text-gray-500">Chưa</div>
        </div>
      </div>

      {slots.map((slot: Slot) => {
        const slotStudents = (students ?? []).filter(
          (s: Student) => s.preferred_slot_id === slot.id
        )

        return (
          <div key={slot.id} className="mb-6">
            <h3 className="mb-3 font-semibold text-[#0D2545]">
              {slot.name} — {formatTime(slot.time_start)}–{formatTime(slot.time_end)}
            </h3>

            <div className="space-y-3">
              {slotStudents.map((student: Student) => {
                const pkg = (packages ?? []).find((p: Package) => p.student_id === student.id)
                const session = (todaySessions ?? []).find(
                  (s: Session) => s.student_id === student.id && s.slot_id === slot.id
                )
                const initials = student.full_name
                  .split(' ')
                  .map((w: string) => w[0])
                  .slice(-2)
                  .join('')
                  .toUpperCase()

                return (
                  <div
                    key={student.id}
                    className="flex items-center justify-between rounded-xl bg-white p-3 shadow-sm"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-[#0D2545]/10 text-sm font-semibold text-[#0D2545]">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium text-gray-800">
                          {student.nickname ?? student.full_name}
                        </div>
                        {pkg && (
                          <div className="text-xs text-gray-400">
                            Buổi {pkg.used_sessions}/{pkg.total_sessions}
                          </div>
                        )}
                      </div>
                    </div>
                    {pkg ? (
                      <CheckinButton
                        studentId={student.id}
                        packageId={pkg.id}
                        slotId={slot.id}
                        sessionDate={todayStr}
                        initialStatus={session?.status ?? null}
                        sessionId={session?.id}
                      />
                    ) : (
                      <span className="text-xs text-red-400">Hết gói</span>
                    )}
                  </div>
                )
              })}

              {slotStudents.length === 0 && (
                <div className="rounded-xl bg-white py-6 text-center text-sm text-gray-400">
                  Chưa có học sinh trong ca này
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
