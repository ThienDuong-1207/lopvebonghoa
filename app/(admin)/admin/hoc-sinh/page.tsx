export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import Topbar from '@/components/admin/Topbar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import type { Student, Slot } from '@/lib/types/database'

const STATUS_LABEL: Record<string, string> = {
  active: 'Đang học',
  paused: 'Tạm nghỉ',
  inactive: 'Nghỉ học',
}
const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'outline'> = {
  active: 'default',
  paused: 'secondary',
  inactive: 'outline',
}

interface Props {
  searchParams: { q?: string; status?: string; slot?: string }
}

export default async function HocSinhPage({ searchParams }: Props) {
  const supabase = createClient()
  const { q, status, slot } = searchParams

  let query = supabase
    .from('students')
    .select('*, slots(name)')
    .order('full_name')

  if (status) query = query.eq('status', status)
  if (slot) query = query.eq('preferred_slot_id', slot)
  if (q) query = query.ilike('full_name', `%${q}%`)

  const { data: students } = await query
  const { data: slots } = await supabase.from('slots').select('id, name').eq('is_active', true)

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
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D2545]"
            />
            <select
              name="status"
              defaultValue={status ?? ''}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="active">Đang học</option>
              <option value="paused">Tạm nghỉ</option>
              <option value="inactive">Nghỉ học</option>
            </select>
            <select
              name="slot"
              defaultValue={slot ?? ''}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
            >
              <option value="">Tất cả ca</option>
              {(slots ?? []).map((s: Pick<Slot, 'id' | 'name'>) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <Button type="submit" variant="outline" className="text-sm">
              Lọc
            </Button>
          </form>
          <Link href="/admin/hoc-sinh/moi">
            <Button className="bg-[#0D2545] text-white hover:bg-[#0D2545]/90">+ Thêm học sinh</Button>
          </Link>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Học sinh</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Phụ huynh</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Số điện thoại</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Ca học</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Trạng thái</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(students ?? []).map((s: Student & { slots: { name: string } | null }) => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-800">{s.full_name}</div>
                    {s.nickname && <div className="text-xs text-gray-400">"{s.nickname}"</div>}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{s.parent_name}</td>
                  <td className="px-4 py-3 text-gray-600">{s.parent_phone}</td>
                  <td className="px-4 py-3 text-gray-600">{s.slots?.name ?? '—'}</td>
                  <td className="px-4 py-3">
                    <Badge variant={STATUS_VARIANT[s.status]}>{STATUS_LABEL[s.status]}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/hoc-sinh/${s.id}`}>
                      <Button variant="ghost" className="text-xs">
                        Chi tiết →
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))}
              {(students ?? []).length === 0 && (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-gray-400">
                    Không có học sinh nào
                  </td>
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
