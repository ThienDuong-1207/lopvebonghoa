export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import Topbar from '@/components/admin/Topbar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import ImportExportButtons from '@/components/admin/ImportExportButtons'
import type { Student, Parent, Class } from '@/lib/types/database'
import { formatDays } from '@/lib/types/database'

const STATUS_LABEL: Record<string, string> = {
  active: 'Đang học', paused: 'Tạm nghỉ', inactive: 'Nghỉ học',
}
const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'outline'> = {
  active: 'default', paused: 'secondary', inactive: 'outline',
}

interface Props {
  searchParams: { q?: string; status?: string; class_id?: string }
}

export default async function HocSinhPage({ searchParams }: Props) {
  const supabase = createClient()
  const { q, status, class_id } = searchParams

  let query = supabase
    .from('students')
    .select('*, parents(full_name, phone), classes(name, days_of_week)')
    .order('full_name')

  if (status) query = query.eq('status', status)
  if (class_id) query = query.eq('class_id', class_id)
  if (q) query = query.ilike('full_name', `%${q}%`)

  const [{ data: students }, { data: classes }, { data: pendingPkgs }] = await Promise.all([
    query,
    supabase.from('classes').select('id, name, days_of_week').eq('is_active', true).order('name'),
    supabase.from('packages').select('student_id').eq('payment_status', 'pending').eq('status', 'active'),
  ])

  const unpaidIds = new Set((pendingPkgs ?? []).map((p: { student_id: string }) => p.student_id))

  return (
    <>
      <Topbar title="Học sinh" />
      <div className="p-6">
        {/* Filter bar */}
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <form className="flex flex-1 gap-2">
            <input
              name="q"
              defaultValue={q}
              placeholder="Tìm tên học sinh..."
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D2545] dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
            />
            <select
              name="status"
              defaultValue={status ?? ''}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="active">Đang học</option>
              <option value="paused">Tạm nghỉ</option>
              <option value="inactive">Nghỉ học</option>
            </select>
            <select
              name="class_id"
              defaultValue={class_id ?? ''}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
            >
              <option value="">Tất cả lớp</option>
              {(classes ?? []).map((c: Pick<Class, 'id' | 'name' | 'days_of_week'>) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <Button type="submit" variant="outline" className="text-sm">Lọc</Button>
          </form>
          <ImportExportButtons />
          <Link href="/admin/hoc-sinh/moi">
            <Button className="bg-[#0D2545] text-white hover:bg-[#0D2545]/90">+ Thêm học sinh</Button>
          </Link>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Học sinh</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Phụ huynh</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Số điện thoại</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Lớp học</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Trạng thái</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {(students ?? []).map((s: Student & { parents: Pick<Parent, 'full_name' | 'phone'>; classes: Pick<Class, 'name' | 'days_of_week'> | null }) => (
                <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/40">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium text-gray-800 dark:text-gray-100">{s.full_name}</span>
                      {unpaidIds.has(s.id) && (
                        <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-900/40 dark:text-amber-400">
                          Nợ
                        </span>
                      )}
                    </div>
                    {s.nickname && <div className="text-xs text-gray-400">"{s.nickname}"</div>}
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{s.parents?.full_name}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{s.parents?.phone}</td>
                  <td className="px-4 py-3">
                    {s.classes ? (
                      <div>
                        <div className="text-sm text-gray-700 dark:text-gray-200">{s.classes.name}</div>
                        <div className="text-xs text-gray-400">{formatDays(s.classes.days_of_week)}</div>
                      </div>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={STATUS_VARIANT[s.status]}>{STATUS_LABEL[s.status]}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/hoc-sinh/${s.id}`}>
                      <Button variant="ghost" className="text-xs">Chi tiết →</Button>
                    </Link>
                  </td>
                </tr>
              ))}
              {(students ?? []).length === 0 && (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-gray-400">Không có học sinh nào</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-gray-400">Tổng: {(students ?? []).length} học sinh</p>
      </div>
    </>
  )
}
