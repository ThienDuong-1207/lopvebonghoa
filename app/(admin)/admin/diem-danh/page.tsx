export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/supabase/queries'
import Topbar from '@/components/admin/Topbar'
import type { Class, Student, Package, Session } from '@/lib/types/database'
import AdminAttendanceSection from './AdminAttendanceSection'
import DateClassPicker from './DateClassPicker'
import MakeupSearchBox from './MakeupSearchBox'

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

  const studentSet   = new Set(students.map((s) => s.id))
  const presentCount = sessions.filter((s: Session) => (s.status === 'present' || s.status === 'makeup') && studentSet.has(s.student_id)).length
  const absentCount  = sessions.filter((s: Session) => s.status === 'absent' && studentSet.has(s.student_id)).length
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
            <AdminAttendanceSection
              selectedClass={selectedClass}
              selectedClassId={selectedClassId}
              selectedDate={selectedDate}
              students={students}
              packages={packages}
              sessions={sessions}
              profileId={profile?.id ?? ''}
              initPresentCount={presentCount}
              initAbsentCount={absentCount}
            />

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
