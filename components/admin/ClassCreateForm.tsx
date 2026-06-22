'use client'

import { useState } from 'react'
import { useFormState, useFormStatus } from 'react-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AlertCircle, Calendar } from 'lucide-react'
import type { Profile } from '@/lib/types/database'
import { DAY_SHORT, DAY_FULL } from '@/lib/types/database'

const DAYS_OPTIONS = [
  { dow: 1, label: 'T2' }, { dow: 2, label: 'T3' }, { dow: 3, label: 'T4' },
  { dow: 4, label: 'T5' }, { dow: 5, label: 'T6' }, { dow: 6, label: 'T7' },
  { dow: 0, label: 'CN' },
]

// CN(0) hiển thị cuối tuần
function sortDays(days: number[]) {
  return [...days].sort((a, b) => (a === 0 ? 7 : a) - (b === 0 ? 7 : b))
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button
      type="submit"
      disabled={pending}
      className="w-full bg-[#0D2545] text-white hover:bg-[#0D2545]/90 disabled:opacity-60"
    >
      {pending ? 'Đang tạo...' : 'Tạo lớp học'}
    </Button>
  )
}

interface Props {
  action: (prev: string | null, formData: FormData) => Promise<string | null>
  staffList: Pick<Profile, 'id' | 'full_name'>[]
}

export default function ClassCreateForm({ action, staffList }: Props) {
  const [error, formAction] = useFormState(action, null)
  const [selectedDays, setSelectedDays] = useState<number[]>([])
  const [timeStart, setTimeStart] = useState('17:00')
  const [timeEnd, setTimeEnd] = useState('19:00')

  function toggleDay(dow: number) {
    setSelectedDays(prev =>
      prev.includes(dow) ? prev.filter(d => d !== dow) : [...prev, dow]
    )
  }

  const sortedPreview = sortDays(selectedDays)

  return (
    <form action={formAction} className="space-y-3 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-600 dark:border-red-800/50 dark:bg-red-900/20 dark:text-red-400">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <div>
        <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Tên lớp *</label>
        <Input name="name" required placeholder="VD: Tối 2-4-6 A" />
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-400">
          Ngày học * <span className="font-normal text-gray-400">(chọn 1 hoặc nhiều)</span>
        </label>
        <div className="grid grid-cols-4 gap-1.5">
          {DAYS_OPTIONS.map(({ dow, label }) => {
            const active = selectedDays.includes(dow)
            return (
              <button
                key={dow}
                type="button"
                onClick={() => toggleDay(dow)}
                className={`h-9 rounded-lg border text-xs font-semibold transition-colors ${
                  active
                    ? 'border-[#0D2545] bg-[#0D2545] text-white dark:border-[#C9A84C] dark:bg-[#C9A84C]/20 dark:text-[#C9A84C]'
                    : 'border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:border-gray-600 dark:text-gray-400 dark:hover:border-gray-500'
                }`}
              >
                {label}
              </button>
            )
          })}
        </div>
        {selectedDays.map(d => (
          <input key={d} type="hidden" name="days_of_week" value={d} />
        ))}
      </div>

      {/* Live preview lịch */}
      <div className={`overflow-hidden rounded-lg transition-all duration-200 ${
        sortedPreview.length > 0 ? 'max-h-24 opacity-100' : 'max-h-0 opacity-0'
      }`}>
        <div className="flex items-start gap-2.5 rounded-lg bg-[#0D2545]/5 px-3 py-2.5 dark:bg-[#C9A84C]/8">
          <Calendar className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#0D2545] dark:text-[#C9A84C]" />
          <div className="text-xs">
            <div className="flex flex-wrap gap-1">
              {sortedPreview.map(d => (
                <span
                  key={d}
                  className="rounded-md bg-[#0D2545]/10 px-1.5 py-0.5 font-semibold text-[#0D2545] dark:bg-[#C9A84C]/20 dark:text-[#C9A84C]"
                >
                  {DAY_FULL[d]}
                </span>
              ))}
            </div>
            <p className="mt-1 text-gray-500 dark:text-gray-400">
              {timeStart} – {timeEnd}
              {' · '}
              {sortedPreview.length === 1 ? '1 ngày/tuần'
                : sortedPreview.length === 2 ? '2 ngày/tuần'
                : `${sortedPreview.length} ngày/tuần`}
              {sortedPreview.length >= 2 && (
                <span className="ml-1 text-gray-400">
                  ({sortedPreview.map(d => DAY_SHORT[d]).join('-')})
                </span>
              )}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Giờ bắt đầu</label>
          <Input
            name="time_start"
            type="time"
            value={timeStart}
            onChange={e => setTimeStart(e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Giờ kết thúc</label>
          <Input
            name="time_end"
            type="time"
            value={timeEnd}
            onChange={e => setTimeEnd(e.target.value)}
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Sĩ số tối đa</label>
        <Input name="max_capacity" type="number" defaultValue={10} min={1} />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Trợ giảng phụ trách</label>
        <select
          name="assigned_staff_id"
          className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-700 dark:text-gray-200"
        >
          <option value="">Chưa phân công</option>
          {staffList.map(s => (
            <option key={s.id} value={s.id}>{s.full_name}</option>
          ))}
        </select>
      </div>

      <SubmitButton />
    </form>
  )
}
