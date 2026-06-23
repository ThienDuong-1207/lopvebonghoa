'use client'

import { useState } from 'react'
import AdminAttendanceRow from './AdminAttendanceRow'
import type { Class, Student, Package, Session } from '@/lib/types/database'
import { formatDays } from '@/lib/types/database'

type FullStatus = 'present' | 'absent' | 'makeup' | null

function formatTime(t: string) { return t.slice(0, 5) }

interface Props {
  selectedClass: Class
  selectedClassId: string
  selectedDate: string
  students: Student[]
  packages: Package[]
  sessions: Session[]
  profileId: string
  initPresentCount: number
  initAbsentCount: number
}

export default function AdminAttendanceSection({
  selectedClass,
  selectedClassId,
  selectedDate,
  students,
  packages,
  sessions,
  profileId,
  initPresentCount,
  initAbsentCount,
}: Props) {
  const [presentCount, setPresentCount] = useState(initPresentCount)
  const [absentCount, setAbsentCount] = useState(initAbsentCount)
  const pendingCount = Math.max(0, students.length - presentCount - absentCount)

  function handleStatusChange(prev: FullStatus, next: FullStatus) {
    const wasPresent = prev === 'present' || prev === 'makeup'
    const isPresent = next === 'present' || next === 'makeup'
    const wasAbsent = prev === 'absent'
    const isAbsent = next === 'absent'

    if (!wasPresent && isPresent) setPresentCount((c) => c + 1)
    if (wasPresent && !isPresent) setPresentCount((c) => c - 1)
    if (!wasAbsent && isAbsent) setAbsentCount((c) => c + 1)
    if (wasAbsent && !isAbsent) setAbsentCount((c) => c - 1)
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 px-5 py-4 dark:border-gray-700">
        <div>
          <h2 className="font-semibold text-gray-800 dark:text-gray-100">{selectedClass.name}</h2>
          <p className="text-xs text-gray-400">
            {selectedDate} · {formatDays(selectedClass.days_of_week)} · {formatTime(selectedClass.time_start)}–{formatTime(selectedClass.time_end)}
          </p>
        </div>
        <div className="flex gap-5 text-center">
          <div>
            <div className="text-lg font-bold text-emerald-600">{presentCount}</div>
            <div className="text-xs text-gray-400">Có mặt</div>
          </div>
          <div>
            <div className="text-lg font-bold text-red-400">{absentCount}</div>
            <div className="text-xs text-gray-400">Vắng</div>
          </div>
          <div>
            <div className="text-lg font-bold text-gray-400">{pendingCount}</div>
            <div className="text-xs text-gray-400">Chưa</div>
          </div>
        </div>
      </div>

      <div className="divide-y divide-gray-100 dark:divide-gray-700">
        {students.length === 0 ? (
          <div className="py-12 text-center text-sm text-gray-400">Chưa có học sinh trong lớp này</div>
        ) : students.map((student: Student) => {
          const pkg = packages.find((p: Package) => p.student_id === student.id)
          const session = sessions.find((s: Session) => s.student_id === student.id)

          return pkg ? (
            <AdminAttendanceRow
              key={student.id}
              student={student}
              pkg={pkg}
              session={session}
              classId={selectedClassId}
              sessionDate={selectedDate}
              profileId={profileId}
              onStatusChange={handleStatusChange}
            />
          ) : (
            <div key={student.id} className="flex items-center justify-between px-5 py-3">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                {student.nickname ?? student.full_name}
              </span>
              <span className="text-xs text-red-400">Chưa có gói học</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
