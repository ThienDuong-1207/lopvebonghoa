export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import Topbar from '@/components/admin/Topbar'
import AlertRow from '@/components/admin/AlertRow'
import { Badge } from '@/components/ui/badge'

export default async function CanhBaoPage() {
  const supabase = createClient()

  const { data: alerts } = await supabase
    .from('alerts')
    .select(`
      *,
      students (
        full_name,
        parents ( full_name, phone ),
        packages ( used_sessions, total_sessions, status )
      )
    `)
    .eq('resolved', false)
    .order('triggered_at', { ascending: false })

  const packageEnded = (alerts ?? []).filter((a: { type: string }) => a.type === 'package_ended')
  const nearEnd = (alerts ?? []).filter((a: { type: string }) => a.type === 'near_end')
  const inactive = (alerts ?? []).filter((a: { type: string }) => a.type === 'inactive')

  function renderGroup(
    title: string,
    items: typeof alerts,
    badge?: string
  ) {
    if (!items || items.length === 0) return null
    return (
      <div className="mb-8">
        <div className="mb-3 flex items-center gap-2">
          <h3 className="font-semibold text-gray-700">{title}</h3>
          {badge && <Badge variant="destructive">{badge}</Badge>}
        </div>
        <div className="space-y-3">
          {items.map((alert: {
            id: string
            type: string
            zalo_sent_at: string | null
            resolved: boolean
            students: {
              full_name: string
              parents: { full_name: string; phone: string } | null
              packages: { used_sessions: number; total_sessions: number; status: string }[]
            }
          }) => {
            const pkg = alert.students.packages.find((p) => p.status === 'active')
            return (
              <AlertRow
                key={alert.id}
                alertId={alert.id}
                type={alert.type as 'package_ended' | 'near_end' | 'inactive' | 'new_registration'}
                studentName={alert.students.full_name}
                parentName={alert.students.parents?.full_name ?? ''}
                parentPhone={alert.students.parents?.phone ?? ''}
                sessionsUsed={pkg?.used_sessions ?? 8}
                sessionsLeft={pkg ? pkg.total_sessions - pkg.used_sessions : 0}
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
        {(alerts ?? []).length === 0 ? (
          <div className="flex h-[50vh] items-center justify-center text-center text-gray-400">
            <div>
              <div className="text-4xl">✅</div>
              <p className="mt-3">Không có cảnh báo nào cần xử lý</p>
            </div>
          </div>
        ) : (
          <>
            {renderGroup('🔴 Hết gói', packageEnded, String(packageEnded.length))}
            {renderGroup('🟠 Sắp hết (còn 1 buổi)', nearEnd, String(nearEnd.length))}
            {renderGroup('🟢 Nghỉ >14 ngày', inactive, String(inactive.length))}
          </>
        )}
      </div>
    </>
  )
}
