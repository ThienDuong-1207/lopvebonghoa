export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
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
  await supabase.from('profiles').insert({
    email: formData.get('email') as string,
    full_name: formData.get('full_name') as string,
    role: 'staff',
    phone: (formData.get('phone') as string) || null,
    is_active: true,
  })
  redirect('/admin/staff')
}

async function toggleStaff(id: string, isActive: boolean) {
  'use server'
  const supabase = createClient()
  await supabase.from('profiles').update({ is_active: !isActive }).eq('id', id)
  redirect('/admin/staff')
}

export default async function StaffManagePage() {
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
                          <form action={toggleStaff.bind(null, s.id, s.is_active)}>
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
