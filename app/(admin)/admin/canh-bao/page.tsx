export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import Topbar from '@/components/admin/Topbar'
import AlertRow from '@/components/admin/AlertRow'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { formatDate } from '@/lib/utils/formatters'
import ReassignSessionButton from '@/components/admin/ReassignSessionButton'

type PkgLite = { id: string; student_id: string; start_date: string; status: string }
type SessionLite = { id: string; session_date: string; status: string; student_id: string; package_id: string }

// Buổi điểm danh đang gắn vào 1 gói đã 'completed' trong khi có gói mới
// hơn (cùng học sinh) cũng đủ điều kiện tại ngày điểm danh đó — dấu hiệu
// bị gán nhầm gói (xem quy trình đối soát ở trang Thanh toán).
function findMisattributed(sessions: SessionLite[], packages: PkgLite[]) {
  const pkgById = new Map(packages.map((p) => [p.id, p]))
  const byStudent = new Map<string, PkgLite[]>()
  for (const p of packages) {
    if (!byStudent.has(p.student_id)) byStudent.set(p.student_id, [])
    byStudent.get(p.student_id)!.push(p)
  }

  return sessions
    .map((s) => {
      const oldPkg = pkgById.get(s.package_id)
      if (!oldPkg || oldPkg.status !== 'completed') return null
      const candidates = (byStudent.get(s.student_id) ?? []).filter(
        (p) => p.id !== oldPkg.id && p.start_date <= s.session_date && p.start_date > oldPkg.start_date
      )
      if (candidates.length === 0) return null
      const newPkg = candidates.sort((a, b) => b.start_date.localeCompare(a.start_date))[0]
      return { session: s, oldPkg, newPkg }
    })
    .filter((x): x is { session: SessionLite; oldPkg: PkgLite; newPkg: PkgLite } => x !== null)
}

export default async function CanhBaoPage() {
  const supabase = createClient()

  // Refresh inactive alerts mỗi khi admin vào trang
  await supabase.rpc('fn_refresh_inactive_alerts')

  const [{ data: alerts }, { data: allPackages }, { data: allSessions }, { data: allStudents }] = await Promise.all([
    supabase
      .from('alerts')
      .select(`
        *,
        students (
          full_name,
          classes ( days_of_week ),
          parents ( full_name, phone ),
          packages ( used_sessions, total_sessions, status, sessions ( session_date, status ) )
        )
      `)
      .eq('resolved', false)
      .order('triggered_at', { ascending: false }),
    supabase.from('packages').select('id, student_id, start_date, status').neq('status', 'cancelled'),
    supabase.from('sessions').select('id, session_date, status, student_id, package_id').in('status', ['present', 'makeup']),
    supabase.from('students').select('id, full_name'),
  ])

  const studentNameById = new Map((allStudents ?? []).map((s: { id: string; full_name: string }) => [s.id, s.full_name]))
  const misattributed = findMisattributed(
    (allSessions ?? []) as SessionLite[],
    (allPackages ?? []) as PkgLite[]
  )

  const packageEnded = (alerts ?? []).filter((a: { type: string }) => a.type === 'package_ended')
  const nearEnd     = (alerts ?? []).filter((a: { type: string }) => a.type === 'near_end')
  const inactive    = (alerts ?? []).filter((a: { type: string }) => a.type === 'inactive')

  const dotColor: Record<string, string> = {
    red: 'bg-red-500', amber: 'bg-amber-400', gray: 'bg-gray-400',
  }

  type AlertItem = {
    id: string
    type: string
    zalo_sent_at: string | null
    resolved: boolean
    students: {
      full_name: string
      classes: { days_of_week: number[] } | null
      parents: { full_name: string; phone: string } | null
      packages: {
        used_sessions: number
        total_sessions: number
        status: string
        sessions: { session_date: string; status: string }[]
      }[]
    }
  }

  function getLastSessionDate(alert: AlertItem): string | null {
    const pkgs = alert.students.packages ?? []
    const allSessions = pkgs.flatMap((p) => p.sessions ?? [])
    const attended = allSessions
      .filter((s) => s.status === 'present' || s.status === 'makeup')
      .map((s) => s.session_date)
      .sort()
    return attended.length > 0 ? attended[attended.length - 1] : null
  }

  // Dùng Date(y, m-1, d) để tránh timezone bug khi parse YYYY-MM-DD
  function getNextSessionDate(lastDate: string | null, daysOfWeek: number[]): string | null {
    if (!lastDate || daysOfWeek.length === 0) return null
    const [y, m, d] = lastDate.split('-').map(Number)
    const date = new Date(y, m - 1, d + 1) // local time, bắt đầu từ ngày hôm sau
    for (let i = 0; i < 14; i++) {
      if (daysOfWeek.includes(date.getDay())) {
        const yy = date.getFullYear()
        const mm = String(date.getMonth() + 1).padStart(2, '0')
        const dd = String(date.getDate()).padStart(2, '0')
        return `${yy}-${mm}-${dd}`
      }
      date.setDate(date.getDate() + 1)
    }
    return null
  }

  function renderGroup(
    title: string,
    items: AlertItem[] | null,
    badge?: string,
    color: 'red' | 'amber' | 'gray' = 'gray'
  ) {
    if (!items || items.length === 0) return null
    return (
      <div className="mb-8">
        <div className="mb-3 flex items-center gap-2">
          <span className={`h-2.5 w-2.5 rounded-full ${dotColor[color]}`} />
          <h3 className="font-semibold text-gray-700 dark:text-gray-200">{title}</h3>
          {badge && <Badge variant="destructive">{badge}</Badge>}
        </div>
        <div className="space-y-3">
          {items.map((alert) => {
            const pkg = alert.students.packages.find((p) => p.status === 'active')
              ?? alert.students.packages.find((p) => p.status === 'completed')
            const lastSessionDate = getLastSessionDate(alert)
            const daysOfWeek = alert.students.classes?.days_of_week ?? []
            const nextSessionDate = getNextSessionDate(lastSessionDate, daysOfWeek)
            return (
              <AlertRow
                key={alert.id}
                alertId={alert.id}
                type={alert.type as 'package_ended' | 'near_end' | 'inactive' | 'new_registration'}
                studentName={alert.students.full_name}
                parentName={alert.students.parents?.full_name ?? ''}
                parentPhone={alert.students.parents?.phone ?? ''}
                sessionsUsed={pkg?.used_sessions ?? 0}
                sessionsTotal={pkg?.total_sessions ?? 8}
                sessionsLeft={pkg ? pkg.total_sessions - pkg.used_sessions : 0}
                lastSessionDate={lastSessionDate}
                nextSessionDate={nextSessionDate}
                zaloSentAt={alert.zalo_sent_at}
                resolved={alert.resolved}
              />
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <>
      <Topbar title="Cảnh báo & Zalo" />
      <div className="p-6">
        {(alerts ?? []).length === 0 && misattributed.length === 0 ? (
          <div className="flex h-[50vh] items-center justify-center text-center text-gray-400">
            <div>
              <CheckCircle2 className="mx-auto h-12 w-12 text-green-400" />
              <p className="mt-3">Không có cảnh báo nào cần xử lý</p>
            </div>
          </div>
        ) : (
          <>
            {renderGroup('Hết gói', packageEnded as AlertItem[], String(packageEnded.length), 'red')}
            {renderGroup('Sắp hết gói', nearEnd as AlertItem[], String(nearEnd.length), 'amber')}
            {renderGroup('Nghỉ trên 14 ngày', inactive as AlertItem[], String(inactive.length), 'gray')}
          </>
        )}

        {misattributed.length > 0 && (
          <div className="mb-8">
            <div className="mb-3 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <h3 className="font-semibold text-gray-700 dark:text-gray-200">Buổi điểm danh nghi gán sai gói</h3>
              <Badge variant="destructive">{misattributed.length}</Badge>
            </div>
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-700/50">
                  <tr>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Học sinh</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Ngày điểm danh</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Đang thuộc gói (đã hết)</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Có gói mới hơn bắt đầu</th>
                    <th className="px-4 py-2.5"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {misattributed.map(({ session, oldPkg, newPkg }) => (
                    <tr key={session.id}>
                      <td className="px-4 py-2.5 font-medium text-gray-800 dark:text-gray-100">
                        {studentNameById.get(session.student_id) ?? '—'}
                      </td>
                      <td className="px-4 py-2.5 text-gray-600 dark:text-gray-300">{formatDate(session.session_date)}</td>
                      <td className="px-4 py-2.5 text-gray-400">{formatDate(oldPkg.start_date)}</td>
                      <td className="px-4 py-2.5 text-gray-400">{formatDate(newPkg.start_date)}</td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <ReassignSessionButton sessionId={session.id} newPackageId={newPkg.id} />
                          <Link
                            href={`/admin/hoc-sinh/${session.student_id}`}
                            className="text-xs text-[#0D2545] hover:underline dark:text-[#C9A84C]"
                          >
                            Xem →
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-xs text-gray-400">
              Vào trang chi tiết học sinh, tạo lại gói cho đúng ngày (nếu cần) để hệ thống hỏi gán lại các buổi này.
            </p>
          </div>
        )}
      </div>
    </>
  )
}
