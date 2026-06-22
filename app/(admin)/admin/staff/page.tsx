export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import Topbar from '@/components/admin/Topbar'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import type { Profile, Class } from '@/lib/types/database'
import { formatDays } from '@/lib/types/database'

async function createStaff(formData: FormData) {
  'use server'
  const supabase = createClient()
  const email = (formData.get('email') as string).trim().toLowerCase()
  const { error } = await supabase.from('profiles').insert({
    email,
    full_name: (formData.get('full_name') as string).trim(),
    role: 'staff',
    phone: (formData.get('phone') as string).trim() || null,
    is_active: true,
  })
  if (error) redirect(`/admin/staff?error=${encodeURIComponent(error.message)}`)
  redirect('/admin/staff?ok=1')
}

async function toggleStaff(id: string, isActive: boolean, authUserId: string | null) {
  'use server'
  const supabase = createClient()
  await supabase.from('profiles').update({ is_active: !isActive }).eq('id', id)

  // Khi khóa: thu hồi session ngay lập tức, không chờ cookie hết hạn
  if (isActive && authUserId) {
    const admin = createAdmin(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    await admin.auth.admin.signOut(authUserId, 'global')
  }

  redirect('/admin/staff')
}

interface Props { searchParams: { error?: string; ok?: string } }

export default async function StaffManagePage({ searchParams }: Props) {
  const supabase = createClient()

  const [{ data: staffList }, { data: classes }] = await Promise.all([
    supabase
      .from('profiles')
      .select('*')
      .eq('role', 'staff')
      .order('full_name'),
    supabase.from('classes').select('id, name, days_of_week, assigned_staff_id').eq('is_active', true),
  ])

  function getStaffClasses(staffId: string) {
    return (classes ?? []).filter((c: Pick<Class, 'id' | 'name' | 'days_of_week' | 'assigned_staff_id'>) => c.assigned_staff_id === staffId)
  }

  return (
    <>
      <Topbar title="Quản lý Trợ giảng" />
      <div className="p-6">
        <div className="grid gap-6 xl:grid-cols-3">
          {/* Danh sách staff */}
          <div className="xl:col-span-2">
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-700/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Trợ giảng</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">SĐT</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Ca phụ trách</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Trạng thái</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {(staffList ?? []).map((s: Profile) => {
                    const staffClasses = getStaffClasses(s.id)
                    return (
                      <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/40">
                        <td className="px-4 py-3">
                          <div className="font-medium dark:text-gray-100">{s.full_name}</div>
                          <div className="text-xs text-gray-400">{s.email}</div>
                          {!s.auth_user_id && <div className="text-xs text-amber-500">Chưa đăng nhập lần đầu</div>}
                        </td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{s.phone ?? '—'}</td>
                        <td className="px-4 py-3">
                          {staffClasses.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {staffClasses.map((cls: Pick<Class, 'id' | 'name' | 'days_of_week'>) => (
                                <div key={cls.id} className="text-xs">
                                  <Badge variant="outline">{cls.name}</Badge>
                                  <span className="ml-1 text-gray-400">{formatDays(cls.days_of_week)}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-gray-400">Chưa phân công</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={s.is_active ? 'default' : 'secondary'}>
                            {s.is_active ? 'Hoạt động' : 'Bị khóa'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <form action={toggleStaff.bind(null, s.id, s.is_active, s.auth_user_id ?? null)}>
                            <button className="text-xs text-gray-400 hover:text-[#0D2545] dark:hover:text-[#C9A84C]">
                              {s.is_active ? 'Khóa' : 'Mở khóa'}
                            </button>
                          </form>
                        </td>
                      </tr>
                    )
                  })}
                  {(staffList ?? []).length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-10 text-center text-gray-400">
                        Chưa có trợ giảng nào
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Form thêm staff */}
          <div>
            <h3 className="mb-4 font-semibold dark:text-gray-100">Thêm trợ giảng mới</h3>

            {searchParams.error && (
              <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-600 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
                {searchParams.error}
              </div>
            )}
            {searchParams.ok && (
              <div className="mb-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm text-emerald-600 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400">
                ✓ Đã thêm trợ giảng thành công
              </div>
            )}

            <form action={createStaff} className="space-y-3 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">Gmail *</label>
                <Input name="email" type="email" required placeholder="huyen@gmail.com" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">Họ tên</label>
                <Input name="full_name" required placeholder="Nguyễn Thị Huyền" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">Số điện thoại</label>
                <Input name="phone" placeholder="0901234567" />
              </div>
              <p className="text-xs text-gray-400">
                Trợ giảng dùng Gmail này đăng nhập → hệ thống tự liên kết tài khoản.
              </p>
              <Button type="submit" className="w-full bg-[#0D2545] text-white hover:bg-[#0D2545]/90">
                Thêm trợ giảng
              </Button>
            </form>
          </div>
        </div>
      </div>
    </>
  )
}
