export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/supabase/queries'
import Link from 'next/link'
import { CalendarDays } from 'lucide-react'
import type { Class, Student } from '@/lib/types/database'
import { DAY_SHORT, DAY_FULL, formatDays } from '@/lib/types/database'

function formatTime(t: string) { return t.slice(0, 5) }

export default async function LichCaPage() {
  const supabase = createClient()
  const profile = await getProfile()

  const { data: classes } = await supabase
    .from('classes')
    .select('*')
    .eq('assigned_staff_id', profile?.id ?? '')
    .eq('is_active', true)
    .order('time_start')
    .order('name')

  const classIds = (classes ?? []).map((c: Class) => c.id)
  const { data: students } = classIds.length
    ? await supabase
        .from('students')
        .select('class_id')
        .in('class_id', classIds)
        .eq('status', 'active')
    : { data: [] }

  const countByClass = (classes ?? []).reduce<Record<string, number>>((acc, cls: Class) => {
    acc[cls.id] = (students ?? []).filter(
      (s: Pick<Student, 'class_id'>) => s.class_id === cls.id
    ).length
    return acc
  }, {})

  const today = new Date().getDay()

  // Which days have at least one class
  const daysWithClass = new Set((classes ?? []).flatMap((c: Class) => c.days_of_week))

  return (
    <div className="p-4">
      {/* Mini week calendar */}
      <div className="mb-5 grid grid-cols-7 gap-1.5">
        {[1, 2, 3, 4, 5, 6, 0].map((dow) => {
          const hasClass = daysWithClass.has(dow)
          const isToday = dow === today
          return (
            <div
              key={dow}
              className={`rounded-xl py-2.5 text-center text-xs font-medium shadow-sm transition-colors ${
                isToday
                  ? 'bg-[#0D2545] text-white'
                  : hasClass
                  ? 'bg-[#C9A84C]/15 text-[#C9A84C]'
                  : 'bg-white text-gray-300'
              }`}
            >
              <div>{DAY_SHORT[dow]}</div>
              {hasClass && <div className="mx-auto mt-1 h-1 w-1 rounded-full bg-[#C9A84C]" />}
            </div>
          )
        })}
      </div>

      {/* Danh sách lớp */}
      {(classes ?? []).length === 0 ? (
        <div className="flex h-[50vh] items-center justify-center text-center text-gray-400">
          <div>
            <CalendarDays className="mx-auto h-10 w-10 text-gray-200" />
            <p className="mt-3 text-sm">Chưa được phân công lớp nào</p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {(classes ?? []).map((cls: Class) => {
            const hasToday = cls.days_of_week.includes(today)
            return (
              <div
                key={cls.id}
                className={`flex items-center justify-between rounded-xl bg-white p-4 ${
                  hasToday ? 'border-l-4 border-[#C9A84C] shadow-sm' : 'shadow-sm'
                }`}
              >
                <div>
                  <div className="font-semibold text-[#0D2545]">{cls.name}</div>
                  <div className="mt-0.5 text-sm text-gray-400">
                    {formatTime(cls.time_start)} – {formatTime(cls.time_end)}
                  </div>
                  {/* Day badges */}
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {[...cls.days_of_week].sort((a, b) => a - b).map((d) => (
                      <span
                        key={d}
                        className={`rounded-md px-1.5 py-0.5 text-[11px] font-medium ${
                          d === today
                            ? 'bg-[#0D2545] text-white'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {DAY_SHORT[d]}
                        {d === today && ' ●'}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <div className="text-lg font-bold text-[#0D2545]">
                    {countByClass[cls.id] ?? 0}
                    <span className="text-sm font-normal text-gray-400">/{cls.max_capacity}</span>
                  </div>
                  <div className="text-xs text-gray-400">học sinh</div>
                  {hasToday && (
                    <Link
                      href="/staff/diem-danh"
                      className="rounded-full bg-[#C9A84C] px-3 py-1 text-[11px] font-semibold text-white hover:bg-[#C9A84C]/90"
                    >
                      Điểm danh →
                    </Link>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
