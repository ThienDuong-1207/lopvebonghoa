'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { DAY_SHORT } from '@/lib/types/database'

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
  const [date, setDate] = useState(selectedDate)
  const [classId, setClassId] = useState(selectedClassId)

  // Sync khi searchParams thay đổi (navigate back/forward)
  useEffect(() => { setDate(selectedDate) }, [selectedDate])
  useEffect(() => { setClassId(selectedClassId) }, [selectedClassId])

  function navigate(d: string, c: string) {
    const params = new URLSearchParams()
    if (d) params.set('date', d)
    if (c) params.set('class_id', c)
    router.push(`/admin/diem-danh?${params.toString()}`)
  }

  return (
    <div className="mb-6 flex flex-wrap items-end gap-3">
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">Ngày</label>
        <input
          type="date"
          value={date}
          max={maxDate}
          onChange={(e) => {
            setDate(e.target.value)
            navigate(e.target.value, classId)
          }}
          className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
          Lớp học <span className="font-normal text-gray-400">(buổi diễn ra)</span>
        </label>
        <select
          value={classId}
          onChange={(e) => {
            setClassId(e.target.value)
            navigate(date, e.target.value)
          }}
          className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
        >
          <option value="">— Chọn lớp —</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} · {formatTime(c.time_start)}–{formatTime(c.time_end)} ({formatDays(c.days_of_week)})
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
