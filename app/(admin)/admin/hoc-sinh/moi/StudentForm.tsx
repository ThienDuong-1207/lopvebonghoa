'use client'

import { useState } from 'react'
import { useFormState, useFormStatus } from 'react-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { AlertCircle } from 'lucide-react'
import type { Class, Parent } from '@/lib/types/database'
import { formatDays } from '@/lib/types/database'

function calcAge(dateStr: string): number {
  const birth = new Date(dateStr)
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  if (today.getMonth() < birth.getMonth() || (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())) age--
  return age
}

interface Props {
  classes: Class[]
  parents: Pick<Parent, 'id' | 'full_name' | 'phone'>[]
  action: (prev: string | null, formData: FormData) => Promise<string | null>
}

function SectionHeader({ number, title }: { number: number; title: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#0D2545] text-xs font-bold text-white dark:bg-[#C9A84C]">
        {number}
      </span>
      <h3 className="font-semibold text-gray-800 dark:text-gray-200">{title}</h3>
    </div>
  )
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
  const [birthDate, setBirthDate] = useState('')
  const autoAge = birthDate ? calcAge(birthDate) : null

  return (
    <form action={formAction} className="space-y-4">
      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* ① Thông tin học sinh */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="border-b border-gray-100 bg-gray-50/60 px-5 py-3.5 dark:border-gray-700 dark:bg-gray-700/30">
          <SectionHeader number={1} title="Thông tin học sinh" />
        </div>
        <div className="space-y-4 p-5">
          {/* Họ tên + Biệt danh */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Họ tên <span className="text-red-500">*</span>
              </label>
              <Input name="full_name" required placeholder="Nguyễn Văn An" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Biệt danh</label>
              <Input name="nickname" placeholder="An" />
            </div>
          </div>

          {/* Ngày sinh + Tuổi */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Ngày sinh</label>
              <Input
                name="birth_date"
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Tuổi
                {autoAge !== null && (
                  <span className="ml-1.5 text-xs font-normal text-[#C9A84C]">(tính từ ngày sinh)</span>
                )}
              </label>
              <Input
                name="age"
                type="number"
                min={1}
                placeholder="6"
                value={autoAge !== null ? autoAge : undefined}
                readOnly={autoAge !== null}
                className={autoAge !== null ? 'bg-gray-50 text-gray-500 dark:bg-gray-700/50' : ''}
              />
            </div>
          </div>

          {/* Lớp học */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Lớp học</label>
            <select
              name="class_id"
              className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
            >
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

      {/* ② Phụ huynh */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="border-b border-gray-100 bg-gray-50/60 px-5 py-3.5 dark:border-gray-700 dark:bg-gray-700/30">
          <SectionHeader number={2} title="Phụ huynh" />
        </div>
        <div className="space-y-4 p-5">
          {/* Chọn phụ huynh đã có */}
          {parents.length > 0 && (
            <>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Phụ huynh đã có{' '}
                  <span className="font-normal text-gray-400">(nếu đã có con khác đang học)</span>
                </label>
                <select
                  name="existing_parent_id"
                  className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                >
                  <option value="">— Tạo phụ huynh mới —</option>
                  {parents.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.full_name} — {p.phone}
                    </option>
                  ))}
                </select>
              </div>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-100 dark:border-gray-700" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-white px-3 text-xs text-gray-400 dark:bg-gray-800">hoặc tạo phụ huynh mới</span>
                </div>
              </div>
            </>
          )}

          {/* Tên + SĐT chính */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Tên phụ huynh <span className="text-red-500">*</span>
              </label>
              <Input name="parent_name" placeholder="Nguyễn Thị B" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Số điện thoại
              </label>
              <Input name="parent_phone" type="tel" placeholder="0901234567" />
            </div>
          </div>

          {/* SĐT phụ + Địa chỉ cùng hàng */}
          <div className="grid grid-cols-5 gap-3">
            <div className="col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">SĐT phụ</label>
              <Input name="parent_phone_2" placeholder="0912345678" />
            </div>
            <div className="col-span-3">
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Địa chỉ</label>
              <Input name="parent_address" placeholder="123 Đường ABC, Quận Y" />
            </div>
          </div>
        </div>
      </div>

      {/* Actions — phân cấp rõ */}
      <div className="flex items-center gap-4 pt-1">
        <SubmitButton />
        <button
          type="button"
          onClick={() => history.back()}
          className="text-sm text-gray-400 transition-colors hover:text-gray-600 dark:hover:text-gray-300"
        >
          Hủy
        </button>
      </div>
    </form>
  )
}
