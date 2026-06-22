export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import Topbar from '@/components/admin/Topbar'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { AlertCircle } from 'lucide-react'
import type { Student, Package } from '@/lib/types/database'
import MarkPaidButton from './MarkPaidButton'
import DeletePackageButton from './DeletePackageButton'

const STATUS_LABEL: Record<string, string> = { active: 'Đang học', completed: 'Hết gói', cancelled: 'Huỷ' }
const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'outline'> = {
  active: 'default', completed: 'secondary', cancelled: 'outline',
}

async function getAdminProfileId() {
  'use server'
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data } = await supabase.from('profiles').select('id').eq('auth_user_id', user!.id).single()
  return data?.id ?? null
}

async function createPackage(formData: FormData) {
  'use server'
  const supabase = createClient()
  const studentId = formData.get('student_id') as string
  if (!studentId) redirect('/admin/thanh-toan?error=missing_student')

  const { data: { user } } = await supabase.auth.getUser()
  const { data: adminProfile } = await supabase
    .from('profiles').select('id').eq('auth_user_id', user!.id).single()

  const { data: existing } = await supabase
    .from('packages').select('id').eq('student_id', studentId).eq('status', 'active').single()
  if (existing) redirect('/admin/thanh-toan?error=duplicate')

  const isPending = formData.get('payment_status') === 'pending'
  const amountRaw = formData.get('amount_paid') as string
  const paidAtRaw = formData.get('paid_at') as string

  const { error } = await supabase.from('packages').insert({
    student_id:      studentId,
    amount_paid:     isPending ? 0 : Number(amountRaw),
    paid_at:         isPending ? null : (paidAtRaw || null),
    note:            (formData.get('note') as string) || null,
    total_sessions:  Number(formData.get('total_sessions') || 8),
    used_sessions:   0,
    marked_paid_by:  isPending ? null : (adminProfile?.id ?? null),
    status:          'active',
    payment_status:  isPending ? 'pending' : 'paid',
  })
  if (error) redirect(`/admin/thanh-toan?error=db&msg=${encodeURIComponent(error.message)}`)
  redirect('/admin/thanh-toan?success=1')
}

interface Props { searchParams: { error?: string; success?: string; msg?: string; student_id?: string } }

export default async function ThanhToanPage({ searchParams }: Props) {
  const supabase = createClient()

  const [{ data: students }, { data: recentPackages }] = await Promise.all([
    supabase.from('students').select('id, full_name').eq('status', 'active').order('full_name'),
    supabase.from('packages')
      .select('*, students(id, full_name), sessions(id)')
      .order('created_at', { ascending: false })
      .limit(50),
  ])

  const errorMsg: Record<string, string> = {
    duplicate:       'Học sinh này đang có gói học đang hoạt động. Hãy đợi hết gói mới kích hoạt tiếp.',
    missing_student: 'Vui lòng chọn học sinh.',
    db:              `Lỗi khi lưu${searchParams.msg ? `: ${searchParams.msg}` : ', vui lòng thử lại.'}`,
  }

  const pendingCount = (recentPackages ?? []).filter(
    (p: Package) => p.payment_status === 'pending' && p.status === 'active'
  ).length

  return (
    <>
      <Topbar title="Thanh toán" />
      <div className="p-6">
        <div className="grid gap-6 xl:grid-cols-2">
          {/* Form ghi nhận */}
          <div>
            <h3 className="mb-4 font-semibold dark:text-gray-100">Ghi nhận thanh toán mới</h3>

            {searchParams.error && (
              <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {errorMsg[searchParams.error] ?? 'Đã xảy ra lỗi.'}
              </div>
            )}
            {searchParams.success && (
              <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-600 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400">
                ✓ Đã kích hoạt gói học thành công!
              </div>
            )}

            <form action={createPackage} className="space-y-4 rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Học sinh *</label>
                <select
                  name="student_id"
                  required
                  defaultValue={searchParams.student_id ?? ''}
                  className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-700 dark:text-gray-200"
                >
                  <option value="">Chọn học sinh...</option>
                  {(students ?? []).map((s: Pick<Student, 'id' | 'full_name'>) => (
                    <option key={s.id} value={s.id}>{s.full_name}</option>
                  ))}
                </select>
              </div>

              {/* Trạng thái thanh toán */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Trạng thái thanh toán</label>
                <div className="grid grid-cols-2 gap-2">
                  <label className="relative flex cursor-pointer select-none">
                    <input type="radio" name="payment_status" value="paid" defaultChecked className="peer sr-only" />
                    <span className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-gray-200 py-2 text-sm font-medium text-gray-500 transition-colors peer-checked:border-emerald-500 peer-checked:bg-emerald-50 peer-checked:text-emerald-700 dark:border-gray-600 dark:text-gray-400">
                      ✓ Đã thu tiền
                    </span>
                  </label>
                  <label className="relative flex cursor-pointer select-none">
                    <input type="radio" name="payment_status" value="pending" className="peer sr-only" />
                    <span className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-gray-200 py-2 text-sm font-medium text-gray-500 transition-colors peer-checked:border-amber-500 peer-checked:bg-amber-50 peer-checked:text-amber-700 dark:border-gray-600 dark:text-gray-400">
                      ⏳ Ghi nợ
                    </span>
                  </label>
                </div>
                <p className="mt-1 text-xs text-gray-400">Chọn "Ghi nợ" nếu học sinh đã học nhưng chưa đóng tiền</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Số buổi</label>
                  <Input name="total_sessions" type="number" required min={1} defaultValue={8} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Ngày đóng</label>
                  <Input name="paid_at" type="date" defaultValue={new Date().toISOString().split('T')[0]} />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Số tiền (VNĐ)</label>
                <Input name="amount_paid" type="number" defaultValue={1200000} min={0} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Ghi chú</label>
                <Textarea name="note" placeholder="Ghi chú nếu có..." />
              </div>
              <Button type="submit" className="w-full bg-[#0D2545] text-white hover:bg-[#0D2545]/90">
                Kích hoạt gói học
              </Button>
            </form>
          </div>

          {/* Lịch sử */}
          <div>
            <div className="mb-4 flex items-center gap-3">
              <h3 className="font-semibold dark:text-gray-100">Lịch sử thanh toán</h3>
              {pendingCount > 0 && (
                <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                  {pendingCount} chưa thu
                </span>
              )}
            </div>
            <div className="space-y-2.5">
              {(recentPackages ?? []).map((p: Package & { students: { id: string; full_name: string }; sessions: { id: string }[] }) => (
                <div
                  key={p.id}
                  className={`rounded-xl border bg-white px-4 py-3 dark:bg-gray-800 ${
                    p.payment_status === 'pending' && p.status === 'active'
                      ? 'border-amber-200 dark:border-amber-800/40'
                      : 'border-gray-100 dark:border-gray-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="font-medium dark:text-gray-100">{p.students?.full_name}</div>
                      <div className="text-sm text-gray-500">
                        {p.payment_status === 'pending'
                          ? <span className="font-medium text-amber-600 dark:text-amber-400">Chưa thu tiền · {p.total_sessions} buổi</span>
                          : <>{p.amount_paid.toLocaleString('vi-VN')}đ · {p.paid_at} · {p.total_sessions} buổi</>
                        }
                      </div>
                      {p.note && <div className="text-xs text-gray-400">{p.note}</div>}
                    </div>
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <div className="flex items-center gap-1">
                        <Badge variant={STATUS_VARIANT[p.status]}>{STATUS_LABEL[p.status]}</Badge>
                        <DeletePackageButton
                          packageId={p.id}
                          studentId={p.students?.id}
                          studentName={p.students?.full_name}
                          sessionCount={p.sessions?.length ?? 0}
                          amountPaid={p.amount_paid}
                          paymentStatus={p.payment_status as 'paid' | 'pending'}
                        />
                      </div>
                      <span className="text-xs text-gray-400">{p.used_sessions}/{p.total_sessions} buổi</span>
                      {p.payment_status === 'pending' && p.status === 'active' && (
                        <MarkPaidButton packageId={p.id} />
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {(recentPackages ?? []).length === 0 && (
                <div className="rounded-xl border border-dashed border-gray-200 py-10 text-center text-sm text-gray-400 dark:border-gray-700">
                  Chưa có lịch sử thanh toán
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
