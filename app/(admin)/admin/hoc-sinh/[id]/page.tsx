export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import Topbar from '@/components/admin/Topbar'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { Pencil } from 'lucide-react'
import type { Package, Session } from '@/lib/types/database'

const SESSION_LABEL: Record<string, string> = {
  present: 'Có mặt',
  absent: 'Vắng',
  makeup: 'Học bù',
}
const STATUS_LABEL: Record<string, string> = { active: 'Đang học', paused: 'Tạm nghỉ', inactive: 'Nghỉ học' }
const STATUS_NEXT: Record<string, string[]> = {
  active: ['paused', 'inactive'],
  paused: ['active', 'inactive'],
  inactive: ['active'],
}
const STATUS_NEXT_LABEL: Record<string, string> = { active: 'Đang học', paused: 'Tạm nghỉ', inactive: 'Nghỉ học' }

async function changeStatus(studentId: string, newStatus: string) {
  'use server'
  const supabase = createClient()
  await supabase.from('students').update({ status: newStatus }).eq('id', studentId)
  redirect(`/admin/hoc-sinh/${studentId}`)
}

export default async function StudentDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient()

  const [{ data: student }, { data: packages }] = await Promise.all([
    supabase
      .from('students')
      .select('*, parents(full_name, phone, phone_2, address), slots(name, time_start, time_end)')
      .eq('id', params.id)
      .single(),
    supabase
      .from('packages')
      .select('*, sessions(*)')
      .eq('student_id', params.id)
      .order('created_at', { ascending: false }),
  ])

  if (!student) notFound()

  const activePackage = (packages ?? []).find((p: Package) => p.status === 'active')

  return (
    <>
      <Topbar title={student.full_name} backHref="/admin/hoc-sinh" backLabel="Học sinh" />
      <div className="p-6">
        <div className="grid gap-6 xl:grid-cols-3">
          {/* Thông tin cá nhân */}
          <Card className="dark:border-gray-700 dark:bg-gray-800">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base dark:text-gray-100">Thông tin học sinh</CardTitle>
              <Link
                href={`/admin/hoc-sinh/${params.id}/chinh-sua`}
                className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs text-[#C9A84C] hover:bg-[#C9A84C]/10"
              >
                <Pencil className="h-3.5 w-3.5" /> Chỉnh sửa
              </Link>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Tên</span>
                <span className="font-medium dark:text-gray-100">{student.full_name}</span>
              </div>
              {student.nickname && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Biệt danh</span>
                  <span className="dark:text-gray-200">"{student.nickname}"</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">Tuổi</span>
                <span className="dark:text-gray-200">{student.age ?? '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Ca học</span>
                <span className="dark:text-gray-200">{student.slots?.name ?? '—'}</span>
              </div>

              {/* Status + change */}
              <div className="flex items-center justify-between border-t pt-3 dark:border-gray-700">
                <span className="text-gray-500">Trạng thái</span>
                <div className="flex items-center gap-2">
                  <Badge variant={student.status === 'active' ? 'default' : student.status === 'paused' ? 'secondary' : 'outline'}>
                    {STATUS_LABEL[student.status]}
                  </Badge>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {STATUS_NEXT[student.status]?.map((next) => (
                  <form key={next} action={changeStatus.bind(null, params.id, next)}>
                    <button className="rounded-full border border-gray-200 px-3 py-1 text-xs text-gray-500 hover:border-[#C9A84C] hover:text-[#C9A84C] dark:border-gray-600 dark:text-gray-400">
                      → {STATUS_NEXT_LABEL[next]}
                    </button>
                  </form>
                ))}
              </div>

              {/* Parent info */}
              <div className="border-t pt-3 dark:border-gray-700">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">Phụ huynh</p>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Tên</span>
                    <span className="dark:text-gray-200">{student.parents?.full_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">SĐT Zalo</span>
                    <a href={`tel:${student.parents?.phone}`} className="text-[#C9A84C] hover:underline">
                      {student.parents?.phone}
                    </a>
                  </div>
                  {student.parents?.phone_2 && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">SĐT phụ</span>
                      <span className="dark:text-gray-200">{student.parents.phone_2}</span>
                    </div>
                  )}
                  {student.parents?.address && (
                    <div className="space-y-0.5">
                      <span className="text-gray-500">Địa chỉ</span>
                      <p className="text-sm dark:text-gray-200">{student.parents.address}</p>
                    </div>
                  )}
                </div>
              </div>

              {student.notes && (
                <div className="border-t pt-3 dark:border-gray-700">
                  <p className="text-gray-500">Ghi chú</p>
                  <p className="mt-1 text-gray-700 dark:text-gray-300">{student.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Gói hiện tại */}
          <Card className="dark:border-gray-700 dark:bg-gray-800">
            <CardHeader>
              <CardTitle className="text-base dark:text-gray-100">Gói học hiện tại</CardTitle>
            </CardHeader>
            <CardContent>
              {activePackage ? (
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Tiến trình</span>
                    <span className="font-bold text-[#0D2545] dark:text-[#C9A84C]">
                      {activePackage.used_sessions}/{activePackage.total_sessions} buổi
                    </span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
                    <div
                      className="h-full rounded-full bg-[#C9A84C]"
                      style={{ width: `${(activePackage.used_sessions / activePackage.total_sessions) * 100}%` }}
                    />
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Học phí</span>
                    <span className="dark:text-gray-200">{activePackage.amount_paid.toLocaleString('vi-VN')}đ</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Ngày đóng</span>
                    <span className="dark:text-gray-200">{activePackage.paid_at}</span>
                  </div>
                  {activePackage.note && (
                    <div className="rounded-lg bg-gray-50 p-2 text-xs text-gray-500 dark:bg-gray-700">
                      {activePackage.note}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-gray-400">Chưa có gói học active</p>
                  <Link href="/admin/thanh-toan" className="text-xs text-[#C9A84C] hover:underline">
                    + Thêm gói học →
                  </Link>
                </div>
              )}

              {/* Lịch sử gói */}
              {(packages ?? []).filter((p: Package) => p.status !== 'active').length > 0 && (
                <div className="mt-4 border-t pt-4 dark:border-gray-700">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">Gói cũ</p>
                  <div className="space-y-2">
                    {(packages ?? []).filter((p: Package) => p.status !== 'active').map((p: Package) => (
                      <div key={p.id} className="flex justify-between text-xs text-gray-500">
                        <span>{p.paid_at}</span>
                        <span>{p.used_sessions}/{p.total_sessions} buổi — {p.amount_paid.toLocaleString('vi-VN')}đ</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Lịch sử buổi học */}
          <Card className="xl:col-span-1 dark:border-gray-700 dark:bg-gray-800">
            <CardHeader>
              <CardTitle className="text-base dark:text-gray-100">Lịch sử buổi học</CardTitle>
            </CardHeader>
            <CardContent>
              {activePackage?.sessions && (activePackage.sessions as Session[]).length > 0 ? (
                <div className="max-h-72 space-y-2 overflow-y-auto text-sm">
                  {(activePackage.sessions as Session[])
                    .sort((a, b) => b.session_date.localeCompare(a.session_date))
                    .map((s: Session) => (
                      <div key={s.id} className="flex items-center justify-between">
                        <span className="text-gray-600 dark:text-gray-300">{s.session_date}</span>
                        <Badge variant={s.status === 'present' ? 'default' : s.status === 'absent' ? 'destructive' : 'secondary'}>
                          {SESSION_LABEL[s.status]}
                        </Badge>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400">Chưa có buổi học nào</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}
