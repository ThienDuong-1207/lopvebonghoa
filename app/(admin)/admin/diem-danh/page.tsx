export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/supabase/queries'
import Topbar from '@/components/admin/Topbar'
import type { Class, Student, Package, Session } from '@/lib/types/database'
import { formatDays } from '@/lib/types/database'
import AdminCheckinButton from './AdminCheckinButton'

function formatTime(t: string) { return t.slice(0, 5) }

interface MakeupEntry {
  id: string
  full_name: string
  nickname: string | null
  class_id: string | null
  package_id: string
  used_sessions: number
  total_sessions: number
  sessionId?: string
  sessionStatus: 'present' | 'absent' | 'makeup' | null
}

interface Props {
  searchParams: { date?: string; class_id?: string }
}

export default async function AdminDiemDanhPage({ searchParams }: Props) {
  const supabase = createClient()
  const profile = await getProfile()

  const today = new Date().toISOString().split('T')[0]
  const selectedDate = searchParams.date || today
  const selectedClassId = searchParams.class_id || ''

  const { data: classes } = await supabase
    .from('classes')
    .select('*')
    .eq('is_active', true)
    .order('name')

  let students: Student[] = []
  let packages: Package[] = []
  let sessions: Session[] = []
  let makeupCandidates: MakeupEntry[] = []
  let selectedClass: Class | null = null

  if (selectedClassId) {
    selectedClass = (classes ?? []).find((c: Class) => c.id === selectedClassId) ?? null

    const [studentsRes, sessionsRes] = await Promise.all([
      supabase.from('students').select('*').eq('class_id', selectedClassId).eq('status', 'active').order('full_name'),
      supabase.from('sessions').select('*').eq('class_id', selectedClassId).eq('session_date', selectedDate),
    ])

    students = studentsRes.data ?? []
    sessions = sessionsRes.data ?? []

    const studentIds = students.map((s: Student) => s.id)
    if (studentIds.length > 0) {
      const { data: pkgs } = await supabase
        .from('packages').select('*').in('student_id', studentIds).eq('status', 'active')
      packages = pkgs ?? []
    }

    // Học bù: học sinh KHÔNG thuộc lớp này, có gói active
    let makeupQuery = supabase
      .from('students')
      .select('id, full_name, nickname, class_id')
      .eq('status', 'active')
      .neq('class_id', selectedClassId)
    if (studentIds.length > 0) {
      makeupQuery = makeupQuery.not('id', 'in', `(${studentIds.join(',')})`)
    }

    const { data: makeupRaw } = await makeupQuery
    const makeupIds = (makeupRaw ?? []).map((s: { id: string }) => s.id)

    if (makeupIds.length > 0) {
      const [{ data: mPkgs }, { data: mSessions }] = await Promise.all([
        supabase.from('packages').select('id, student_id, used_sessions, total_sessions')
          .in('student_id', makeupIds).eq('status', 'active'),
        supabase.from('sessions').select('id, student_id, status')
          .eq('class_id', selectedClassId).eq('session_date', selectedDate)
          .in('student_id', makeupIds),
      ])

      makeupCandidates = (makeupRaw ?? [])
        .map((s: { id: string; full_name: string; nickname: string | null; class_id: string | null }) => {
          const pkg = (mPkgs ?? []).find((p: { student_id: string }) => p.student_id === s.id)
          if (!pkg) return null
          const sess = (mSessions ?? []).find((ms: { student_id: string }) => ms.student_id === s.id)
          return {
            id:            s.id,
            full_name:     s.full_name,
            nickname:      s.nickname,
            class_id:      s.class_id,
            package_id:    pkg.id,
            used_sessions: pkg.used_sessions,
            total_sessions: pkg.total_sessions,
            sessionId:     sess?.id,
            sessionStatus: (sess?.status ?? null) as 'present' | 'absent' | 'makeup' | null,
          }
        })
        .filter(Boolean) as MakeupEntry[]

      // Đưa lên đầu những em đã được ghi học bù
      makeupCandidates.sort((a, b) => {
        if (a.sessionStatus && !b.sessionStatus) return -1
        if (!a.sessionStatus && b.sessionStatus) return 1
        return a.full_name.localeCompare(b.full_name)
      })
    }
  }

  const presentCount = sessions.filter((s: Session) => s.status === 'present' && students.find(st => st.id === s.student_id)).length
  const absentCount  = sessions.filter((s: Session) => s.status === 'absent' && students.find(st => st.id === s.student_id)).length
  const makeupCount  = makeupCandidates.filter(m => m.sessionStatus === 'makeup').length

  return (
    <>
      <Topbar title="Điểm danh thủ công" />
      <div className="min-h-screen bg-gray-50 p-6 dark:bg-gray-900">

        {/* Bộ lọc */}
        <form method="GET" className="mb-6 flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">Ngày</label>
            <input
              type="date"
              name="date"
              defaultValue={selectedDate}
              max={today}
              className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">Lớp học (buổi diễn ra)</label>
            <select
              name="class_id"
              defaultValue={selectedClassId}
              className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            >
              <option value="">— Chọn lớp —</option>
              {(classes ?? []).map((c: Class) => (
                <option key={c.id} value={c.id}>
                  {c.name} · {formatTime(c.time_start)}–{formatTime(c.time_end)} ({formatDays(c.days_of_week)})
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            className="rounded-xl bg-[#0D2545] px-5 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#0D2545]/90"
          >
            Xem
          </button>
        </form>

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
                  const pkg = packages.find((p: Package) => p.student_id === student.id)
                  const session = sessions.find((s: Session) => s.student_id === student.id)
                  const initials = student.full_name.split(' ').map((w: string) => w[0]).slice(-2).join('').toUpperCase()

                  return (
                    <div key={student.id} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/40">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[#0D2545]/10 text-sm font-semibold text-[#0D2545] dark:bg-[#C9A84C]/15 dark:text-[#C9A84C]">
                          {initials}
                        </div>
                        <div>
                          <div className="font-medium text-gray-800 dark:text-gray-100">
                            {student.nickname ?? student.full_name}
                            {student.nickname && <span className="ml-1.5 text-xs text-gray-400">({student.full_name})</span>}
                          </div>
                          {pkg ? (
                            <div className="text-xs text-gray-400">
                              Buổi {pkg.used_sessions}/{pkg.total_sessions}
                              {pkg.total_sessions - pkg.used_sessions <= 2 && (
                                <span className="ml-1.5 font-medium text-red-400">· Còn {pkg.total_sessions - pkg.used_sessions}</span>
                              )}
                            </div>
                          ) : (
                            <div className="text-xs text-red-400">Chưa có gói học</div>
                          )}
                        </div>
                      </div>
                      {pkg ? (
                        <AdminCheckinButton
                          studentId={student.id}
                          packageId={pkg.id}
                          classId={selectedClassId}
                          sessionDate={selectedDate}
                          profileId={profile?.id ?? ''}
                          initialStatus={(session?.status as 'present' | 'absent' | 'makeup') ?? null}
                          sessionId={session?.id}
                        />
                      ) : (
                        <span className="text-xs text-red-400">Hết gói</span>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* ── Học bù ── */}
            {makeupCandidates.length > 0 && (
              <div className="overflow-hidden rounded-2xl border border-amber-200 bg-white shadow-sm dark:border-amber-800/40 dark:bg-gray-800">
                <div className="flex items-center justify-between border-b border-amber-100 bg-amber-50 px-5 py-3 dark:border-amber-800/30 dark:bg-amber-900/20">
                  <div>
                    <h3 className="font-semibold text-amber-700 dark:text-amber-400">Học bù tại buổi này</h3>
                    <p className="text-xs text-amber-600/70 dark:text-amber-500/70">
                      Học sinh lớp khác đến học bù — chọn lớp diễn ra buổi học đó
                    </p>
                  </div>
                  {makeupCount > 0 && (
                    <span className="rounded-full bg-amber-200 px-2.5 py-0.5 text-xs font-bold text-amber-700 dark:bg-amber-800 dark:text-amber-300">
                      {makeupCount} đã ghi
                    </span>
                  )}
                </div>

                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                  {makeupCandidates.map((m: MakeupEntry) => {
                    const initials = m.full_name.split(' ').map((w: string) => w[0]).slice(-2).join('').toUpperCase()
                    const hostClass = (classes ?? []).find((c: Class) => c.id === m.class_id)

                    return (
                      <div key={m.id} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/40">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-amber-100 text-sm font-semibold text-amber-700 dark:bg-amber-900/40 dark:text-amber-400">
                            {initials}
                          </div>
                          <div>
                            <div className="font-medium text-gray-800 dark:text-gray-100">
                              {m.nickname ?? m.full_name}
                              {m.nickname && <span className="ml-1.5 text-xs text-gray-400">({m.full_name})</span>}
                            </div>
                            <div className="text-xs text-gray-400">
                              Lớp: {hostClass?.name ?? '—'} · Buổi {m.used_sessions}/{m.total_sessions}
                            </div>
                          </div>
                        </div>
                        <AdminCheckinButton
                          studentId={m.id}
                          packageId={m.package_id}
                          classId={selectedClassId}
                          sessionDate={selectedDate}
                          profileId={profile?.id ?? ''}
                          initialStatus={m.sessionStatus}
                          sessionId={m.sessionId}
                        />
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

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
