export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import Topbar from '@/components/admin/Topbar'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import type { Slot } from '@/lib/types/database'

async function createStudent(formData: FormData) {
  'use server'
  const supabase = createClient()
  const { error } = await supabase.from('students').insert({
    full_name: formData.get('full_name') as string,
    nickname: (formData.get('nickname') as string) || null,
    age: formData.get('age') ? Number(formData.get('age')) : null,
    parent_name: formData.get('parent_name') as string,
    parent_phone: formData.get('parent_phone') as string,
    parent_phone_2: (formData.get('parent_phone_2') as string) || null,
    preferred_slot_id: (formData.get('preferred_slot_id') as string) || null,
    notes: (formData.get('notes') as string) || null,
    status: 'active',
  })
  if (!error) redirect('/admin/hoc-sinh')
}

export default async function TaoHocSinhPage() {
  const supabase = createClient()
  const { data: slots } = await supabase.from('slots').select('*').eq('is_active', true).order('name')

  return (
    <>
      <Topbar title="Thêm học sinh mới" />
      <div className="p-6">
        <div className="mx-auto max-w-xl">
          <form action={createStudent} className="space-y-4">
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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Tên phụ huynh *</label>
                <Input name="parent_name" required placeholder="Nguyễn Thị B" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">SĐT Zalo *</label>
                <Input name="parent_phone" required placeholder="0901234567" />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">SĐT phụ</label>
              <Input name="parent_phone_2" placeholder="0901234567" />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Ca học</label>
              <select
                name="preferred_slot_id"
                className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
              >
                <option value="">Chưa xác định</option>
                {(slots ?? []).map((s: Slot) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Ghi chú</label>
              <Textarea name="notes" placeholder="Dị ứng, sở thích vẽ, ..." />
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" className="bg-[#0D2545] text-white hover:bg-[#0D2545]/90">
                Tạo học sinh
              </Button>
              <Button type="button" variant="outline" onClick={() => history.back()}>
                Hủy
              </Button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
