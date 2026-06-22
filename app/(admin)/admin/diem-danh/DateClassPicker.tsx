'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { DAY_SHORT } from '@/lib/types/database'
import Btn from '@/components/admin/Btn'

interface ClassOption {
  id: string
  name: string
  days_of_week: number[]
  time_start: string
  time_end: string
}

interface Props {
  classes: ClassOption[]
  selectedDate: string
  selectedClassId: string
  maxDate: string
}

function formatTime(t: string) { return t.slice(0, 5) }
function formatDays(days: number[]) {
  return [...days].sort((a, b) => a - b).map((d) => DAY_SHORT[d]).join(', ')
}

export default function DateClassPicker({ classes, selectedDate, selectedClassId, maxDate }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [date, setDate] = useState(selectedDate)
  const [classId, setClassId] = useState(selectedClassId)

  useEffect(() => { setDate(selectedDate) }, [selectedDate])
  useEffect(() => { setClassId(selectedClassId) }, [selectedClassId])

  function navigate(d: string, c: string) {
    const params = new URLSearchParams()
    if (d) params.set('date', d)
    if (c) params.set('class_id', c)
    startTransition(() => {
      router.push(`/admin/diem-danh?${params.toString()}`)
    })
  }

  const inputCls = 'rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 disabled:opacity-60'

  return (
    <div className="mb-6 flex flex-wrap items-end gap-3">
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">Ngày</label>
        <input
          type="date"
          value={date}
          max={maxDate}
          disabled={isPending}
          onChange={(e) => {
            setDate(e.target.value)
            navigate(e.target.value, classId)
          }}
          className={inputCls}
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
          Lớp học <span className="font-normal text-gray-400">(buổi diễn ra)</span>
        </label>
        <select
          value={classId}
          disabled={isPending}
          onChange={(e) => {
            setClassId(e.target.value)
            navigate(date, e.target.value)
          }}
          className={inputCls}
        >
          <option value="">— Chọn lớp —</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} · {formatTime(c.time_start)}–{formatTime(c.time_end)} ({formatDays(c.days_of_week)})
            </option>
          ))}
        </select>
      </div>

      <Btn disabled={isPending} onClick={() => navigate(date, classId)}>
        {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
        {isPending ? 'Đang tải...' : 'Xem'}
      </Btn>
    </div>
  )
}
