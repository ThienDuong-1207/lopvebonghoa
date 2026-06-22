export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import Topbar from '@/components/admin/Topbar'
import AlertRow from '@/components/admin/AlertRow'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2 } from 'lucide-react'

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

  const dotColor: Record<string, string> = {
    red: 'bg-red-500',
    amber: 'bg-amber-400',
    gray: 'bg-gray-400',
  }

  function renderGroup(
    title: string,
    items: typeof alerts,
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
              ?? alert.students.packages.find((p) => p.status === 'completed')
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
              <CheckCircle2 className="mx-auto h-12 w-12 text-green-400" />
              <p className="mt-3">Không có cảnh báo nào cần xử lý</p>
            </div>
          </div>
        ) : (
          <>
            {renderGroup('Hết gói', packageEnded, String(packageEnded.length), 'red')}
            {renderGroup('Sắp hết gói', nearEnd, String(nearEnd.length), 'amber')}
            {renderGroup('Nghỉ trên 14 ngày', inactive, String(inactive.length), 'gray')}
          </>
        )}
      </div>
    </>
  )
}
