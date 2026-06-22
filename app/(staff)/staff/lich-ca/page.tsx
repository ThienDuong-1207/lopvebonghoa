export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/supabase/queries'
import Link from 'next/link'
import { CalendarDays } from 'lucide-react'
import type { Class, Student, Package } from '@/lib/types/database'
import { DAY_SHORT, DAY_FULL } from '@/lib/types/database'

function formatTime(t: string) { return t.slice(0, 5) }

interface Props {
  searchParams: { dow?: string }
}

export default async function LichCaPage({ searchParams }: Props) {
  const supabase = createClient()
  const profile = await getProfile()

  const today = new Date().getDay()
  // Ngày đang xem: từ URL param, fallback về hôm nay
  const selectedDow = searchParams.dow !== undefined
    ? Number(searchParams.dow)
    : today

  const { data: classes } = await supabase
    .from('classes')
    .select('*')
    .eq('is_active', true)
    .order('time_start')
    .order('name')

  // ID các lớp được phân công cho staff này (để đánh dấu)
  const assignedIds = new Set(
    (classes ?? []).filter((c: Class) => c.assigned_staff_id === profile?.id).map((c: Class) => c.id)
  )

  // Lớp hiển thị: lọc theo ngày được chọn
  const visibleClasses = (classes ?? []).filter((c: Class) =>
    c.days_of_week.includes(selectedDow)
  )

  // Fetch học sinh của các lớp đang hiện
  const visibleIds = visibleClasses.map((c: Class) => c.id)
  const { data: students } = visibleIds.length
    ? await supabase
        .from('students')
        .select('id, full_name, nickname, class_id, attend_days')
        .in('class_id', visibleIds)
        .eq('status', 'active')
        .order('full_name')
    : { data: [] }

  // Fetch gói học active của học sinh
  const studentIds = (students ?? []).map((s: Pick<Student, 'id'>) => s.id)
  const { data: pkgs } = studentIds.length
    ? await supabase
        .from('packages')
        .select('student_id, used_sessions, total_sessions, payment_status, status')
        .in('student_id', studentIds)
        .eq('status', 'active')
    : { data: [] }

  // Maps for quick lookup
  type StudentRow = { id: string; full_name: string; nickname: string | null; class_id: string | null; attend_days: number[] | null }
  const studentsByClass = (students ?? []).filter((s) =>
    !s.attend_days || s.attend_days.length === 0 || s.attend_days.includes(selectedDow)
  ).reduce<Record<string, StudentRow[]>>((acc, s) => {
    if (s && s.class_id) {
      if (!acc[s.class_id]) acc[s.class_id] = []
      acc[s.class_id]!.push(s as StudentRow)
    }
    return acc
  }, {})

  const pkgByStudent = (pkgs ?? []).reduce<Record<string, Package>>((acc, p) => {
    if (p) acc[p.student_id] = p as Package
    return acc
  }, {})

  // Days that have at least one assigned class
  const daysWithClass = new Set((classes ?? []).flatMap((c: Class) => c.days_of_week))

  return (
    <div className="p-4">

      {/* ── Weekly day tabs ── */}
      <div className="mb-5 grid grid-cols-7 gap-1.5">
        {[1, 2, 3, 4, 5, 6, 0].map((dow) => {
          const hasClass  = daysWithClass.has(dow)
          const isToday   = dow === today
          const isSelected = dow === selectedDow

          return (
            <Link
              key={dow}
              href={`/staff/lich-ca?dow=${dow}`}
              className={`rounded-xl py-2.5 text-center text-xs font-medium shadow-sm transition-colors ${
                isSelected && isToday
                  ? 'bg-[#0D2545] text-white ring-2 ring-[#C9A84C]'
                  : isSelected
                  ? 'bg-[#C9A84C] text-white'
                  : isToday
                  ? 'bg-[#0D2545] text-white'
                  : hasClass
                  ? 'bg-[#C9A84C]/15 text-[#C9A84C] hover:bg-[#C9A84C]/25'
                  : 'bg-white text-gray-300 hover:bg-gray-50'
              }`}
            >
              <div>{DAY_SHORT[dow]}</div>
              {hasClass && (
                <div className={`mx-auto mt-1 h-1 w-1 rounded-full ${
                  isSelected ? 'bg-white/70' : 'bg-[#C9A84C]'
                }`} />
              )}
            </Link>
          )
        })}
      </div>

      {/* ── Header ngày đang xem ── */}
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-600 dark:text-gray-300">
          {DAY_FULL[selectedDow]}
          {selectedDow === today && (
            <span className="ml-2 rounded-full bg-[#0D2545] px-2 py-0.5 text-[10px] font-semibold text-white">
              Hôm nay
            </span>
          )}
        </h2>
        <span className="text-xs text-gray-400">
          {visibleClasses.length} lớp · {studentIds.length} học sinh
        </span>
      </div>

      {/* ── Danh sách lớp của ngày được chọn ── */}
      {(classes ?? []).length === 0 ? (
        <div className="flex h-[50vh] items-center justify-center text-center text-gray-400">
          <div>
            <CalendarDays className="mx-auto h-10 w-10 text-gray-200" />
            <p className="mt-3 text-sm">Chưa có lớp nào</p>
          </div>
        </div>
      ) : visibleClasses.length === 0 ? (
        <div className="flex h-40 items-center justify-center rounded-xl bg-white text-center text-gray-400 shadow-sm">
          <div>
            <p className="text-sm">Không có lớp vào {DAY_FULL[selectedDow]}</p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {visibleClasses.map((cls: Class) => {
            const classStudents = studentsByClass[cls.id] ?? []
            const isToday = cls.days_of_week.includes(today) && selectedDow === today

            return (
              <div
                key={cls.id}
                className={`rounded-xl bg-white shadow-sm ${
                  isToday ? 'border-l-4 border-[#C9A84C]' : ''
                }`}
              >
                {/* Class header */}
                <div className="flex items-center justify-between p-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-[#0D2545]">{cls.name}</span>
                      {assignedIds.has(cls.id) && (
                        <span className="rounded-full bg-[#0D2545] px-2 py-0.5 text-[10px] font-semibold text-white">
                          Lớp của bạn
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5 text-sm text-gray-400">
                      {formatTime(cls.time_start)} – {formatTime(cls.time_end)}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <div className="text-lg font-bold text-[#0D2545]">
                      {classStudents.length}
                      <span className="text-sm font-normal text-gray-400">/{cls.max_capacity}</span>
                    </div>
                    <div className="text-xs text-gray-400">học sinh</div>
                    <Link
                      href={`/staff/diem-danh?dow=${selectedDow}&class_id=${cls.id}`}
                      className="rounded-full bg-[#C9A84C] px-3 py-1 text-[11px] font-semibold text-white hover:bg-[#C9A84C]/90"
                    >
                      Điểm danh →
                    </Link>
                  </div>
                </div>

                {/* Student list */}
                {classStudents.length > 0 && (
                  <div className="border-t border-gray-100">
                    {classStudents.map((student: StudentRow, idx: number) => {
                      const pkg = pkgByStudent[student.id]
                      const initials = student.full_name
                        .split(' ').map((w: string) => w[0]).slice(-2).join('').toUpperCase()
                      const remaining = pkg ? pkg.total_sessions - pkg.used_sessions : null
                      const isLast = idx === classStudents.length - 1

                      return (
                        <div
                          key={student.id}
                          className={`flex items-center gap-3 px-4 py-2.5 ${
                            !isLast ? 'border-b border-gray-50' : ''
                          }`}
                        >
                          {/* Avatar */}
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#0D2545]/8 text-xs font-semibold text-[#0D2545]">
                            {initials}
                          </div>

                          {/* Info */}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm font-medium text-gray-800">
                                {student.nickname ?? student.full_name}
                              </span>
                              {student.nickname && (
                                <span className="text-xs text-gray-400 truncate">({student.full_name})</span>
                              )}
                              {pkg?.payment_status === 'pending' && (
                                <span className="shrink-0 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">
                                  Chờ thu
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Session progress */}
                          {pkg ? (
                            <div className="shrink-0 text-right">
                              <div className={`text-xs font-semibold ${
                                remaining !== null && remaining <= 2 ? 'text-red-400' : 'text-gray-500'
                              }`}>
                                {pkg.used_sessions}/{pkg.total_sessions}
                              </div>
                              {remaining !== null && remaining <= 2 && (
                                <div className="text-[10px] text-red-400">còn {remaining}</div>
                              )}
                            </div>
                          ) : (
                            <span className="shrink-0 text-xs text-red-400">Hết gói</span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}

                {classStudents.length === 0 && (
                  <div className="border-t border-gray-50 px-4 py-3 text-xs text-gray-400">
                    Chưa có học sinh trong lớp này
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
