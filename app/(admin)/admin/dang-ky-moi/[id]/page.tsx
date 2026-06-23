export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Topbar from '@/components/admin/Topbar'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import type { Registration, Class } from '@/lib/types/database'
import { DAY_SHORT } from '@/lib/types/database'

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

function formatSlot(c: Pick<Class, 'name' | 'days_of_week' | 'time_start' | 'time_end'>) {
  const days = [...c.days_of_week].sort((a, b) => a - b).map((d) => DAY_SHORT[d]).join(', ')
  return `${c.name} — ${days} · ${c.time_start.slice(0, 5)}–${c.time_end.slice(0, 5)}`
}

async function saveRegistration(formData: FormData) {
  'use server'
  const id = formData.get('id') as string
  const supabase = createClient()
  await supabase.from('registrations').update({
    child_name:     (formData.get('child_name') as string).trim(),
    child_age:      formData.get('child_age') ? Number(formData.get('child_age')) : null,
    parent_name:    (formData.get('parent_name') as string).trim(),
    phone:          (formData.get('phone') as string).trim(),
    preferred_slot: (formData.get('preferred_slot') as string) || null,
    message:        (formData.get('message') as string) || null,
  }).eq('id', id)
  redirect(`/admin/dang-ky-moi/${id}`)
}

async function updateStatus(formData: FormData) {
  'use server'
  const id     = formData.get('id') as string
  const status = formData.get('status') as string
  const supabase = createClient()
  await supabase.from('registrations').update({
    status,
    ...(status === 'contacted' ? { contacted_at: new Date().toISOString() } : {}),
  }).eq('id', id)
  redirect(`/admin/dang-ky-moi/${id}`)
}

async function convertToStudent(formData: FormData) {
  'use server'
  const registrationId = formData.get('id') as string
  const supabase = createClient()

  const { data: reg } = await supabase.from('registrations').select('*').eq('id', registrationId).single()
  if (!reg) redirect('/admin/dang-ky-moi')
  if (reg.converted_student_id) redirect(`/admin/hoc-sinh/${reg.converted_student_id}`)

  // Tìm phụ huynh theo SĐT hoặc tạo mới
  let parentId: string
  const { data: existingParent } = await supabase
    .from('parents').select('id').eq('phone', reg.phone).maybeSingle()

  if (existingParent) {
    parentId = existingParent.id
  } else {
    const { data: newParent, error } = await supabase
      .from('parents').insert({ full_name: reg.parent_name, phone: reg.phone }).select('id').single()
    if (error || !newParent) redirect('/admin/dang-ky-moi?error=parent')
    parentId = newParent!.id
  }

  // Tạo học sinh — tính birth_year từ age
  const currentYear = new Date().getFullYear()
  const birth_year  = reg.child_age ? currentYear - reg.child_age : null
  const notes       = reg.preferred_slot ? `Ca mong muốn: ${reg.preferred_slot}` : null

  const { data: student, error: studentErr } = await supabase
    .from('students')
    .insert({
      full_name:  reg.child_name,
      age:        reg.child_age ?? null,
      birth_year,
      parent_id:  parentId,
      notes,
      status:     'active',
    })
    .select('id')
    .single()

  if (studentErr || !student) redirect('/admin/dang-ky-moi?error=student')

  await supabase.from('registrations')
    .update({ status: 'converted', converted_student_id: student!.id })
    .eq('id', registrationId)

  // Chuyển thẳng đến trang thanh toán để tạo gói học
  redirect(`/admin/thanh-toan?student_id=${student!.id}`)
}

interface Props { params: { id: string } }

export default async function RegistrationDetailPage({ params }: Props) {
  const supabase = createClient()

  const [{ data: reg }, { data: rawClasses }] = await Promise.all([
    supabase.from('registrations').select('*').eq('id', params.id).single(),
    supabase.from('classes').select('id, name, days_of_week, time_start, time_end').eq('is_active', true).order('time_start'),
  ])

  if (!reg) notFound()

  const registration = reg as Registration
  const classes = (rawClasses ?? []) as Pick<Class, 'id' | 'name' | 'days_of_week' | 'time_start' | 'time_end'>[]

  return (
    <>
      <Topbar title="Chi tiết đăng ký" />
      <div className="p-6">
        <Link
          href="/admin/dang-ky-moi"
          className="mb-5 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <ChevronLeft className="h-4 w-4" />
          Danh sách đăng ký
        </Link>

        <div className="mx-auto max-w-2xl space-y-5">
          {/* Status + meta */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-white px-5 py-4 dark:border-gray-700 dark:bg-gray-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold dark:text-gray-100">{registration.child_name}</span>
                <Badge variant={STATUS_VARIANT[registration.status]}>{STATUS_LABEL[registration.status]}</Badge>
              </div>
              <div className="mt-0.5 text-xs text-gray-400">
                Gửi lúc {new Date(registration.submitted_at).toLocaleString('vi-VN')}
                {registration.contacted_at && (
                  <> · Đã liên hệ {new Date(registration.contacted_at).toLocaleString('vi-VN')}</>
                )}
              </div>
            </div>

            {/* Status actions */}
            <div className="flex flex-wrap gap-2">
              {registration.status === 'pending' && (
                <>
                  <form action={updateStatus}>
                    <input type="hidden" name="id" value={registration.id} />
                    <input type="hidden" name="status" value="contacted" />
                    <button className="rounded-lg bg-[#0D2545] px-3 py-1.5 text-xs text-white hover:bg-[#0D2545]/90">
                      Đã liên hệ
                    </button>
                  </form>
                  <form action={updateStatus}>
                    <input type="hidden" name="id" value={registration.id} />
                    <input type="hidden" name="status" value="rejected" />
                    <button className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-400">
                      Từ chối
                    </button>
                  </form>
                </>
              )}
              {registration.status === 'contacted' && (
                <form action={updateStatus}>
                  <input type="hidden" name="id" value={registration.id} />
                  <input type="hidden" name="status" value="pending" />
                  <button className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-400">
                    ← Về chờ xử lý
                  </button>
                </form>
              )}
              {registration.status === 'converted' && registration.converted_student_id && (
                <Link
                  href={`/admin/hoc-sinh/${registration.converted_student_id}`}
                  className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs text-emerald-700 hover:bg-emerald-100 dark:border-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400"
                >
                  Xem hồ sơ học sinh →
                </Link>
              )}
            </div>
          </div>

          {/* Edit form */}
          {registration.status !== 'converted' && (
            <form action={saveRegistration} className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
              <h3 className="mb-4 font-semibold text-gray-800 dark:text-gray-100">Thông tin đăng ký</h3>
              <input type="hidden" name="id" value={registration.id} />
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Tên con</label>
                    <Input name="child_name" defaultValue={registration.child_name} required />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Tuổi</label>
                    <Input name="child_age" type="number" min={3} max={12} defaultValue={registration.child_age ?? ''} />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Tên phụ huynh</label>
                  <Input name="parent_name" defaultValue={registration.parent_name} required />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Số điện thoại</label>
                  <Input name="phone" type="tel" defaultValue={registration.phone} required />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Ca học mong muốn</label>
                  <select
                    name="preferred_slot"
                    defaultValue={registration.preferred_slot ?? ''}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
                  >
                    <option value="">Linh hoạt / Chưa biết</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.name}>{formatSlot(c)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Ghi chú / Tin nhắn</label>
                  <Textarea name="message" defaultValue={registration.message ?? ''} rows={3} />
                </div>
                <button
                  type="submit"
                  className="w-full rounded-lg bg-[#C9A84C] py-2 text-sm font-semibold text-white hover:bg-[#C9A84C]/90"
                >
                  Lưu thay đổi
                </button>
              </div>
            </form>
          )}

          {/* Convert to student */}
          {registration.status === 'contacted' && (
            <form action={convertToStudent} className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 dark:border-emerald-800/40 dark:bg-emerald-900/10">
              <h3 className="mb-1 font-semibold text-emerald-800 dark:text-emerald-300">Thêm vào danh sách học sinh</h3>
              <p className="mb-4 text-sm text-emerald-700/70 dark:text-emerald-400/70">
                Tạo hồ sơ học sinh từ thông tin đăng ký. Sau đó chuyển sang trang Thanh toán để tạo gói học đầu tiên.
              </p>
              <input type="hidden" name="id" value={registration.id} />
              <button
                type="submit"
                className="w-full rounded-lg bg-emerald-600 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                Thêm vào lớp → Tạo gói học
              </button>
            </form>
          )}
        </div>
      </div>
    </>
  )
}
