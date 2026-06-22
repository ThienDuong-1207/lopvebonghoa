'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Check, X } from 'lucide-react'
import type { Student, Package, Session } from '@/lib/types/database'

type Status = 'present' | 'absent' | null

// Session present/makeup đều cộng vào used_sessions
const countable = (s: Status) => (s === 'present' ? 1 : 0)

interface Props {
  student: Student
  pkg: Package
  session: Session | undefined
  classId: string
  sessionDate: string
  profileId: string
}

export default function AttendanceRow({ student, pkg, session, classId, sessionDate, profileId }: Props) {
  const initials = student.full_name.split(' ').map((w) => w[0]).slice(-2).join('').toUpperCase()

  const initStatus: Status = session?.status === 'makeup' ? 'present' : (session?.status as Status ?? null)
  const [status, setStatus] = useState<Status>(initStatus)
  const [sessionId, setSessionId] = useState<string | undefined>(session?.id)
  const [usedSessions, setUsedSessions] = useState(pkg.used_sessions)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  async function select(next: 'present' | 'absent') {
    if (loading || status === next) return
    setLoading(true)
    const prev = status
    try {
      if (sessionId) {
        const { error } = await supabase.from('sessions').update({ status: next }).eq('id', sessionId)
        if (error) throw error
      } else {
        const { data, error } = await supabase
          .from('sessions')
          .insert({
            package_id:    pkg.id,
            student_id:    student.id,
            class_id:      classId,
            session_date:  sessionDate,
            checked_in_by: profileId,
            status:        next,
          })
          .select('id')
          .single()
        if (error) throw error
        setSessionId(data?.id)
      }
      setStatus(next)
      setUsedSessions((u) => u + countable(next) - countable(prev))
      if (next === 'present') toast.success('Có mặt ✓')
      else toast('Vắng', { icon: '✗' })
    } catch {
      toast.error('Có lỗi, thử lại.')
    }
    setLoading(false)
  }

  const btnBase =
    'flex h-11 w-11 items-center justify-center rounded-xl transition-all active:scale-95 disabled:opacity-40'

  return (
    <div className="flex items-center justify-between px-4 py-3">
      {/* Left: avatar + info */}
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#0D2545]/10 text-sm font-semibold text-[#0D2545]">
          {initials}
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-medium text-gray-800">
              {student.nickname ?? student.full_name}
            </span>
            {student.nickname && (
              <span className="truncate text-xs text-gray-400">({student.full_name})</span>
            )}
            {pkg.payment_status === 'pending' && (
              <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">
                Chờ thu
              </span>
            )}
          </div>
          <div className="text-xs text-gray-400">
            Buổi {usedSessions}/{pkg.total_sessions}
          </div>
        </div>
      </div>

      {/* Right: buttons */}
      <div className="flex shrink-0 gap-1.5">
        <button
          onClick={() => select('present')}
          disabled={loading}
          aria-label="Có mặt"
          className={`${btnBase} ${
            status === 'present'
              ? 'bg-emerald-500 text-white shadow-sm'
              : 'bg-gray-100 text-gray-400 active:bg-emerald-100 active:text-emerald-600'
          }`}
        >
          <Check className="h-5 w-5" strokeWidth={2.5} />
        </button>
        <button
          onClick={() => select('absent')}
          disabled={loading}
          aria-label="Vắng"
          className={`${btnBase} ${
            status === 'absent'
              ? 'bg-red-400 text-white shadow-sm'
              : 'bg-gray-100 text-gray-400 active:bg-red-100 active:text-red-400'
          }`}
        >
          <X className="h-5 w-5" strokeWidth={2.5} />
        </button>
      </div>
    </div>
  )
}
