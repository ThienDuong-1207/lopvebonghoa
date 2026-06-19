export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import Topbar from '@/components/admin/Topbar'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import type { Slot, Parent } from '@/lib/types/database'

async function createStudent(formData: FormData) {
  'use server'
  const supabase = createClient()

  const existingParentId = formData.get('existing_parent_id') as string
  const parentName = formData.get('parent_name') as string
  const parentPhone = formData.get('parent_phone') as string
  const parentPhone2 = (formData.get('parent_phone_2') as string) || null

  let parentId = existingParentId || null

  // Tạo phụ huynh mới nếu không chọn từ danh sách
  if (!parentId && parentName && parentPhone) {
    const { data: newParent } = await supabase
      .from('parents')
      .insert({ full_name: parentName, phone: parentPhone, phone_2: parentPhone2 })
      .select('id')
      .single()
    parentId = newParent?.id ?? null
  }

  if (!parentId) return

  await supabase.from('students').insert({
    full_name: formData.get('full_name') as string,
    nickname: (formData.get('nickname') as string) || null,
    age: formData.get('age') ? Number(formData.get('age')) : null,
    parent_id: parentId,
    preferred_slot_id: (formData.get('preferred_slot_id') as string) || null,
    notes: (formData.get('notes') as string) || null,
    status: 'active',
  })
  redirect('/admin/hoc-sinh')
}

export default async function TaoHocSinhPage() {
  const supabase = createClient()
  const [{ data: slots }, { data: parents }] = await Promise.all([
    supabase.from('slots').select('*').eq('is_active', true).order('name'),
    supabase.from('parents').select('id, full_name, phone').order('full_name'),
  ])

  return (
    <>
      <Topbar title="Thêm học sinh mới" />
      <div className="p-6">
        <div className="mx-auto max-w-xl">
          <form action={createStudent} className="space-y-4">
            {/* Thông tin học sinh */}
            <div className="rounded-xl border border-gray-200 p-4">
              <h3 className="mb-3 font-semibold text-gray-700">Thông tin học sinh</h3>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Họ tên *</label>
                    <Input name="full_name" required placeholder="Nguyễn Văn An" />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Biệt danh</label>
                    <Input name="nickname" placeholder="An" />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Tuổi</label>
                  <Input name="age" type="number" min={4} max={12} placeholder="6" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Ca học</label>
                  <select name="preferred_slot_id" className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm">
                    <option value="">Chưa xác định</option>
                    {(slots ?? []).map((s: Slot) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Ghi chú</label>
                  <Textarea name="notes" placeholder="Dị ứng, sở thích vẽ, ..." />
                </div>
              </div>
            </div>

            {/* Phụ huynh */}
            <div className="rounded-xl border border-gray-200 p-4">
              <h3 className="mb-3 font-semibold text-gray-700">Phụ huynh</h3>

              {(parents ?? []).length > 0 && (
                <div className="mb-4">
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Chọn phụ huynh đã có (nếu có con khác đang học)
                  </label>
                  <select name="existing_parent_id" className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm">
                    <option value="">— Tạo phụ huynh mới —</option>
                    {(parents ?? []).map((p: Pick<Parent, 'id' | 'full_name' | 'phone'>) => (
                      <option key={p.id} value={p.id}>
                        {p.full_name} — {p.phone}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-gray-400">Để trống sẽ tạo phụ huynh mới bên dưới</p>
                </div>
              )}

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Tên phụ huynh mới</label>
                    <Input name="parent_name" placeholder="Nguyễn Thị B" />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">SĐT Zalo</label>
                    <Input name="parent_phone" type="tel" placeholder="0901234567" />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">SĐT phụ</label>
                  <Input name="parent_phone_2" placeholder="0901234567" />
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" className="bg-[#0D2545] text-white hover:bg-[#0D2545]/90">
                Tạo học sinh
              </Button>
              <Button type="button" variant="outline">
                Hủy
              </Button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
