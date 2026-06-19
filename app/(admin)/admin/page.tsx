export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import MetricCard from '@/components/admin/MetricCard'
import RevenueChart from '@/components/admin/RevenueChart'
import AttendanceChart from '@/components/admin/AttendanceChart'
import Topbar from '@/components/admin/Topbar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { Users, UserCheck, TriangleAlert, Banknote } from 'lucide-react'
import type { Slot, Alert } from '@/lib/types/database'

const DAY_SHORT = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']
const MONTH_NAMES = ['T1','T2','T3','T4','T5','T6','T7','T8','T9','T10','T11','T12']
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

  // Ngày đầu tuần (Thứ 2)
  const weekStart = new Date(today)
  weekStart.setDate(today.getDate() - ((today.getDay() + 6) % 7))
  const weekStartStr = weekStart.toISOString().split('T')[0]

  // Ngày 6 tháng trước
  const sixMonthsAgo = new Date(today)
  sixMonthsAgo.setMonth(today.getMonth() - 5)
  sixMonthsAgo.setDate(1)
  const sixMonthsAgoStr = sixMonthsAgo.toISOString().split('T')[0]

  const [
    { count: activeStudents },
    { count: todayCheckins },
    { count: pendingRegistrations },
    { count: unresolvedAlerts },
    { data: slots },
    { data: alerts },
    { data: monthPayments },
    { data: allPayments },
    { data: weekSessions },
  ] = await Promise.all([
    supabase.from('students').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('sessions').select('*', { count: 'exact', head: true }).eq('session_date', todayStr),
    supabase.from('registrations').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('alerts').select('*', { count: 'exact', head: true }).eq('resolved', false),
    supabase.from('slots').select('*').eq('is_active', true).order('day_of_week').order('time_start'),
    supabase.from('alerts').select('*, students(full_name)').eq('resolved', false).order('triggered_at', { ascending: false }).limit(5),
    supabase.from('packages').select('amount_paid').gte('paid_at', monthStart),
    supabase.from('packages').select('amount_paid, paid_at').gte('paid_at', sixMonthsAgoStr),
    supabase.from('sessions').select('session_date, status').gte('session_date', weekStartStr),
  ])

  const monthRevenue = (monthPayments ?? []).reduce(
    (sum: number, p: { amount_paid: number }) => sum + p.amount_paid, 0
  )

  // Chart data: doanh thu 6 tháng
  const revenueChartData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(today)
    d.setMonth(today.getMonth() - (5 - i))
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const revenue = (allPayments ?? [])
      .filter((p: { paid_at: string }) => p.paid_at.startsWith(key))
      .reduce((sum: number, p: { amount_paid: number }) => sum + p.amount_paid, 0)
    return { month: MONTH_NAMES[d.getMonth()], revenue: revenue / 1_000_000 }
  })

  // Chart data: điểm danh tuần này (T2→CN)
  const attendanceChartData = [1, 2, 3, 4, 5, 6, 0].map((dow) => {
    const d = new Date(weekStart)
    d.setDate(weekStart.getDate() + ((dow - 1 + 7) % 7))
    const dateStr = d.toISOString().split('T')[0]
    const count = (weekSessions ?? []).filter(
      (s: { session_date: string; status: string }) =>
        s.session_date === dateStr && s.status === 'present'
    ).length
    return { day: DAY_SHORT[dow], count, isToday: dow === todayDow }
  })

  const todaySlots = (slots ?? []).filter((s: Slot) => s.day_of_week === todayDow)

  return (
    <>
      <Topbar title="Dashboard" />
      <div className="p-6">
        {/* Metrics */}
        <div className="mb-6 grid grid-cols-2 gap-4 xl:grid-cols-4">
          <MetricCard title="Điểm danh hôm nay" value={todayCheckins ?? 0} color="blue" icon={UserCheck} />
          <MetricCard title="Học sinh đang học" value={activeStudents ?? 0} color="green" icon={Users} />
          <MetricCard
            title="Cần xử lý"
            value={(pendingRegistrations ?? 0) + (unresolvedAlerts ?? 0)}
            sub={`${pendingRegistrations ?? 0} đăng ký · ${unresolvedAlerts ?? 0} cảnh báo`}
            color="amber"
            icon={TriangleAlert}
          />
          <MetricCard
            title="Doanh thu tháng"
            value={`${(monthRevenue / 1_000_000).toFixed(1)}M`}
            color="green"
            icon={Banknote}
          />
        </div>

        {/* Charts */}
        <div className="mb-6 grid gap-6 xl:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-gray-700">
                Doanh thu 6 tháng gần nhất
              </CardTitle>
              <p className="text-xs text-gray-400">Đơn vị: triệu đồng</p>
            </CardHeader>
            <CardContent>
              <RevenueChart data={revenueChartData} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-gray-700">
                Điểm danh tuần này
              </CardTitle>
              <p className="text-xs text-gray-400">Số lượt có mặt theo ngày</p>
            </CardHeader>
            <CardContent>
              <AttendanceChart data={attendanceChartData} />
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          {/* Ca hôm nay */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-gray-700">
                Ca hôm nay — {DAY_SHORT[todayDow]}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {todaySlots.length === 0 ? (
                <p className="text-sm text-gray-400">Không có ca hôm nay</p>
              ) : (
                todaySlots.map((slot: Slot) => (
                  <div key={slot.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3">
                    <div>
                      <div className="font-medium text-gray-800">{slot.name}</div>
                      <div className="text-sm text-gray-400">
                        {formatTime(slot.time_start)}–{formatTime(slot.time_end)}
                      </div>
                    </div>
                    <Badge variant="outline">Tối đa {slot.max_capacity}</Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Cảnh báo */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-gray-700">
                Cảnh báo cần xử lý
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
                      <div className="text-sm font-medium text-gray-800">{alert.students?.full_name}</div>
                      <Badge variant={ALERT_COLOR[alert.type]} className="mt-1 text-xs">
                        {ALERT_LABEL[alert.type]}
                      </Badge>
                    </div>
                    <Link href="/admin/canh-bao" className="text-xs text-[#0D2545] underline">
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
