'use client'

import { useState } from 'react'
import { DAY_SHORT, formatDays } from '@/lib/types/database'
import type { Class } from '@/lib/types/database'

type ClassOption = Pick<Class, 'id' | 'name' | 'days_of_week' | 'time_start' | 'time_end'>

interface Props {
  classes: ClassOption[]
  defaultClassId?: string | null
  defaultAttendDays?: number[] | null
  selectClassName?: string
}

export default function ClassAndDaysPicker({ classes, defaultClassId, defaultAttendDays, selectClassName }: Props) {
  const [classId, setClassId] = useState(defaultClassId ?? '')

  const selectedClass = classes.find((c) => c.id === classId) ?? null
  const classDays = selectedClass?.days_of_week ?? []

  const [attendDays, setAttendDays] = useState<number[]>(() => {
    if (defaultAttendDays && defaultAttendDays.length > 0) return defaultAttendDays
    const cls = classes.find((c) => c.id === (defaultClassId ?? ''))
    return cls?.days_of_week ?? []
  })

  function handleClassChange(newId: string) {
    setClassId(newId)
    const newClass = classes.find((c) => c.id === newId)
    setAttendDays(newClass?.days_of_week ?? [])
  }

  function toggleDay(day: number) {
    setAttendDays((prev) => {
      if (prev.includes(day)) {
        return prev.length === 1 ? prev : prev.filter((d) => d !== day)
      }
      return [...prev, day]
    })
  }

  const selectCls = selectClassName ??
    'w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200'

  const sortedClassDays = [...classDays].sort((a, b) => (a === 0 ? 7 : a) - (b === 0 ? 7 : b))

  return (
    <div className="space-y-3">
      <select
        name="class_id"
        value={classId}
        onChange={(e) => handleClassChange(e.target.value)}
        className={selectCls}
      >
        <option value="">Chưa xếp lớp</option>
        {classes.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name} — {formatDays(c.days_of_week)} · {c.time_start.slice(0, 5)}–{c.time_end.slice(0, 5)}
          </option>
        ))}
      </select>

      {classDays.length > 1 && (
        <div>
          <p className="mb-1.5 text-xs text-gray-400">
            Ngày học trong tuần
            <span className="ml-1">(bỏ chọn ngày bé không học)</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {sortedClassDays.map((day) => (
              <button
                key={day}
                type="button"
                onClick={() => toggleDay(day)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  attendDays.includes(day)
                    ? 'bg-[#0D2545] text-white'
                    : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                }`}
              >
                {DAY_SHORT[day]}
              </button>
            ))}
          </div>
          {attendDays.map((d) => (
            <input key={d} type="hidden" name="attend_days" value={d} />
          ))}
        </div>
      )}

      {classDays.length === 1 &&
        classDays.map((d) => <input key={d} type="hidden" name="attend_days" value={d} />)}
    </div>
  )
}
