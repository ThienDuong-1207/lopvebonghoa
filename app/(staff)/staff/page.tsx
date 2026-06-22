export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/supabase/queries'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { CalendarCheck, CheckCircle, CalendarDays, ArrowRight, Clock } from 'lucide-react'
import type { Class } from '@/lib/types/database'
import { DAY_SHORT, DAY_FULL, formatDays } from '@/lib/types/database'

function formatTime(t: string) { return t.slice(0, 5) }

export default async function StaffHomePage() {
  const supabase = createClient()
  const profile = await getProfile()

  const { data: classes } = await supabase
    .from('classes')
    .select('*')
    .eq('assigned_staff_id', profile?.id ?? '')
    .eq('is_active', true)
    .order('time_start')

  const today = new Date()
  const todayDow = today.getDay()
  const todayStr = today.toISOString().split('T')[0]
  const todayClasses = (classes ?? []).filter((c: Class) => c.days_of_week.includes(todayDow))

  const { count: checkedInCount } = await supabase
    .from('sessions')
    .select('*', { count: 'exact', head: true })
    .in('class_id', todayClasses.map((c: Class) => c.id))
    .eq('session_date', todayStr)

  return (
    <div className="p-4">
      {/* Row 1: Hero + 2 stats */}
      <div className="mb-4 grid grid-cols-3 gap-3">
        {/* Hero card */}
        <div className="relative col-span-1 overflow-hidden rounded-2xl bg-gradient-to-br from-[#C9A84C] to-[#7A5520] p-4 text-white shadow-lg shadow-[#C9A84C]/20">
          <div className="pointer-events-none absolute -right-4 -top-4 h-20 w-20 rounded-full bg-white/10" />
          <CalendarCheck className="mb-3 h-5 w-5 text-white/70" />
          <div className="text-3xl font-bold">{todayClasses.length}</div>
          <div className="mt-0.5 text-xs text-white/70">Lớp hôm nay</div>
        </div>

        {/* Stats */}
        <div className="flex flex-col gap-3">
          <div className="flex-1 rounded-2xl bg-white p-3 shadow-sm dark:bg-gray-800">
            <CheckCircle className="mb-1.5 h-4 w-4 text-emerald-500" />
            <div className="text-xl font-bold text-gray-800 dark:text-gray-100">{checkedInCount ?? 0}</div>
            <div className="text-[10px] text-gray-400">Đã điểm danh</div>
          </div>
          <div className="flex-1 rounded-2xl bg-white p-3 shadow-sm dark:bg-gray-800">
            <CalendarDays className="mb-1.5 h-4 w-4 text-[#C9A84C]" />
            <div className="text-xl font-bold text-gray-800 dark:text-gray-100">{(classes ?? []).length}</div>
            <div className="text-[10px] text-gray-400">Lớp phụ trách</div>
          </div>
        </div>

        {/* Week mini calendar — highlight days with classes */}
        <div className="rounded-2xl bg-white p-3 shadow-sm dark:bg-gray-800">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-gray-400">Tuần này</p>
          <div className="grid grid-cols-4 gap-1">
            {[1,2,3,4,5,6,0].map((dow) => {
              const hasClass = (classes ?? []).some((c: Class) => c.days_of_week.includes(dow))
              const isToday = dow === todayDow
              return (
                <div
                  key={dow}
                  className={`rounded-lg py-1.5 text-center text-[10px] font-medium ${
                    isToday ? 'bg-[#C9A84C] text-white' : hasClass ? 'bg-[#C9A84C]/10 text-[#C9A84C]' : 'bg-gray-50 text-gray-300 dark:bg-gray-700 dark:text-gray-600'
                  }`}
                >
                  {DAY_SHORT[dow]}
                  {hasClass && <div className={`mx-auto mt-0.5 h-0.5 w-2 rounded-full ${isToday ? 'bg-white/50' : 'bg-[#C9A84C]'}`} />}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Lớp hôm nay */}
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">
          Lớp hôm nay — <span className="font-normal text-gray-400">{DAY_FULL[todayDow]}</span>
        </h3>
        <Link href="/staff/diem-danh" className="flex items-center gap-1 text-xs text-[#C9A84C]">
          Điểm danh <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {todayClasses.length === 0 ? (
        <div className="flex h-24 items-center justify-center rounded-2xl bg-white shadow-sm dark:bg-gray-800">
          <p className="text-sm text-gray-400">Không có lớp hôm nay</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {todayClasses.map((cls: Class) => (
            <div
              key={cls.id}
              className="flex items-center justify-between rounded-2xl bg-white px-4 py-4 shadow-sm dark:bg-gray-800"
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
              <Link href="/staff/diem-danh">
                <Button size="sm" className="bg-[#C9A84C] text-white hover:bg-[#C9A84C]/90">
                  Điểm danh
                </Button>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
