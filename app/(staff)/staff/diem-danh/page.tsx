export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/supabase/queries'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import StaffAttendanceSection from '@/components/staff/StaffAttendanceSection'
import type { Class, Student, Package, Session } from '@/lib/types/database'
import { DAY_SHORT, DAY_FULL } from '@/lib/types/database'

interface Props {
  searchParams: { dow?: string; week?: string }
}

export default async function DiemDanhPage({ searchParams }: Props) {
  const supabase = createClient()
  const profile = await getProfile()

  const today = new Date()
  const todayDow = today.getDay()
  const selectedDow = searchParams.dow !== undefined ? Number(searchParams.dow) : todayDow
  // weekOffset ≤ 0: không cho chọn tuần tương lai
  const weekOffset = Math.min(0, Number(searchParams.week ?? 0))

  // Tính ngày thực tế (CN=0 → 7 để tránh offset âm) + dịch theo tuần
  const toW = (d: number) => (d === 0 ? 7 : d)
  const d = new Date(today)
  d.setDate(today.getDate() + toW(selectedDow) - toW(todayDow) + weekOffset * 7)
  const selectedDateStr = d.toISOString().split('T')[0]

  // Thứ Hai và Chủ Nhật của tuần đang chọn (để hiện range trên header)
  const monday = new Date(today)
  monday.setDate(today.getDate() + (1 - toW(todayDow)) + weekOffset * 7)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  const fmtDMY = (dt: Date) =>
    `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')}`

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
        .lte('start_date', selectedDateStr)
        .order('start_date', { ascending: false })
      packages = pkgs ?? []
    }
  }

  // Thống kê — chỉ tính học sinh có gói học
  const eligibleStudentIds = new Set(packages.map((p) => p.student_id))
  const eligibleStudents   = students.filter((s) => eligibleStudentIds.has(s.id))
  const totalCount   = eligibleStudents.length
  const presentCount = sessions.filter((s) => eligibleStudentIds.has(s.student_id) && (s.status === 'present' || s.status === 'makeup')).length
  const absentCount  = sessions.filter((s) => eligibleStudentIds.has(s.student_id) && s.status === 'absent').length

  return (
    <div className="p-4">

      {/* ── Điều hướng tuần ── */}
      <div className="mb-3 flex items-center justify-between gap-2">
        <Link
          href={`/staff/diem-danh?dow=${selectedDow}&week=${weekOffset - 1}`}
          className="flex items-center gap-1 rounded-xl bg-white px-3 py-2 text-xs font-medium text-gray-600 shadow-sm active:scale-95"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Tuần trước
        </Link>

        <div className="text-center">
          {weekOffset === 0 ? (
            <span className="text-xs font-semibold text-[#0D2545]">Tuần này</span>
          ) : (
            <span className="text-xs font-medium text-gray-500">
              {fmtDMY(monday)} – {fmtDMY(sunday)}
            </span>
          )}
        </div>

        {weekOffset < 0 ? (
          <Link
            href={`/staff/diem-danh?dow=${selectedDow}&week=${weekOffset + 1}`}
            className="flex items-center gap-1 rounded-xl bg-white px-3 py-2 text-xs font-medium text-gray-600 shadow-sm active:scale-95"
          >
            Tuần sau
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        ) : (
          <div className="w-[90px]" />
        )}
      </div>

      {/* ── Tabs ngày ── */}
      <div className="mb-4 grid grid-cols-7 gap-1.5">
        {[1, 2, 3, 4, 5, 6, 0].map((dow) => {
          const hasClass   = daysWithClass.has(dow)
          const isToday    = dow === todayDow && weekOffset === 0
          const isSelected = dow === selectedDow
          return (
            <Link
              key={dow}
              href={`/staff/diem-danh?dow=${dow}&week=${weekOffset}`}
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
          {selectedDow === todayDow && weekOffset === 0 && (
            <span className="ml-2 rounded-full bg-[#0D2545] px-2 py-0.5 text-[10px] font-semibold text-white">
              Hôm nay
            </span>
          )}
        </h2>
        <p className="text-xs text-gray-400">{selectedDateStr}</p>
      </div>

      {/* ── Stat bar + danh sách học sinh (client component để cập nhật real-time) ── */}
      {classesForDay.length === 0 ? (
        <div className="flex h-40 items-center justify-center rounded-xl bg-white text-sm text-gray-400 shadow-sm">
          Không có lớp vào {DAY_FULL[selectedDow]}
        </div>
      ) : (
        <StaffAttendanceSection
          classesForDay={classesForDay}
          students={students}
          packages={packages}
          sessions={sessions}
          profileId={profile?.id ?? ''}
          selectedDateStr={selectedDateStr}
          assignedClassIds={Array.from(assignedIds)}
          initPresentCount={presentCount}
          initAbsentCount={absentCount}
          totalCount={totalCount}
        />
      )}
    </div>
  )
}
