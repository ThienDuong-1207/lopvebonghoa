'use client'

import { useState } from 'react'
import AttendanceRow from './AttendanceRow'
import StaffMakeupSearchBox from './StaffMakeupSearchBox'
import type { Class, Student, Package, Session } from '@/lib/types/database'

type Status = 'present' | 'absent' | null

function formatTime(t: string) { return t.slice(0, 5) }

interface Props {
  classesForDay: Class[]
  students: Student[]
  packages: Package[]
  sessions: Session[]
  profileId: string
  selectedDateStr: string
  assignedClassIds: string[]
  initPresentCount: number
  initAbsentCount: number
  totalCount: number
}

export default function StaffAttendanceSection({
  classesForDay,
  students,
  packages,
  sessions,
  profileId,
  selectedDateStr,
  assignedClassIds,
  initPresentCount,
  initAbsentCount,
  totalCount: initTotalCount,
}: Props) {
  const [presentCount, setPresentCount] = useState(initPresentCount)
  const [absentCount, setAbsentCount] = useState(initAbsentCount)
  const [totalCount, setTotalCount] = useState(initTotalCount)
  const pendingCount = Math.max(0, totalCount - presentCount - absentCount)
  const assignedSet = new Set(assignedClassIds)

  function handleStatusChange(prev: Status, next: Status) {
    if (prev !== 'present' && next === 'present') setPresentCount((c) => c + 1)
    if (prev === 'present' && next !== 'present') setPresentCount((c) => c - 1)
    if (prev !== 'absent' && next === 'absent') setAbsentCount((c) => c + 1)
    if (prev === 'absent' && next !== 'absent') setAbsentCount((c) => c - 1)
  }

  function handleMakeupStatsChange(totalDelta: number, presentDelta: number, absentDelta: number) {
    setTotalCount((c) => c + totalDelta)
    setPresentCount((c) => c + presentDelta)
    setAbsentCount((c) => c + absentDelta)
  }

  const classesInfo = classesForDay.map((c) => ({ id: c.id, name: c.name }))

  return (
    <>
      {totalCount > 0 && (
        <div className="mb-3 grid grid-cols-4 gap-2">
          <div className="rounded-xl bg-white px-3 py-2.5 text-center shadow-sm">
            <div className="text-lg font-bold text-[#0D2545]">{totalCount}</div>
            <div className="text-[11px] text-gray-400">Tổng</div>
          </div>
          <div className="rounded-xl bg-emerald-50 px-3 py-2.5 text-center shadow-sm">
            <div className="text-lg font-bold text-emerald-600">{presentCount}</div>
            <div className="text-[11px] text-emerald-500">Có mặt</div>
          </div>
          <div className="rounded-xl bg-red-50 px-3 py-2.5 text-center shadow-sm">
            <div className="text-lg font-bold text-red-400">{absentCount}</div>
            <div className="text-[11px] text-red-400">Vắng</div>
          </div>
          <div className="rounded-xl bg-gray-50 px-3 py-2.5 text-center shadow-sm">
            <div className="text-lg font-bold text-gray-400">{pendingCount}</div>
            <div className="text-[11px] text-gray-400">Chưa</div>
          </div>
        </div>
      )}

      <StaffMakeupSearchBox
        classesForDay={classesInfo}
        sessionDate={selectedDateStr}
        profileId={profileId}
        onStatsChange={handleMakeupStatsChange}
      />

      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        {classesForDay.map((cls, clsIdx) => {
          const clsStudents = students.filter((s) => s.class_id === cls.id)
          if (clsStudents.length === 0) return null

          return (
            <div key={cls.id}>
              {clsIdx > 0 && <div className="h-px bg-gray-100" />}

              {classesForDay.length > 1 && (
                <div className="flex items-center gap-2 bg-gray-50/70 px-4 py-2">
                  <span className="text-xs font-semibold text-gray-500">{cls.name}</span>
                  <span className="text-xs text-gray-400">
                    {formatTime(cls.time_start)}–{formatTime(cls.time_end)}
                  </span>
                  {assignedSet.has(cls.id) && (
                    <span className="rounded-full bg-[#0D2545] px-1.5 py-0.5 text-[10px] font-semibold text-white">
                      Lớp của bạn
                    </span>
                  )}
                </div>
              )}

              <div className="divide-y divide-gray-100">
                {clsStudents.map((student: Student) => {
                  const pkg = packages.find((p) => p.student_id === student.id)
                  const session = sessions.find((s) => s.student_id === student.id)

                  return pkg ? (
                    <AttendanceRow
                      key={student.id}
                      student={student}
                      pkg={pkg}
                      session={session}
                      classId={cls.id}
                      sessionDate={selectedDateStr}
                      profileId={profileId}
                      onStatusChange={handleStatusChange}
                    />
                  ) : (
                    <div key={student.id} className="flex items-center justify-between px-4 py-3">
                      <span className="text-sm text-gray-600">{student.nickname ?? student.full_name}</span>
                      <span className="text-xs text-red-400">Hết gói</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}

        {students.length === 0 && (
          <div className="py-12 text-center text-sm text-gray-400">Chưa có học sinh nào</div>
        )}
      </div>
    </>
  )
}
