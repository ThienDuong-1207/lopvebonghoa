export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/supabase/queries'
import Link from 'next/link'
import AttendanceRow from '@/components/staff/AttendanceRow'
import type { Class, Student, Package, Session } from '@/lib/types/database'
import { DAY_SHORT, DAY_FULL } from '@/lib/types/database'

function formatTime(t: string) { return t.slice(0, 5) }

interface Props {
  searchParams: { dow?: string }
}

export default async function DiemDanhPage({ searchParams }: Props) {
  const supabase = createClient()
  const profile = await getProfile()

  const today = new Date()
  const todayDow = today.getDay()
  const selectedDow = searchParams.dow !== undefined ? Number(searchParams.dow) : todayDow

  // Tính ngày thực tế trong tuần hiện tại (CN=0 → 7 để tránh offset âm)
  const toW = (d: number) => (d === 0 ? 7 : d)
  const d = new Date(today)
  d.setDate(today.getDate() + toW(selectedDow) - toW(todayDow))
  const selectedDateStr = d.toISOString().split('T')[0]

  // Lấy tất cả lớp active
  const { data: rawClasses } = await supabase
    .from('classes')
    .select('*')
    .eq('is_active', true)
    .order('time_start')
    .order('name')

  const allClasses: Class[] = rawClasses ?? []
  const daysWithClass = new Set(allClasses.flatMap((c) => c.days_of_week))
  const classesForDay = allClasses.filter((c) => c.days_of_week.includes(selectedDow))
  const assignedIds = new Set(
    allClasses.filter((c) => c.assigned_staff_id === profile?.id).map((c) => c.id)
  )

  // Lấy tất cả học sinh của các lớp hôm đó
  let students: Student[] = []
  let packages: Package[] = []
  let sessions: Session[] = []

  if (classesForDay.length > 0) {
    const classIds = classesForDay.map((c) => c.id)

    const [studentsRes, sessionsRes] = await Promise.all([
      supabase
        .from('students')
        .select('*')
        .in('class_id', classIds)
        .eq('status', 'active')
        .lte('enrolled_at', selectedDateStr)
        .order('full_name'),
      supabase
        .from('sessions')
        .select('*')
        .in('class_id', classIds)
        .eq('session_date', selectedDateStr),
    ])

    // Lọc theo attend_days
    students = (studentsRes.data ?? []).filter(
      (s) => !s.attend_days || s.attend_days.length === 0 || s.attend_days.includes(selectedDow)
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

  // Thống kê — chỉ tính học sinh có gói học
  const eligibleStudentIds = new Set(packages.map((p) => p.student_id))
  const eligibleStudents   = students.filter((s) => eligibleStudentIds.has(s.id))
  const totalCount   = eligibleStudents.length
  const presentCount = sessions.filter((s) => eligibleStudentIds.has(s.student_id) && (s.status === 'present' || s.status === 'makeup')).length
  const absentCount  = sessions.filter((s) => eligibleStudentIds.has(s.student_id) && s.status === 'absent').length
  const pendingCount = totalCount - presentCount - absentCount

  return (
    <div className="p-4">

      {/* ── Tabs ngày ── */}
      <div className="mb-4 grid grid-cols-7 gap-1.5">
        {[1, 2, 3, 4, 5, 6, 0].map((dow) => {
          const hasClass   = daysWithClass.has(dow)
          const isToday    = dow === todayDow
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

      {/* ── Header: ngày ── */}
      <div className="mb-3">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200">
          {DAY_FULL[selectedDow]}
          {selectedDow === todayDow && (
            <span className="ml-2 rounded-full bg-[#0D2545] px-2 py-0.5 text-[10px] font-semibold text-white">
              Hôm nay
            </span>
          )}
        </h2>
        <p className="text-xs text-gray-400">{selectedDateStr}</p>
      </div>

      {/* ── Stat bar ── */}
      {totalCount > 0 && (
        <div className="mb-3 grid grid-cols-4 gap-2">
          <div className="rounded-xl bg-white px-3 py-2.5 text-center shadow-sm">
            <div className="text-lg font-bold text-[#0D2545]">{totalCount}</div>
            <div className="text-[11px] text-gray-400">Tổng</div>
          </div>
          <div className="rounded-xl bg-emerald-50 px-3 py-2.5 text-center shadow-sm">
            <div className="text-lg font-bold text-emerald-600">{presentCount}</div>
            <div className="text-[11px] text-emerald-500">Có mặt</div>
          </div>
          <div className="rounded-xl bg-red-50 px-3 py-2.5 text-center shadow-sm">
            <div className="text-lg font-bold text-red-400">{absentCount}</div>
            <div className="text-[11px] text-red-400">Vắng</div>
          </div>
          <div className="rounded-xl bg-gray-50 px-3 py-2.5 text-center shadow-sm">
            <div className="text-lg font-bold text-gray-400">{pendingCount}</div>
            <div className="text-[11px] text-gray-400">Chưa</div>
          </div>
        </div>
      )}

      {/* ── Danh sách học sinh ── */}
      {classesForDay.length === 0 ? (
        <div className="flex h-40 items-center justify-center rounded-xl bg-white text-sm text-gray-400 shadow-sm">
          Không có lớp vào {DAY_FULL[selectedDow]}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          {classesForDay.map((cls: Class, clsIdx) => {
            const clsStudents = students.filter((s) => s.class_id === cls.id)
            if (clsStudents.length === 0) return null

            return (
              <div key={cls.id}>
                {/* Divider nhỏ giữa các lớp */}
                {clsIdx > 0 && <div className="h-px bg-gray-100" />}

                {/* Header lớp — chỉ hiện nếu có 2+ lớp trong ngày */}
                {classesForDay.length > 1 && (
                  <div className="flex items-center gap-2 bg-gray-50/70 px-4 py-2">
                    <span className="text-xs font-semibold text-gray-500">{cls.name}</span>
                    <span className="text-xs text-gray-400">
                      {formatTime(cls.time_start)}–{formatTime(cls.time_end)}
                    </span>
                    {assignedIds.has(cls.id) && (
                      <span className="rounded-full bg-[#0D2545] px-1.5 py-0.5 text-[10px] font-semibold text-white">
                        Lớp của bạn
                      </span>
                    )}
                  </div>
                )}

                {/* Danh sách học sinh */}
                <div className="divide-y divide-gray-100">
                  {clsStudents.map((student: Student) => {
                    const pkg     = packages.find((p) => p.student_id === student.id)
                    const session = sessions.find((s) => s.student_id === student.id)

                    return pkg ? (
                      <AttendanceRow
                        key={student.id}
                        student={student}
                        pkg={pkg}
                        session={session}
                        classId={cls.id}
                        sessionDate={selectedDateStr}
                        profileId={profile?.id ?? ''}
                      />
                    ) : (
                      <div key={student.id} className="flex items-center justify-between px-4 py-3">
                        <span className="text-sm text-gray-600">{student.nickname ?? student.full_name}</span>
                        <span className="text-xs text-red-400">Hết gói</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}

          {students.length === 0 && (
            <div className="py-12 text-center text-sm text-gray-400">
              Chưa có học sinh nào
            </div>
          )}
        </div>
      )}
    </div>
  )
}
