export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/supabase/queries'
import Topbar from '@/components/admin/Topbar'
import type { Class, Student, Package, Session } from '@/lib/types/database'
import { formatDays } from '@/lib/types/database'
import AdminAttendanceRow from './AdminAttendanceRow'
import DateClassPicker from './DateClassPicker'
import MakeupSearchBox from './MakeupSearchBox'

function formatTime(t: string) { return t.slice(0, 5) }

interface Props {
  searchParams: { date?: string; class_id?: string }
}

export default async function AdminDiemDanhPage({ searchParams }: Props) {
  const supabase = createClient()
  const profile = await getProfile()

  const today = new Date().toISOString().split('T')[0]
  const selectedDate    = searchParams.date     || today
  const selectedClassId = searchParams.class_id || ''
  const selectedDow     = new Date(selectedDate + 'T12:00:00').getDay()

  const { data: classes } = await supabase
    .from('classes')
    .select('*')
    .eq('is_active', true)
    .order('name')

  let students: Student[]   = []
  let packages: Package[]   = []
  let sessions:  Session[]  = []
  let selectedClass: Class | null = null

  if (selectedClassId) {
    selectedClass = (classes ?? []).find((c: Class) => c.id === selectedClassId) ?? null

    const [allStudentsRes, sessionsRes] = await Promise.all([
      supabase.from('students').select('*')
        .eq('class_id', selectedClassId)
        .eq('status', 'active')
        .lte('enrolled_at', selectedDate)   // chỉ học sinh bắt đầu học trước hoặc đúng ngày này
        .order('full_name'),
      supabase.from('sessions').select('*').eq('class_id', selectedClassId).eq('session_date', selectedDate),
    ])

    const allStudents: Student[] = allStudentsRes.data ?? []
    sessions = sessionsRes.data ?? []

    if (allStudents.length > 0) {
      const allIds = allStudents.map((s: Student) => s.id)

      const { data: eligiblePkgs } = await supabase
        .from('packages')
        .select('*')
        .in('student_id', allIds)
        .neq('status', 'cancelled')
        .order('created_at', { ascending: false })

      packages = eligiblePkgs ?? []

      const eligibleIds = new Set(packages.map((p: Package) => p.student_id))
      students = allStudents.filter((s: Student) =>
        eligibleIds.has(s.id) &&
        (!s.attend_days || s.attend_days.length === 0 || s.attend_days.includes(selectedDow))
      )
    }
  }

  const presentCount = sessions.filter((s: Session) => s.status === 'present' && students.find((st) => st.id === s.student_id)).length
  const absentCount  = sessions.filter((s: Session) => s.status === 'absent'  && students.find((st) => st.id === s.student_id)).length
  const studentIds   = students.map((s) => s.id)

  return (
    <>
      <Topbar title="Điểm danh thủ công" />
      <div className="min-h-screen bg-gray-50 p-6 dark:bg-gray-900">

        {/* Bộ lọc — tự động refresh khi đổi */}
        <DateClassPicker
          classes={(classes ?? []).map((c: Class) => ({
            id:           c.id,
            name:         c.name,
            days_of_week: c.days_of_week,
            time_start:   c.time_start,
            time_end:     c.time_end,
          }))}
          selectedDate={selectedDate}
          selectedClassId={selectedClassId}
          maxDate={today}
        />

        {selectedClassId && selectedClass ? (
          <div className="space-y-4">

            {/* ── Học sinh chính thức ── */}
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 px-5 py-4 dark:border-gray-700">
                <div>
                  <h2 className="font-semibold text-gray-800 dark:text-gray-100">{selectedClass.name}</h2>
                  <p className="text-xs text-gray-400">
                    {selectedDate} · {formatDays(selectedClass.days_of_week)} · {formatTime(selectedClass.time_start)}–{formatTime(selectedClass.time_end)}
                  </p>
                </div>
                <div className="flex gap-5 text-center">
                  <div>
                    <div className="text-lg font-bold text-emerald-600">{presentCount}</div>
                    <div className="text-xs text-gray-400">Có mặt</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-red-400">{absentCount}</div>
                    <div className="text-xs text-gray-400">Vắng</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-gray-400">
                      {students.length - presentCount - absentCount}
                    </div>
                    <div className="text-xs text-gray-400">Chưa</div>
                  </div>
                </div>
              </div>

              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {students.length === 0 ? (
                  <div className="py-12 text-center text-sm text-gray-400">Chưa có học sinh trong lớp này</div>
                ) : students.map((student: Student) => {
                  const pkg     = packages.find((p: Package) => p.student_id === student.id)
                  const session = sessions.find((s: Session) => s.student_id === student.id)

                  return pkg ? (
                    <AdminAttendanceRow
                      key={student.id}
                      student={student}
                      pkg={pkg}
                      session={session}
                      classId={selectedClassId}
                      sessionDate={selectedDate}
                      profileId={profile?.id ?? ''}
                    />
                  ) : (
                    <div key={student.id} className="flex items-center justify-between px-5 py-3">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                        {student.nickname ?? student.full_name}
                      </span>
                      <span className="text-xs text-red-400">Chưa có gói học</span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* ── Học bù — search & add ── */}
            <MakeupSearchBox
              key={`${selectedClassId}-${selectedDate}`}
              classId={selectedClassId}
              sessionDate={selectedDate}
              profileId={profile?.id ?? ''}
              excludeIds={studentIds}
            />

          </div>
        ) : (
          <div className="flex h-52 items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white text-gray-400 dark:border-gray-700 dark:bg-gray-800">
            <div className="text-center">
              <div className="text-3xl">📋</div>
              <p className="mt-2 text-sm">Chọn ngày và lớp để xem điểm danh</p>
              <p className="mt-1 text-xs text-gray-300 dark:text-gray-600">
                Chọn lớp <strong>diễn ra buổi học đó</strong>, không phải lớp của học sinh
              </p>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
