export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import Topbar from '@/components/admin/Topbar'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import type { Registration } from '@/lib/types/database'

const STATUS_LABEL: Record<string, string> = {
  pending: 'Chờ xử lý',
  contacted: 'Đã liên hệ',
  converted: 'Đã vào học',
  rejected: 'Từ chối',
}
const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  pending: 'destructive',
  contacted: 'default',
  converted: 'secondary',
  rejected: 'outline',
}
const TABS = [
  { key: '', label: 'Tất cả' },
  { key: 'pending', label: 'Chờ xử lý' },
  { key: 'contacted', label: 'Đã liên hệ' },
  { key: 'converted', label: 'Đã vào học' },
  { key: 'rejected', label: 'Từ chối' },
]

async function updateStatus(id: string, status: string) {
  'use server'
  const supabase = createClient()
  await supabase.from('registrations').update({ status }).eq('id', id)
  redirect('/admin/dang-ky-moi')
}

async function convertToStudent(registrationId: string) {
  'use server'
  const supabase = createClient()

  const { data: reg } = await supabase
    .from('registrations')
    .select('*')
    .eq('id', registrationId)
    .single()

  if (!reg) redirect('/admin/dang-ky-moi')

  // Nếu đã convert, redirect thẳng sang trang học sinh
  if (reg.converted_student_id) {
    redirect(`/admin/hoc-sinh/${reg.converted_student_id}`)
  }

  // Tìm phụ huynh theo SĐT hoặc tạo mới
  let parentId: string
  const { data: existingParent } = await supabase
    .from('parents')
    .select('id')
    .eq('phone', reg.phone)
    .maybeSingle()

  if (existingParent) {
    parentId = existingParent.id
  } else {
    const { data: newParent, error: parentErr } = await supabase
      .from('parents')
      .insert({ full_name: reg.parent_name, phone: reg.phone })
      .select('id')
      .single()
    if (parentErr || !newParent) redirect('/admin/dang-ky-moi?error=parent')
    parentId = newParent!.id
  }

  // Tạo học sinh
  const notes = reg.preferred_slot ? `Ca mong muốn: ${reg.preferred_slot}` : null
  const { data: student, error: studentErr } = await supabase
    .from('students')
    .insert({
      full_name: reg.child_name,
      age: reg.child_age ?? null,
      parent_id: parentId,
      notes,
      status: 'active',
    })
    .select('id')
    .single()

  if (studentErr || !student) redirect('/admin/dang-ky-moi?error=student')

  // Cập nhật đăng ký
  await supabase
    .from('registrations')
    .update({ status: 'converted', converted_student_id: student!.id })
    .eq('id', registrationId)

  redirect(`/admin/hoc-sinh/${student!.id}`)
}

interface Props { searchParams: { filter?: string } }

export default async function DangKyMoiPage({ searchParams }: Props) {
  const supabase = createClient()
  const filter = searchParams.filter ?? ''

  let query = supabase.from('registrations').select('*').order('submitted_at', { ascending: false })
  if (filter) query = query.eq('status', filter)

  const [{ data: registrations }, { data: allForCount }] = await Promise.all([
    query,
    supabase.from('registrations').select('status'),
  ])

  const countByStatus = (status: string) =>
    (allForCount ?? []).filter((r: { status: string }) => r.status === status).length
  const pendingCount = countByStatus('pending')

  return (
    <>
      <Topbar title="Đăng ký mới" />
      <div className="p-6">
        {/* Header + count */}
        <div className="mb-4 flex items-center gap-3">
          <h2 className="font-semibold dark:text-gray-100">Danh sách đơn đăng ký</h2>
          {pendingCount > 0 && (
            <Badge variant="destructive">{pendingCount} chờ xử lý</Badge>
          )}
        </div>

        {/* Filter tabs */}
        <div className="mb-5 flex gap-1 overflow-x-auto rounded-xl border border-gray-200 bg-gray-50 p-1 dark:border-gray-700 dark:bg-gray-800/50">
          {TABS.map((tab) => {
            const isActive = filter === tab.key
            const href = tab.key ? `/admin/dang-ky-moi?filter=${tab.key}` : '/admin/dang-ky-moi'
            const count = tab.key ? countByStatus(tab.key) : (allForCount ?? []).length
            return (
              <Link
                key={tab.key}
                href={href}
                className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-white text-[#0D2545] shadow-sm dark:bg-gray-700 dark:text-white'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
              >
                {tab.label}
                <span className={`text-xs ${isActive ? 'text-[#C9A84C]' : 'text-gray-400'}`}>
                  {count}
                </span>
              </Link>
            )
          })}
        </div>

        {/* Cards */}
        <div className="space-y-4">
          {(registrations ?? []).map((r: Registration) => (
            <Card key={r.id} className="dark:border-gray-700 dark:bg-gray-800">
              <CardContent className="py-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold dark:text-gray-100">{r.child_name}</span>
                      {r.child_age && <span className="text-sm text-gray-400">{r.child_age} tuổi</span>}
                      <Badge variant={STATUS_VARIANT[r.status]}>{STATUS_LABEL[r.status]}</Badge>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      PH: {r.parent_name} —{' '}
                      <a href={`tel:${r.phone}`} className="text-[#C9A84C] hover:underline">{r.phone}</a>
                    </div>
                    {r.preferred_slot && (
                      <div className="text-sm text-gray-500 dark:text-gray-400">Ca mong muốn: {r.preferred_slot}</div>
                    )}
                    {r.message && (
                      <div className="mt-2 rounded-lg bg-gray-50 p-2 text-sm text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                        {r.message}
                      </div>
                    )}
                    <div className="text-xs text-gray-400">
                      Gửi lúc: {new Date(r.submitted_at).toLocaleString('vi-VN')}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    {r.status === 'pending' && (
                      <>
                        <form action={updateStatus.bind(null, r.id, 'contacted')}>
                          <button className="w-full rounded-lg bg-[#0D2545] px-3 py-1.5 text-xs text-white hover:bg-[#0D2545]/90 dark:bg-[#0D2545]">
                            Đã liên hệ
                          </button>
                        </form>
                        <form action={updateStatus.bind(null, r.id, 'rejected')}>
                          <button className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700">
                            Từ chối
                          </button>
                        </form>
                      </>
                    )}
                    {r.status === 'contacted' && (
                      <form action={convertToStudent.bind(null, r.id)}>
                        <button className="w-full rounded-lg bg-emerald-600 px-3 py-1.5 text-xs text-white hover:bg-emerald-700">
                          Đã vào học →
                        </button>
                      </form>
                    )}
                    {r.status === 'converted' && r.converted_student_id && (
                      <Link
                        href={`/admin/hoc-sinh/${r.converted_student_id}`}
                        className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs text-emerald-700 hover:bg-emerald-100 dark:border-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400"
                      >
                        Xem hồ sơ →
                      </Link>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {(registrations ?? []).length === 0 && (
            <div className="rounded-xl border border-dashed py-16 text-center text-gray-400 dark:border-gray-700">
              {filter ? `Không có đơn nào ở trạng thái này` : 'Chưa có đơn đăng ký nào'}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
