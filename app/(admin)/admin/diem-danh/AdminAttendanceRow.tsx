'use client'

import { useState } from 'react'
import AdminCheckinButton from './AdminCheckinButton'
import type { Student, Package, Session } from '@/lib/types/database'

interface Props {
  student: Student
  pkg: Package
  session: Session | undefined
  classId: string
  sessionDate: string
  profileId: string
}

export default function AdminAttendanceRow({ student, pkg, session, classId, sessionDate, profileId }: Props) {
  const [usedSessions, setUsedSessions] = useState(pkg.used_sessions)
  const initials = student.full_name.split(' ').map((w) => w[0]).slice(-2).join('').toUpperCase()

  return (
    <div className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/40">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[#0D2545]/10 text-sm font-semibold text-[#0D2545] dark:bg-[#C9A84C]/15 dark:text-[#C9A84C]">
          {initials}
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-medium text-gray-800 dark:text-gray-100">
              {student.nickname ?? student.full_name}
            </span>
            {student.nickname && (
              <span className="text-xs text-gray-400">({student.full_name})</span>
            )}
            {pkg.payment_status === 'pending' && (
              <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-900/40 dark:text-amber-400">
                Chờ thu
              </span>
            )}
          </div>
          <div className="text-xs text-gray-400">
            Buổi {usedSessions}/{pkg.total_sessions}
            {pkg.total_sessions - usedSessions <= 2 && (
              <span className="ml-1.5 font-medium text-red-400">
                · Còn {pkg.total_sessions - usedSessions}
              </span>
            )}
          </div>
        </div>
      </div>

      <AdminCheckinButton
        studentId={student.id}
        packageId={pkg.id}
        classId={classId}
        sessionDate={sessionDate}
        profileId={profileId}
        initialStatus={(session?.status as 'present' | 'absent' | 'makeup') ?? null}
        sessionId={session?.id}
        onCountChange={(delta) => setUsedSessions((u) => u + delta)}
      />
    </div>
  )
}
