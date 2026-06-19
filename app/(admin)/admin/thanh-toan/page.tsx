export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import Topbar from '@/components/admin/Topbar'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import type { Student, Package } from '@/lib/types/database'

async function createPackage(formData: FormData) {
  'use server'
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const studentId = formData.get('student_id') as string

  // Kiểm tra không có gói active
  const { data: existing } = await supabase
    .from('packages')
    .select('id')
    .eq('student_id', studentId)
    .eq('status', 'active')
    .single()

  if (existing) return // 409: đã có gói active

  await supabase.from('packages').insert({
    student_id: studentId,
    amount_paid: Number(formData.get('amount_paid')),
    paid_at: formData.get('paid_at') as string,
    note: (formData.get('note') as string) || null,
    total_sessions: 8,
    used_sessions: 0,
    marked_paid_by: user?.id,
    status: 'active',
  })
  redirect('/admin/thanh-toan')
}

export default async function ThanhToanPage() {
  const supabase = createClient()

  const { data: students } = await supabase
    .from('students')
    .select('id, full_name')
    .eq('status', 'active')
    .order('full_name')

  const { data: recentPackages } = await supabase
    .from('packages')
    .select('*, students(full_name)')
    .order('created_at', { ascending: false })
    .limit(20)

  return (
    <>
      <Topbar title="Thanh toán" />
      <div className="p-6">
        <div className="grid gap-6 xl:grid-cols-2">
          {/* Form ghi nhận */}
          <div>
            <h3 className="mb-4 font-semibold">Ghi nhận thanh toán mới</h3>
            <form action={createPackage} className="space-y-4 rounded-xl border border-gray-200 bg-white p-5">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Học sinh *</label>
                <select
                  name="student_id"
                  required
                  className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                >
                  <option value="">Chọn học sinh...</option>
                  {(students ?? []).map((s: Pick<Student, 'id' | 'full_name'>) => (
                    <option key={s.id} value={s.id}>
                      {s.full_name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Số tiền (VNĐ) *</label>
                <Input name="amount_paid" type="number" required defaultValue={1200000} min={0} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Ngày đóng *</label>
                <Input
                  name="paid_at"
                  type="date"
                  required
                  defaultValue={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Ghi chú</label>
                <Textarea name="note" placeholder="Ghi chú nếu có..." />
              </div>
              <Button type="submit" className="w-full bg-[#0D2545] text-white hover:bg-[#0D2545]/90">
                Kích hoạt gói 8 buổi
              </Button>
            </form>
          </div>

          {/* Lịch sử */}
          <div>
            <h3 className="mb-4 font-semibold">Lịch sử thanh toán gần đây</h3>
            <div className="space-y-3">
              {(recentPackages ?? []).map(
                (p: Package & { students: { full_name: string } }) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between rounded-xl border border-gray-100 bg-white px-4 py-3"
                  >
                    <div>
                      <div className="font-medium">{p.students?.full_name}</div>
                      <div className="text-sm text-gray-500">
                        {p.amount_paid.toLocaleString('vi-VN')}đ — {p.paid_at}
                      </div>
                    </div>
                    <Badge
                      variant={
                        p.status === 'active'
                          ? 'default'
                          : p.status === 'completed'
                          ? 'secondary'
                          : 'outline'
                      }
                    >
                      {p.used_sessions}/{p.total_sessions}
                    </Badge>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
