export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import Topbar from '@/components/admin/Topbar'
import { redirect } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Pencil, UserRound, Users } from 'lucide-react'
import Link from 'next/link'
import DeleteClassButton from '@/components/admin/DeleteClassButton'
import ClassCreateForm from '@/components/admin/ClassCreateForm'
import type { Class } from '@/lib/types/database'
import { DAY_SHORT } from '@/lib/types/database'

async function createClass(_prev: string | null, formData: FormData): Promise<string | null> {
  'use server'
  const supabase = createClient()

  const name = (formData.get('name') as string)?.trim()
  if (!name) return 'Vui lòng nhập tên lớp.'

  const days = formData.getAll('days_of_week').map(Number)
  if (days.length === 0) return 'Vui lòng chọn ít nhất một ngày học.'

  const { error } = await supabase.from('classes').insert({
    name,
    days_of_week:      days,
    time_start:        formData.get('time_start') as string,
    time_end:          formData.get('time_end') as string,
    max_capacity:      Number(formData.get('max_capacity')),
    assigned_staff_id: (formData.get('assigned_staff_id') as string) || null,
    is_active:         true,
  })

  if (error) return `Không thể tạo lớp: ${error.message}`
  redirect('/admin/lich-hoc')
}

async function toggleClass(id: string, isActive: boolean) {
  'use server'
  const supabase = createClient()
  await supabase.from('classes').update({ is_active: !isActive }).eq('id', id)
  redirect('/admin/lich-hoc')
}

async function deleteClass(id: string) {
  'use server'
  const supabase = createClient()
  await supabase.from('classes').delete().eq('id', id)
  redirect('/admin/lich-hoc')
}

export default async function LichHocPage() {
  const supabase = createClient()

  const [{ data: classes }, { data: staffList }, { data: studentRows }] = await Promise.all([
    supabase.from('classes').select('*, profiles(full_name)').order('time_start').order('name'),
    supabase.from('profiles').select('id, full_name').eq('role', 'staff').eq('is_active', true),
    supabase.from('students').select('class_id').eq('status', 'active').not('class_id', 'is', null),
  ])

  const countByClass = (studentRows ?? []).reduce<Record<string, number>>((acc, s) => {
    if (s.class_id) acc[s.class_id] = (acc[s.class_id] ?? 0) + 1
    return acc
  }, {})

  // Weekly schedule grid: which days have classes
  const daysWithClass = new Set((classes ?? []).flatMap((c: Class) => c.days_of_week))

  return (
    <>
      <Topbar title="Lịch & Lớp học" />
      <div className="p-6">
        {/* Mini weekly grid */}
        <div className="mb-6 grid grid-cols-7 gap-1.5">
          {[1, 2, 3, 4, 5, 6, 0].map((dow) => {
            const hasClass = daysWithClass.has(dow)
            return (
              <div
                key={dow}
                className={`rounded-xl py-2 text-center text-xs font-medium transition-colors ${
                  hasClass
                    ? 'bg-[#0D2545] text-white'
                    : 'bg-gray-100 text-gray-300 dark:bg-gray-800 dark:text-gray-600'
                }`}
              >
                {DAY_SHORT[dow]}
                {hasClass && <div className="mx-auto mt-1 h-1 w-1 rounded-full bg-[#C9A84C]" />}
              </div>
            )
          })}
        </div>

        <div className="grid gap-6 xl:grid-cols-3">
          {/* Danh sách lớp */}
          <div className="xl:col-span-2 space-y-3">
            {(classes ?? []).length === 0 && (
              <div className="rounded-xl border border-dashed border-gray-200 py-16 text-center text-sm text-gray-400 dark:border-gray-700">
                Chưa có lớp học nào — tạo lớp đầu tiên →
              </div>
            )}
            {(classes ?? []).map((cls: Class & { profiles: { full_name: string } | null }) => {
              const enrolled = countByClass[cls.id] ?? 0
              const isFull = enrolled >= cls.max_capacity
              return (
                <div
                  key={cls.id}
                  className="flex items-center justify-between rounded-xl border border-gray-100 bg-white px-5 py-4 dark:border-gray-700 dark:bg-gray-800"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-800 dark:text-gray-100">{cls.name}</span>
                      {!cls.is_active && <Badge variant="outline" className="text-xs">Tắt</Badge>}
                      {isFull && <Badge variant="secondary" className="text-xs">Đầy</Badge>}
                    </div>

                    {/* Day badges */}
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {[...cls.days_of_week].sort((a, b) => a - b).map((d) => (
                        <span
                          key={d}
                          className="rounded-md bg-[#0D2545]/8 px-1.5 py-0.5 text-[11px] font-medium text-[#0D2545] dark:bg-[#C9A84C]/15 dark:text-[#C9A84C]"
                        >
                          {DAY_SHORT[d]}
                        </span>
                      ))}
                      <span className="text-xs text-gray-400">
                        · {cls.time_start.slice(0, 5)}–{cls.time_end.slice(0, 5)}
                      </span>
                    </div>

                    <div className="mt-1.5 flex items-center gap-3 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        <span className={isFull ? 'font-semibold text-amber-500' : ''}>
                          {enrolled}/{cls.max_capacity}
                        </span>
                        <span>học sinh</span>
                      </span>
                      {cls.profiles && (
                        <span className="flex items-center gap-1">
                          <UserRound className="h-3 w-3" />
                          {cls.profiles.full_name}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <form action={toggleClass.bind(null, cls.id, cls.is_active)}>
                      <button className="rounded-lg px-2.5 py-1.5 text-xs text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-700 dark:hover:text-gray-200">
                        {cls.is_active ? 'Tắt' : 'Bật'}
                      </button>
                    </form>
                    <Link
                      href={`/admin/lich-hoc/${cls.id}`}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-[#C9A84C]/10 hover:text-[#C9A84C]"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Link>
                    <DeleteClassButton action={deleteClass.bind(null, cls.id)} name={cls.name} />
                  </div>
                </div>
              )
            })}
          </div>

          {/* Form tạo lớp mới */}
          <div>
            <h3 className="mb-4 font-semibold dark:text-gray-100">Tạo lớp học mới</h3>
            <ClassCreateForm action={createClass} staffList={staffList ?? []} />
          </div>
        </div>
      </div>
    </>
  )
}
