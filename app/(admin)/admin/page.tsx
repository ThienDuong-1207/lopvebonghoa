export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import MetricCard from '@/components/admin/MetricCard'
import Topbar from '@/components/admin/Topbar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import type { Slot, Alert, Student } from '@/lib/types/database'

const DAY_SHORT = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']
const ALERT_LABEL: Record<string, string> = {
  near_end: 'Sắp hết gói',
  package_ended: 'Hết gói',
  inactive: 'Nghỉ >14 ngày',
  new_registration: 'Đăng ký mới',
}
const ALERT_COLOR: Record<string, 'destructive' | 'default' | 'secondary' | 'outline'> = {
  near_end: 'default',
  package_ended: 'destructive',
  inactive: 'secondary',
  new_registration: 'outline',
}

function formatTime(t: string) {
  return t.slice(0, 5)
}

export default async function AdminDashboard() {
  const supabase = createClient()

  const today = new Date()
  const todayDow = today.getDay()
  const todayStr = today.toISOString().split('T')[0]
  const monthStart = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`

  const [
    { count: activeStudents },
    { count: todayCheckins },
    { count: pendingRegistrations },
    { count: unresolvedAlerts },
    { data: slots },
    { data: alerts },
    { data: monthPayments },
  ] = await Promise.all([
    supabase.from('students').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('sessions').select('*', { count: 'exact', head: true }).eq('session_date', todayStr),
    supabase.from('registrations').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('alerts').select('*', { count: 'exact', head: true }).eq('resolved', false),
    supabase.from('slots').select('*').eq('is_active', true).order('day_of_week').order('time_start'),
    supabase
      .from('alerts')
      .select('*, students(full_name)')
      .eq('resolved', false)
      .order('triggered_at', { ascending: false })
      .limit(5),
    supabase.from('packages').select('amount_paid').gte('paid_at', monthStart),
  ])

  const monthRevenue = (monthPayments ?? []).reduce(
    (sum: number, p: { amount_paid: number }) => sum + p.amount_paid,
    0
  )

  const todaySlots = (slots ?? []).filter((s: Slot) => s.day_of_week === todayDow)

  return (
    <>
      <Topbar title="Dashboard" />
      <div className="p-6">
        {/* Metrics */}
        <div className="mb-6 grid grid-cols-2 gap-4 xl:grid-cols-4">
          <MetricCard title="Học sinh hôm nay" value={todayCheckins ?? 0} color="blue" />
          <MetricCard title="Tổng học sinh active" value={activeStudents ?? 0} color="green" />
          <MetricCard
            title="Cần xử lý"
            value={(pendingRegistrations ?? 0) + (unresolvedAlerts ?? 0)}
            sub={`${pendingRegistrations ?? 0} đăng ký · ${unresolvedAlerts ?? 0} cảnh báo`}
            color="amber"
          />
          <MetricCard
            title="Doanh thu tháng"
            value={`${(monthRevenue / 1_000_000).toFixed(1)}M`}
            color="green"
          />
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          {/* Ca hôm nay */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Ca hôm nay — {DAY_SHORT[todayDow]}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {todaySlots.length === 0 ? (
                <p className="text-sm text-gray-400">Không có ca hôm nay</p>
              ) : (
                todaySlots.map((slot: Slot) => (
                  <div key={slot.id} className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3">
                    <div>
                      <div className="font-medium">{slot.name}</div>
                      <div className="text-sm text-gray-500">
                        {formatTime(slot.time_start)}–{formatTime(slot.time_end)}
                      </div>
                    </div>
                    <Badge variant="outline">Tối đa {slot.max_capacity}</Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Cảnh báo ưu tiên */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Cảnh báo cần xử lý{' '}
                {(unresolvedAlerts ?? 0) > 0 && (
                  <Badge variant="destructive" className="ml-2">
                    {unresolvedAlerts}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {(alerts ?? []).length === 0 ? (
                <p className="text-sm text-gray-400">Không có cảnh báo</p>
              ) : (
                (alerts ?? []).map((alert: Alert & { students: { full_name: string } }) => (
                  <div key={alert.id} className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium">{alert.students?.full_name}</div>
                      <Badge variant={ALERT_COLOR[alert.type]} className="mt-1 text-xs">
                        {ALERT_LABEL[alert.type]}
                      </Badge>
                    </div>
                    <Link
                      href="/admin/canh-bao"
                      className="text-xs text-[#0D2545] underline"
                    >
                      Xử lý
                    </Link>
                  </div>
                ))
              )}
              <Link href="/admin/canh-bao" className="block text-center text-xs text-gray-400 hover:text-[#0D2545]">
                Xem tất cả →
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}
