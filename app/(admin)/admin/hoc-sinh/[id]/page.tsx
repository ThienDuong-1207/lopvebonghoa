export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import Topbar from '@/components/admin/Topbar'
import { Badge } from '@/components/ui/badge'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { Pencil, CalendarDays, Wallet } from 'lucide-react'
import type { Package, Session } from '@/lib/types/database'
import { DAY_SHORT, formatDays } from '@/lib/types/database'

const SESSION_LABEL: Record<string, string> = { present: 'Có mặt', absent: 'Vắng', makeup: 'Học bù' }
const STATUS_LABEL: Record<string, string> = { active: 'Đang học', paused: 'Tạm nghỉ', inactive: 'Nghỉ học' }
const STATUS_NEXT: Record<string, string[]> = {
  active:   ['paused', 'inactive'],
  paused:   ['active', 'inactive'],
  inactive: ['active'],
}

async function changeStatus(studentId: string, newStatus: string) {
  'use server'
  const supabase = createClient()
  await supabase.from('students').update({ status: newStatus }).eq('id', studentId)
  redirect(`/admin/hoc-sinh/${studentId}`)
}

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <>
      <dt className="self-start text-sm text-gray-400 dark:text-gray-500">{label}</dt>
      <dd className="text-sm text-gray-800 dark:text-gray-100">{children}</dd>
    </>
  )
}

function SectionDivider({ title }: { title: string }) {
  return (
    <div className="col-span-2 border-t border-gray-100 pt-4 dark:border-gray-700">
      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{title}</p>
    </div>
  )
}

export default async function StudentDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient()

  const [{ data: student }, { data: packages }] = await Promise.all([
    supabase
      .from('students')
      .select('*, parents(full_name, phone, phone_2, address), classes(name, days_of_week, time_start, time_end)')
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
  const oldPackages   = (packages ?? []).filter((p: Package) => p.status !== 'active')

  const displayName = student.full_name
    .split(' ')
    .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')

  const progressPct = activePackage
    ? Math.round((activePackage.used_sessions / activePackage.total_sessions) * 100)
    : 0

  return (
    <>
      <Topbar title={displayName} backHref="/admin/hoc-sinh" backLabel="Học sinh" />
      <div className="min-h-screen bg-gray-50 p-6 dark:bg-gray-900">
        <div className="grid gap-5 xl:grid-cols-3">

          {/* ── Card 1: Thông tin học sinh ── */}
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-gray-700">
              <h2 className="font-semibold text-gray-800 dark:text-gray-100">Thông tin học sinh</h2>
              <Link
                href={`/admin/hoc-sinh/${params.id}/chinh-sua`}
                className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-[#C9A84C] hover:bg-[#C9A84C]/10"
              >
                <Pencil className="h-3.5 w-3.5" /> Chỉnh sửa
              </Link>
            </div>

            <div className="p-5">
              {/* Info grid — label fixed 90px, value takes rest */}
              <dl className="grid grid-cols-[90px_1fr] gap-x-4 gap-y-3">
                <InfoRow label="Họ tên">{displayName}</InfoRow>
                {student.nickname && (
                  <InfoRow label="Biệt danh">"{student.nickname}"</InfoRow>
                )}
                {student.birth_year && (
                  <InfoRow label="Năm sinh">{student.birth_year}</InfoRow>
                )}
                <InfoRow label="Tuổi">{student.age ? `${student.age} tuổi` : '—'}</InfoRow>
                <InfoRow label="Lớp học">
                  <span className="font-medium">{student.classes?.name ?? '—'}</span>
                  {student.classes && (
                    <span className="ml-1.5 text-xs text-gray-400">
                      {formatDays(student.classes.days_of_week)} · {student.classes.time_start.slice(0,5)}–{student.classes.time_end.slice(0,5)}
                    </span>
                  )}
                </InfoRow>

                {/* Trạng thái */}
                <SectionDivider title="" />
                <dt className="self-center text-sm text-gray-400 dark:text-gray-500">Trạng thái</dt>
                <dd className="flex items-center gap-2">
                  <Badge variant={student.status === 'active' ? 'default' : student.status === 'paused' ? 'secondary' : 'outline'}>
                    {STATUS_LABEL[student.status]}
                  </Badge>
                </dd>

                <dt />
                <dd className="flex flex-wrap gap-1.5">
                  {STATUS_NEXT[student.status]?.map((next) => (
                    <form key={next} action={changeStatus.bind(null, params.id, next)}>
                      <button className="rounded-full border border-gray-200 px-3 py-1 text-xs text-gray-500 transition-colors hover:border-[#C9A84C] hover:text-[#C9A84C] dark:border-gray-600 dark:text-gray-400">
                        → {STATUS_LABEL[next]}
                      </button>
                    </form>
                  ))}
                </dd>

                {/* Phụ huynh */}
                <SectionDivider title="Phụ huynh" />
                <InfoRow label="Tên">{student.parents?.full_name ?? '—'}</InfoRow>
                <InfoRow label="Số điện thoại">
                  <a href={`tel:${student.parents?.phone}`} className="font-medium text-[#C9A84C] hover:underline">
                    {student.parents?.phone}
                  </a>
                </InfoRow>
                {student.parents?.phone_2 && (
                  <InfoRow label="SĐT phụ">{student.parents.phone_2}</InfoRow>
                )}
                {student.parents?.address && (
                  <InfoRow label="Địa chỉ">{student.parents.address}</InfoRow>
                )}
              </dl>

              {student.notes && (
                <div className="mt-4 rounded-xl bg-amber-50 px-3 py-2.5 dark:bg-amber-900/15">
                  <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-amber-500">Ghi chú</p>
                  <p className="text-sm text-amber-800 dark:text-amber-300">{student.notes}</p>
                </div>
              )}
            </div>
          </div>

          {/* ── Card 2: Gói học hiện tại ── */}
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-center gap-2 border-b border-gray-100 px-5 py-4 dark:border-gray-700">
              <Wallet className="h-4 w-4 text-[#C9A84C]" />
              <h2 className="font-semibold text-gray-800 dark:text-gray-100">Gói học hiện tại</h2>
            </div>

            <div className="p-5">
              {activePackage ? (
                <>
                  {/* Progress — số lớn ở trung tâm */}
                  <div className="mb-5 text-center">
                    <div className="text-5xl font-bold tabular-nums text-[#0D2545] dark:text-[#C9A84C]">
                      {activePackage.used_sessions}
                      <span className="text-2xl font-normal text-gray-300 dark:text-gray-600">
                        /{activePackage.total_sessions}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-gray-400">buổi đã học</p>
                  </div>

                  {/* Progress bar */}
                  <div className="mb-1 h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
                    <div
                      className="h-full rounded-full bg-[#C9A84C] transition-all duration-500"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                  <p className="mb-5 text-right text-xs text-gray-400">{progressPct}%</p>

                  <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-3">
                    <InfoRow label="Học phí">
                      <span className="font-semibold">{activePackage.amount_paid.toLocaleString('vi-VN')}đ</span>
                    </InfoRow>
                    <InfoRow label="Ngày đóng">{activePackage.paid_at}</InfoRow>
                    <InfoRow label="Còn lại">
                      <span className={activePackage.total_sessions - activePackage.used_sessions <= 2 ? 'font-semibold text-red-500' : ''}>
                        {activePackage.total_sessions - activePackage.used_sessions} buổi
                      </span>
                    </InfoRow>
                  </dl>

                  {activePackage.note && (
                    <div className="mt-4 rounded-xl bg-gray-50 p-3 text-xs text-gray-500 dark:bg-gray-700">
                      {activePackage.note}
                    </div>
                  )}

                  {oldPackages.length > 0 && (
                    <div className="mt-5 border-t border-gray-100 pt-4 dark:border-gray-700">
                      <p className="mb-2.5 text-[10px] font-bold uppercase tracking-widest text-gray-400">Gói cũ</p>
                      <div className="space-y-2">
                        {oldPackages.map((p: Package) => (
                          <div key={p.id} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-xs dark:bg-gray-700">
                            <span className="text-gray-400">{p.paid_at}</span>
                            <span className="text-gray-500">{p.used_sessions}/{p.total_sessions} buổi</span>
                            <span className="font-medium text-gray-600 dark:text-gray-300">{p.amount_paid.toLocaleString('vi-VN')}đ</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
                  <Wallet className="h-10 w-10 text-gray-200 dark:text-gray-700" />
                  <p className="text-sm text-gray-400">Chưa có gói học</p>
                  <Link
                    href={`/admin/thanh-toan?student_id=${params.id}`}
                    className="rounded-lg bg-[#0D2545] px-4 py-2 text-xs font-medium text-white hover:bg-[#0D2545]/90"
                  >
                    + Kích hoạt gói học
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* ── Card 3: Lịch sử buổi học ── */}
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-center gap-2 border-b border-gray-100 px-5 py-4 dark:border-gray-700">
              <CalendarDays className="h-4 w-4 text-[#C9A84C]" />
              <h2 className="font-semibold text-gray-800 dark:text-gray-100">Lịch sử buổi học</h2>
            </div>

            <div className="p-5">
              {activePackage?.sessions && (activePackage.sessions as Session[]).length > 0 ? (
                <div className="max-h-80 space-y-1.5 overflow-y-auto">
                  {(activePackage.sessions as Session[])
                    .sort((a, b) => b.session_date.localeCompare(a.session_date))
                    .map((s: Session) => {
                      const d = new Date(s.session_date)
                      const dow = DAY_SHORT[d.getDay()]
                      return (
                        <div
                          key={s.id}
                          className="flex items-center justify-between rounded-xl px-3 py-2.5 odd:bg-gray-50 dark:odd:bg-gray-700/40"
                        >
                          <div className="text-sm">
                            <span className="mr-2 rounded-md bg-[#0D2545]/8 px-1.5 py-0.5 text-xs font-medium text-[#0D2545] dark:bg-[#C9A84C]/15 dark:text-[#C9A84C]">
                              {dow}
                            </span>
                            <span className="text-gray-600 dark:text-gray-300">{s.session_date}</span>
                          </div>
                          <Badge variant={s.status === 'present' ? 'default' : s.status === 'absent' ? 'destructive' : 'secondary'}>
                            {SESSION_LABEL[s.status]}
                          </Badge>
                        </div>
                      )
                    })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
                  <CalendarDays className="h-10 w-10 text-gray-200 dark:text-gray-700" />
                  <p className="text-sm text-gray-400">Chưa có buổi học nào</p>
                  <p className="text-xs text-gray-300 dark:text-gray-600">Buổi học sẽ xuất hiện sau khi điểm danh</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </>
  )
}
