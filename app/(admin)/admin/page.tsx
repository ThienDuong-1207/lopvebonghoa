export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import MetricCard from '@/components/admin/MetricCard'
import RevenueChart from '@/components/admin/RevenueChart'
import Topbar from '@/components/admin/Topbar'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { Users, UserCheck, TriangleAlert, Banknote, ArrowRight, Clock, CheckCircle2, XCircle } from 'lucide-react'
import type { Class, Alert } from '@/lib/types/database'
import { formatDays } from '@/lib/types/database'

const DAY_SHORT = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']
const DAY_FULL = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy']
const MONTH_NAMES = ['T1','T2','T3','T4','T5','T6','T7','T8','T9','T10','T11','T12']
const ALERT_LABEL: Record<string, string> = {
  near_end: 'Sắp hết gói',
  package_ended: 'Hết gói',
  inactive: 'Nghỉ >14 ngày',
}
const ALERT_DOT: Record<string, string> = {
  near_end: 'bg-amber-400',
  package_ended: 'bg-red-500',
  inactive: 'bg-gray-400',
}

function formatTime(t: string) { return t.slice(0, 5) }

export default async function AdminDashboard() {
  const supabase = createClient()

  const today = new Date()
  const todayDow = today.getDay()
  const todayStr = today.toISOString().split('T')[0]
  const monthStart = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`

  const sixMonthsAgo = new Date(today)
  sixMonthsAgo.setMonth(today.getMonth() - 5)
  sixMonthsAgo.setDate(1)

  const fourteenDaysAgo = new Date(today)
  fourteenDaysAgo.setDate(today.getDate() - 13)
  const fourteenDaysAgoStr = fourteenDaysAgo.toISOString().split('T')[0]

  const [
    { count: activeStudents },
    { count: todayCheckins },
    { count: pendingRegistrations },
    { count: unresolvedAlerts },
    { data: classes },
    { data: alerts },
    { data: monthPayments },
    { data: allPayments },
    { data: attendanceLog },
  ] = await Promise.all([
    supabase.from('students').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('sessions').select('*', { count: 'exact', head: true }).eq('session_date', todayStr),
    supabase.from('registrations').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('alerts').select('*', { count: 'exact', head: true }).eq('resolved', false),
    supabase.from('classes').select('*').eq('is_active', true).order('time_start').order('name'),
    supabase.from('alerts').select('*, students(full_name)').eq('resolved', false).order('triggered_at', { ascending: false }).limit(4),
    supabase.from('packages').select('amount_paid').gte('paid_at', monthStart),
    supabase.from('packages').select('amount_paid, paid_at').gte('paid_at', sixMonthsAgo.toISOString().split('T')[0]),
    supabase.from('sessions')
      .select('session_date, class_id, checked_in_by, profiles!checked_in_by(full_name)')
      .gte('session_date', fourteenDaysAgoStr)
      .lte('session_date', todayStr),
  ])

  const monthRevenue = (monthPayments ?? []).reduce((s: number, p: { amount_paid: number }) => s + p.amount_paid, 0)

  const revenueChartData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(today)
    d.setMonth(today.getMonth() - (5 - i))
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const rev = (allPayments ?? []).filter((p: { paid_at: string }) => p.paid_at.startsWith(key))
      .reduce((s: number, p: { amount_paid: number }) => s + p.amount_paid, 0)
    return { month: MONTH_NAMES[d.getMonth()], revenue: rev / 1_000_000 }
  })


  const todayClasses = (classes ?? []).filter((c: Class) => c.days_of_week.includes(todayDow))

  // Tính lịch sử điểm danh 14 ngày
  type LogRow = { session_date: string; class_id: string; profiles: { full_name: string }[] | null }
  const staffByDateClass = new Map<string, Set<string>>()
  for (const s of (attendanceLog ?? []) as unknown as LogRow[]) {
    const key = `${s.session_date}__${s.class_id}`
    if (!staffByDateClass.has(key)) staffByDateClass.set(key, new Set())
    const name = Array.isArray(s.profiles) ? s.profiles[0]?.full_name : (s.profiles as { full_name: string } | null)?.full_name
    if (name) staffByDateClass.get(key)!.add(name)
  }

  type HistoryRow = { date: string; dow: number; classId: string; className: string; attended: boolean; staffNames: string[] }
  const attendanceHistory: HistoryRow[] = []
  for (let i = 0; i < 14; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    const [y, mo, dy] = [d.getFullYear(), d.getMonth(), d.getDate()]
    const dateStr = `${y}-${String(mo + 1).padStart(2, '0')}-${String(dy).padStart(2, '0')}`
    const dow = new Date(y, mo, dy).getDay()
    for (const cls of (classes ?? []) as Class[]) {
      if (!cls.days_of_week.includes(dow)) continue
      const key = `${dateStr}__${cls.id}`
      attendanceHistory.push({
        date: dateStr, dow, classId: cls.id, className: cls.name,
        attended: staffByDateClass.has(key),
        staffNames: staffByDateClass.has(key) ? Array.from(staffByDateClass.get(key)!) : [],
      })
    }
  }

  return (
    <>
      <Topbar title="Dashboard" subtitle="Quản lý lớp học và điểm danh" />

      <div className="p-8">
        {/* Row 1 — Metric cards */}
        <div className="mb-5 grid grid-cols-2 gap-4 xl:grid-cols-4">
          <MetricCard
            hero
            title="Điểm danh hôm nay"
            value={todayCheckins ?? 0}
            icon={UserCheck}
          />
          <MetricCard
            title="Học sinh đang học"
            value={activeStudents ?? 0}
            color="blue"
            icon={Users}
          />
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

        {/* Row 2 — Kiểm soát điểm danh + Cảnh báo */}
        <div className="mb-5 grid gap-4 xl:grid-cols-5">
          {/* Kiểm soát điểm danh */}
          <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-gray-800 xl:col-span-3">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-800 dark:text-gray-100">Kiểm soát điểm danh</h3>
                <p className="mt-0.5 text-xs text-gray-400">14 ngày gần nhất — buổi học có lớp</p>
              </div>
              <Link href="/admin/diem-danh" className="text-xs font-medium text-[#C9A84C] hover:underline">
                Điểm danh bù →
              </Link>
            </div>

            {attendanceHistory.length === 0 ? (
              <div className="flex h-32 items-center justify-center rounded-xl bg-gray-50 dark:bg-gray-700/50">
                <p className="text-sm text-gray-400">Chưa có buổi học nào</p>
              </div>
            ) : (
              <div className="max-h-72 space-y-1.5 overflow-y-auto">
                {attendanceHistory.map((row) => {
                  const [, mo, dy] = row.date.split('-')
                  const dateLabel = `${dy}/${mo}`
                  return (
                    <div
                      key={`${row.date}-${row.classId}`}
                      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 ${
                        row.attended ? 'bg-emerald-50 dark:bg-emerald-900/10' : 'bg-red-50 dark:bg-red-900/10'
                      }`}
                    >
                      {row.attended ? (
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                      ) : (
                        <XCircle className="h-4 w-4 shrink-0 text-red-400" />
                      )}
                      <div className="w-24 shrink-0">
                        <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                          {DAY_SHORT[row.dow]} {dateLabel}
                        </span>
                        {row.date === todayStr && (
                          <span className="ml-1.5 rounded-full bg-[#0D2545] px-1.5 py-0.5 text-[9px] font-bold text-white">HÔM NAY</span>
                        )}
                      </div>
                      <span className="w-28 shrink-0 truncate text-xs text-gray-500 dark:text-gray-400">{row.className}</span>
                      <div className="flex-1">
                        {row.attended ? (
                          <span className="text-xs text-emerald-700 dark:text-emerald-400">{row.staffNames.join(', ')}</span>
                        ) : (
                          <span className="text-xs font-medium text-red-500">Chưa điểm danh</span>
                        )}
                      </div>
                      {!row.attended && (
                        <Link
                          href={`/admin/diem-danh?date=${row.date}&class_id=${row.classId}`}
                          className="shrink-0 rounded-lg bg-red-100 px-2.5 py-1 text-[11px] font-semibold text-red-600 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400"
                        >
                          Điểm bù
                        </Link>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Cảnh báo */}
          <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-gray-800 xl:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold text-gray-800 dark:text-gray-100">Cảnh báo</h3>
              {(unresolvedAlerts ?? 0) > 0 && (
                <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-500">
                  {unresolvedAlerts}
                </span>
              )}
            </div>
            <div className="space-y-3">
              {(alerts ?? []).length === 0 ? (
                <p className="text-sm text-gray-400">Không có cảnh báo</p>
              ) : (
                (alerts ?? []).map((alert: Alert & { students: { full_name: string } }) => (
                  <div key={alert.id} className="flex items-center gap-3">
                    <span className={`h-2 w-2 shrink-0 rounded-full ${ALERT_DOT[alert.type]}`} />
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-medium text-gray-700 dark:text-gray-200">{alert.students?.full_name}</p>
                      <p className="text-xs text-gray-400">{ALERT_LABEL[alert.type]}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
            <Link
              href="/admin/canh-bao"
              className="mt-4 flex items-center gap-1 text-xs font-medium text-[#C9A84C] hover:underline"
            >
              Xem tất cả <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>

        {/* Row 3 — Revenue chart + Today slots */}
        <div className="grid gap-4 xl:grid-cols-5">
          {/* Dark revenue card */}
          <div className="relative overflow-hidden rounded-2xl bg-[#0D2545] p-6 text-white xl:col-span-2">
            <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/5" />
            <div className="pointer-events-none absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-[#C9A84C]/10" />

            <p className="mb-1 text-sm text-white/50">Doanh thu tháng này</p>
            <p className="text-4xl font-bold text-[#C9A84C]">
              {(monthRevenue / 1_000_000).toFixed(1)}
              <span className="ml-1 text-lg font-normal text-white/40">M đ</span>
            </p>

            <div className="mt-5 mb-1 flex justify-between text-xs text-white/40">
              <span>Tiến độ</span>
              <span>Mục tiêu 10M</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-[#C9A84C] transition-all"
                style={{ width: `${Math.min((monthRevenue / 10_000_000) * 100, 100).toFixed(0)}%` }}
              />
            </div>

            <div className="mt-5 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/50">Học sinh active</span>
                <span className="text-sm font-semibold text-white">{activeStudents ?? 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/50">Lớp đang hoạt động</span>
                <span className="text-sm font-semibold text-white">{(classes ?? []).length}</span>
              </div>
            </div>

            <div className="mt-6 border-t border-white/10 pt-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-white/30">
                Doanh thu 6 tháng
              </p>
              <RevenueChart data={revenueChartData} />
            </div>
          </div>

          {/* Today's slots */}
          <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-gray-800 xl:col-span-3">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold text-gray-800 dark:text-gray-100">
                Ca hôm nay
                <span className="ml-2 text-sm font-normal text-gray-400">— {DAY_FULL[todayDow]}</span>
              </h3>
              <Link href="/admin/lich-hoc" className="text-xs text-[#C9A84C] hover:underline">
                Quản lý →
              </Link>
            </div>

            {todayClasses.length === 0 ? (
              <div className="flex h-32 items-center justify-center rounded-xl bg-gray-50 dark:bg-gray-700/50">
                <p className="text-sm text-gray-400">Không có lớp hôm nay</p>
              </div>
            ) : (
              <div className="space-y-3">
                {todayClasses.map((cls: Class) => (
                  <div
                    key={cls.id}
                    className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50/50 px-4 py-3.5 dark:border-gray-700 dark:bg-gray-700/30"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#C9A84C]/10">
                        <Clock className="h-4 w-4 text-[#C9A84C]" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800 dark:text-gray-100">{cls.name}</p>
                        <p className="text-xs text-gray-400">
                          {formatTime(cls.time_start)} – {formatTime(cls.time_end)} · {formatDays(cls.days_of_week)}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      Tối đa {cls.max_capacity}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </>
  )
}
