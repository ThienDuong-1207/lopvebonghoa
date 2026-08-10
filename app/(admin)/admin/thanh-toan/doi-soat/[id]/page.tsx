export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import Topbar from '@/components/admin/Topbar'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'
import { formatDate } from '@/lib/utils/formatters'

const STATUS_LABEL: Record<string, string> = { present: 'Có mặt', makeup: 'Học bù' }

async function reassignSessions(newPackageId: string, formData: FormData) {
  'use server'
  const supabase = createClient()
  const sessionIds = formData.getAll('session_ids') as string[]

  if (sessionIds.length > 0) {
    await supabase.from('sessions').update({ package_id: newPackageId }).in('id', sessionIds)
  }

  redirect('/admin/thanh-toan?success=1')
}

export default async function DoiSoatPage({ params }: { params: { id: string } }) {
  const supabase = createClient()

  const { data: pkg } = await supabase
    .from('packages')
    .select('*, students(full_name)')
    .eq('id', params.id)
    .single()

  if (!pkg) notFound()

  const { data: strayed } = await supabase
    .from('sessions')
    .select('id, session_date, status, package_id, packages(start_date, status)')
    .eq('student_id', pkg.student_id)
    .neq('package_id', pkg.id)
    .gte('session_date', pkg.start_date)
    .in('status', ['present', 'makeup'])
    .order('session_date')

  const boundAction = reassignSessions.bind(null, pkg.id)

  return (
    <>
      <Topbar title="Đối soát buổi điểm danh" backHref="/admin/thanh-toan" backLabel="Thanh toán" />
      <div className="p-6">
        <div className="mx-auto max-w-lg">
          <div className="mb-4 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-800/50 dark:bg-amber-900/20 dark:text-amber-400">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              Đã tạo gói mới cho <strong>{(pkg as unknown as { students: { full_name: string } }).students?.full_name}</strong> (bắt đầu {formatDate(pkg.start_date)}).
              Hệ thống phát hiện <strong>{strayed?.length ?? 0} buổi</strong> đã điểm danh trong khoảng ngày này nhưng đang gắn gói khác — chọn buổi cần gán lại về gói mới.
            </div>
          </div>

          {(strayed?.length ?? 0) === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-200 bg-white p-8 text-center text-sm text-gray-400 dark:border-gray-700 dark:bg-gray-800">
              Không có buổi nào cần đối soát.
            </div>
          ) : (
            <form action={boundAction} className="space-y-3 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
              <div className="space-y-2">
                {(strayed ?? []).map((s) => {
                  const oldPkg = s.packages as unknown as { start_date: string; status: string } | null
                  return (
                    <label
                      key={s.id}
                      className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 px-3 py-2.5 text-sm has-[:checked]:border-[#0D2545] has-[:checked]:bg-[#0D2545]/5 dark:border-gray-600 dark:has-[:checked]:border-[#C9A84C] dark:has-[:checked]:bg-[#C9A84C]/10"
                    >
                      <input
                        type="checkbox"
                        name="session_ids"
                        value={s.id}
                        defaultChecked
                        className="h-4 w-4 rounded border-gray-300 text-[#0D2545] focus:ring-[#0D2545]"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-gray-800 dark:text-gray-100">
                          {formatDate(s.session_date)} · {STATUS_LABEL[s.status] ?? s.status}
                        </div>
                        <div className="text-xs text-gray-400">
                          Đang thuộc gói bắt đầu {oldPkg?.start_date ? formatDate(oldPkg.start_date) : '—'} ({oldPkg?.status ?? '—'})
                        </div>
                      </div>
                    </label>
                  )
                })}
              </div>

              <div className="flex gap-2 pt-2">
                <Button type="submit" className="flex-1 bg-[#0D2545] text-white hover:bg-[#0D2545]/90">
                  Gán lại buổi đã chọn
                </Button>
                <Link href="/admin/thanh-toan?success=1" className="flex-1">
                  <Button type="button" variant="outline" className="w-full">Bỏ qua</Button>
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </>
  )
}
