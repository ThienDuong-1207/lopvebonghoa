'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { AlertCircle } from 'lucide-react'
import type { Class, Parent } from '@/lib/types/database'
import { formatDays } from '@/lib/types/database'

interface Props {
  classes: Class[]
  parents: Pick<Parent, 'id' | 'full_name' | 'phone'>[]
  action: (prev: string | null, formData: FormData) => Promise<string | null>
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button
      type="submit"
      disabled={pending}
      className="bg-[#0D2545] text-white hover:bg-[#0D2545]/90 disabled:opacity-60"
    >
      {pending ? 'Đang lưu...' : 'Tạo học sinh'}
    </Button>
  )
}

export default function StudentForm({ classes, parents, action }: Props) {
  const [error, formAction] = useFormState(action, null)

  return (
    <form action={formAction} className="space-y-4">
      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Thông tin học sinh */}
      <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-700 dark:bg-gray-800/50">
        <h3 className="mb-3 font-semibold text-gray-700 dark:text-gray-200">Thông tin học sinh</h3>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Họ tên *</label>
              <Input name="full_name" required placeholder="Nguyễn Văn An" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Biệt danh</label>
              <Input name="nickname" placeholder="An" />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Tuổi</label>
            <Input name="age" type="number" min={4} max={12} placeholder="6" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Lớp học</label>
            <select name="class_id" className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200">
              <option value="">Chưa xếp lớp</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} — {formatDays(c.days_of_week)} · {c.time_start.slice(0, 5)}–{c.time_end.slice(0, 5)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Ghi chú</label>
            <Textarea name="notes" placeholder="Dị ứng, sở thích vẽ, ..." />
          </div>
        </div>
      </div>

      {/* Phụ huynh */}
      <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-700 dark:bg-gray-800/50">
        <h3 className="mb-3 font-semibold text-gray-700 dark:text-gray-200">Phụ huynh</h3>

        {parents.length > 0 && (
          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Chọn phụ huynh đã có (nếu có con khác đang học)
            </label>
            <select name="existing_parent_id" className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200">
              <option value="">— Tạo phụ huynh mới —</option>
              {parents.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.full_name} — {p.phone}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-400">Để trống sẽ tạo phụ huynh mới bên dưới</p>
          </div>
        )}

        <div className="space-y-3">
          <p className="text-xs text-gray-400">
            {parents.length > 0 ? 'Hoặc tạo phụ huynh mới:' : 'Điền thông tin phụ huynh:'}
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Tên phụ huynh</label>
              <Input name="parent_name" placeholder="Nguyễn Thị B" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">SĐT Zalo *</label>
              <Input name="parent_phone" type="tel" placeholder="0901234567" />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">SĐT phụ</label>
            <Input name="parent_phone_2" placeholder="0901234567" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Địa chỉ</label>
            <Input name="parent_address" placeholder="123 Đường ABC, Phường X, Quận Y" />
          </div>
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <SubmitButton />
        <Button type="button" variant="outline" onClick={() => history.back()}>
          Hủy
        </Button>
      </div>
    </form>
  )
}
