export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import Topbar from '@/components/admin/Topbar'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
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

async function updateStatus(id: string, status: string) {
  'use server'
  const supabase = createClient()
  await supabase.from('registrations').update({ status }).eq('id', id)
}

export default async function DangKyMoiPage() {
  const supabase = createClient()
  const { data: registrations } = await supabase
    .from('registrations')
    .select('*')
    .order('submitted_at', { ascending: false })

  const pending = (registrations ?? []).filter((r: Registration) => r.status === 'pending')

  return (
    <>
      <Topbar title="Đăng ký mới" />
      <div className="p-6">
        <div className="mb-4 flex items-center gap-3">
          <h2 className="font-semibold">Danh sách đơn đăng ký</h2>
          {pending.length > 0 && (
            <Badge variant="destructive">{pending.length} chờ xử lý</Badge>
          )}
        </div>

        <div className="space-y-4">
          {(registrations ?? []).map((r: Registration) => (
            <Card key={r.id}>
              <CardContent className="py-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{r.child_name}</span>
                      {r.child_age && <span className="text-sm text-gray-400">{r.child_age} tuổi</span>}
                      <Badge variant={STATUS_VARIANT[r.status]}>{STATUS_LABEL[r.status]}</Badge>
                    </div>
                    <div className="text-sm text-gray-600">
                      PH: {r.parent_name} — {r.phone}
                    </div>
                    {r.preferred_slot && (
                      <div className="text-sm text-gray-500">Ca mong muốn: {r.preferred_slot}</div>
                    )}
                    {r.message && (
                      <div className="mt-2 rounded-lg bg-gray-50 p-2 text-sm text-gray-600">
                        {r.message}
                      </div>
                    )}
                    <div className="text-xs text-gray-400">
                      Gửi lúc: {new Date(r.submitted_at).toLocaleString('vi-VN')}
                    </div>
                  </div>

                  {r.status === 'pending' && (
                    <div className="flex gap-2">
                      <form action={updateStatus.bind(null, r.id, 'contacted')}>
                        <button className="rounded-lg bg-[#0D2545] px-3 py-1.5 text-xs text-white hover:bg-[#0D2545]/90">
                          Đã liên hệ
                        </button>
                      </form>
                      <form action={updateStatus.bind(null, r.id, 'rejected')}>
                        <button className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-50">
                          Từ chối
                        </button>
                      </form>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}

          {(registrations ?? []).length === 0 && (
            <div className="rounded-xl border border-dashed py-16 text-center text-gray-400">
              Chưa có đơn đăng ký nào
            </div>
          )}
        </div>
      </div>
    </>
  )
}
