export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import Topbar from '@/components/admin/Topbar'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { notFound } from 'next/navigation'
import type { Package, Session } from '@/lib/types/database'

const SESSION_LABEL: Record<string, string> = {
  present: 'Có mặt',
  absent: 'Vắng',
  makeup: 'Học bù',
}

export default async function StudentDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient()

  const { data: student } = await supabase
    .from('students')
    .select('*, slots(name, time_start, time_end)')
    .eq('id', params.id)
    .single()

  if (!student) notFound()

  const { data: packages } = await supabase
    .from('packages')
    .select('*, sessions(*)')
    .eq('student_id', params.id)
    .order('created_at', { ascending: false })

  const activePackage = (packages ?? []).find((p: Package) => p.status === 'active')

  return (
    <>
      <Topbar title={student.full_name} />
      <div className="p-6">
        <div className="grid gap-6 xl:grid-cols-3">
          {/* Thông tin cá nhân */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Thông tin học sinh</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Tên</span>
                <span className="font-medium">{student.full_name}</span>
              </div>
              {student.nickname && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Biệt danh</span>
                  <span>"{student.nickname}"</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">Tuổi</span>
                <span>{student.age ?? '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Phụ huynh</span>
                <span>{student.parent_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">SĐT</span>
                <span>{student.parent_phone}</span>
              </div>
              {student.parent_phone_2 && (
                <div className="flex justify-between">
                  <span className="text-gray-500">SĐT 2</span>
                  <span>{student.parent_phone_2}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">Ca học</span>
                <span>{student.slots?.name ?? '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Trạng thái</span>
                <Badge>{student.status}</Badge>
              </div>
              {student.notes && (
                <div className="border-t pt-3">
                  <p className="text-gray-500">Ghi chú</p>
                  <p className="mt-1 text-gray-700">{student.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Gói hiện tại */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Gói học hiện tại</CardTitle>
            </CardHeader>
            <CardContent>
              {activePackage ? (
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Tiến trình</span>
                    <span className="font-bold text-[#0D2545]">
                      {activePackage.used_sessions}/{activePackage.total_sessions} buổi
                    </span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full bg-[#C9A84C]"
                      style={{
                        width: `${(activePackage.used_sessions / activePackage.total_sessions) * 100}%`,
                      }}
                    />
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Học phí</span>
                    <span>{activePackage.amount_paid.toLocaleString('vi-VN')}đ</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Ngày đóng</span>
                    <span>{activePackage.paid_at}</span>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-400">Chưa có gói học active</p>
              )}
            </CardContent>
          </Card>

          {/* Lịch sử buổi học */}
          <Card className="xl:col-span-1">
            <CardHeader>
              <CardTitle className="text-base">Lịch sử buổi học</CardTitle>
            </CardHeader>
            <CardContent>
              {activePackage?.sessions && activePackage.sessions.length > 0 ? (
                <div className="space-y-2 text-sm">
                  {(activePackage.sessions as Session[])
                    .sort((a, b) => b.session_date.localeCompare(a.session_date))
                    .map((s: Session) => (
                      <div key={s.id} className="flex items-center justify-between">
                        <span className="text-gray-600">{s.session_date}</span>
                        <Badge
                          variant={
                            s.status === 'present'
                              ? 'default'
                              : s.status === 'absent'
                              ? 'destructive'
                              : 'secondary'
                          }
                        >
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
