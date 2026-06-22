export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/supabase/queries'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import CheckinButton from '@/components/staff/CheckinButton'
import type { Class, Student, Package, Session } from '@/lib/types/database'
import { DAY_SHORT, DAY_FULL } from '@/lib/types/database'

function formatTime(t: string) { return t.slice(0, 5) }

interface Props {
  searchParams: { dow?: string; class_id?: string }
}

export default async function DiemDanhPage({ searchParams }: Props) {
  const supabase = createClient()
  const profile = await getProfile()

  const today = new Date()
  const todayDow = today.getDay()
  const selectedDow = searchParams.dow !== undefined ? Number(searchParams.dow) : todayDow
  const selectedClassId = searchParams.class_id ?? ''

  // Tính ngày thực tế của DOW được chọn trong tuần hiện tại
  // Treat CN(0) as 7 so week is always Mon(1)…Sun(7), avoiding negative offsets
  const toWeekday = (d: number) => d === 0 ? 7 : d
  const diff = toWeekday(selectedDow) - toWeekday(todayDow)
  const d = new Date(today)
  d.setDate(today.getDate() + diff)
  const selectedDateStr = d.toISOString().split('T')[0]

  // Lấy tất cả lớp active
  const { data: rawClasses } = await supabase
    .from('classes')
    .select('*')
    .eq('is_active', true)
    .order('time_start')
    .order('name')

  const allClasses: Class[] = rawClasses ?? []
  const classesForDay = allClasses.filter((c) => c.days_of_week.includes(selectedDow))
  const selectedClass = allClasses.find((c) => c.id === selectedClassId) ?? null
  const daysWithClass = new Set(allClasses.flatMap((c) => c.days_of_week))
  const assignedIds = new Set(
    allClasses.filter((c) => c.assigned_staff_id === profile?.id).map((c) => c.id)
  )

  // Fetch học sinh + sessions khi đã chọn lớp
  let students: Student[] = []
  let packages: Package[] = []
  let sessions: Session[] = []

  if (selectedClassId && selectedClass) {
    const [studentsRes, sessionsRes] = await Promise.all([
      supabase
        .from('students')
        .select('*')
        .eq('class_id', selectedClassId)
        .eq('status', 'active')
        .lte('enrolled_at', selectedDateStr)
        .order('full_name'),
      supabase
        .from('sessions')
        .select('*')
        .eq('class_id', selectedClassId)
        .eq('session_date', selectedDateStr),
    ])

    students = (studentsRes.data ?? []).filter((s) =>
      !s.attend_days || s.attend_days.length === 0 || s.attend_days.includes(selectedDow)
    )
    sessions = sessionsRes.data ?? []

    if (students.length > 0) {
      const ids = students.map((s) => s.id)
      const { data: pkgs } = await supabase
        .from('packages')
        .select('*')
        .in('student_id', ids)
        .neq('status', 'cancelled')
        .order('created_at', { ascending: false })
      packages = pkgs ?? []
    }
  }

  const presentCount = sessions.filter((s) => s.status === 'present').length
  const absentCount  = sessions.filter((s) => s.status === 'absent').length

  return (
    <div className="p-4">

      {/* ── Tabs ngày trong tuần ── */}
      <div className="mb-5 grid grid-cols-7 gap-1.5">
        {[1, 2, 3, 4, 5, 6, 0].map((dow) => {
          const hasClass  = daysWithClass.has(dow)
          const isToday   = dow === todayDow
          const isSelected = dow === selectedDow

          return (
            <Link
              key={dow}
              href={`/staff/diem-danh?dow=${dow}`}
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

      {/* ── Header ── */}
      <div className="mb-3 flex items-center justify-between">
        {selectedClassId && selectedClass ? (
          <Link
            href={`/staff/diem-danh?dow=${selectedDow}`}
            className="flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-gray-700"
          >
            <ChevronLeft className="h-4 w-4" />
            {DAY_FULL[selectedDow]} · {selectedDateStr}
          </Link>
        ) : (
          <h2 className="text-sm font-semibold text-gray-600 dark:text-gray-300">
            {DAY_FULL[selectedDow]}
            {selectedDow === todayDow && (
              <span className="ml-2 rounded-full bg-[#0D2545] px-2 py-0.5 text-[10px] font-semibold text-white">
                Hôm nay
              </span>
            )}
          </h2>
        )}

        {selectedClassId && selectedClass ? (
          <div className="flex gap-4 text-center">
            <div>
              <div className="text-base font-bold text-emerald-600">{presentCount}</div>
              <div className="text-[11px] text-gray-400">Có mặt</div>
            </div>
            <div>
              <div className="text-base font-bold text-red-400">{absentCount}</div>
              <div className="text-[11px] text-gray-400">Vắng</div>
            </div>
            <div>
              <div className="text-base font-bold text-gray-400">
                {students.length - presentCount - absentCount}
              </div>
              <div className="text-[11px] text-gray-400">Chưa</div>
            </div>
          </div>
        ) : (
          <span className="text-xs text-gray-400">{classesForDay.length} lớp</span>
        )}
      </div>

      {/* ── Nội dung chính ── */}
      {selectedClassId && selectedClass ? (

        /* Danh sách học viên để điểm danh */
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="border-b border-gray-100 bg-gray-50/60 px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-[#0D2545]">{selectedClass.name}</span>
              {assignedIds.has(selectedClass.id) && (
                <span className="rounded-full bg-[#0D2545] px-2 py-0.5 text-[10px] font-semibold text-white">
                  Lớp của bạn
                </span>
              )}
            </div>
            <div className="mt-0.5 text-xs text-gray-400">
              {formatTime(selectedClass.time_start)}–{formatTime(selectedClass.time_end)}
            </div>
          </div>

          <div className="divide-y divide-gray-100">
            {students.length === 0 ? (
              <div className="py-12 text-center text-sm text-gray-400">
                Chưa có học sinh nào
              </div>
            ) : (
              students.map((student: Student) => {
                const pkg     = packages.find((p) => p.student_id === student.id)
                const session = sessions.find((s) => s.student_id === student.id)
                const initials = student.full_name
                  .split(' ').map((w) => w[0]).slice(-2).join('').toUpperCase()

                return (
                  <div
                    key={student.id}
                    className="flex items-center justify-between px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#0D2545]/10 text-sm font-semibold text-[#0D2545]">
                        {initials}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium text-gray-800">
                            {student.nickname ?? student.full_name}
                          </span>
                          {student.nickname && (
                            <span className="text-xs text-gray-400">({student.full_name})</span>
                          )}
                          {pkg?.payment_status === 'pending' && (
                            <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">
                              Chờ thu
                            </span>
                          )}
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
                        classId={selectedClassId}
                        sessionDate={selectedDateStr}
                        profileId={profile?.id ?? ''}
                        initialStatus={
                          session?.status === 'makeup' ? 'present'
                          : (session?.status ?? null)
                        }
                        sessionId={session?.id}
                      />
                    ) : (
                      <span className="text-xs text-red-400">Hết gói</span>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>

      ) : classesForDay.length === 0 ? (

        /* Không có lớp ngày này */
        <div className="flex h-40 items-center justify-center rounded-xl bg-white text-center text-gray-400 shadow-sm">
          <p className="text-sm">Không có lớp vào {DAY_FULL[selectedDow]}</p>
        </div>

      ) : (

        /* Danh sách lớp của ngày được chọn */
        <div className="space-y-3">
          {classesForDay.map((cls: Class) => (
            <Link
              key={cls.id}
              href={`/staff/diem-danh?dow=${selectedDow}&class_id=${cls.id}`}
              className={`flex items-center justify-between rounded-xl bg-white p-4 shadow-sm transition-colors hover:bg-gray-50 ${
                assignedIds.has(cls.id) ? 'border-l-4 border-[#C9A84C]' : ''
              }`}
            >
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
              <ChevronRight className="h-5 w-5 text-gray-300" />
            </Link>
          ))}
        </div>

      )}
    </div>
  )
}
