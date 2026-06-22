'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Check, X } from 'lucide-react'

interface Props {
  studentId: string
  packageId: string
  classId: string
  sessionDate: string
  profileId: string
  initialStatus: 'present' | 'absent' | null
  sessionId?: string
}

export default function CheckinButton({
  studentId,
  packageId,
  classId,
  sessionDate,
  profileId,
  initialStatus,
  sessionId: initialSessionId,
}: Props) {
  const [status, setStatus] = useState<'present' | 'absent' | null>(initialStatus)
  const [currentSessionId, setCurrentSessionId] = useState<string | undefined>(initialSessionId)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  async function select(next: 'present' | 'absent') {
    if (loading || status === next) return
    setLoading(true)
    try {
      if (currentSessionId) {
        const { error } = await supabase
          .from('sessions')
          .update({ status: next })
          .eq('id', currentSessionId)
        if (error) throw error
      } else {
        const { data, error } = await supabase
          .from('sessions')
          .insert({
            package_id:    packageId,
            student_id:    studentId,
            class_id:      classId,
            session_date:  sessionDate,
            checked_in_by: profileId,
            status:        next,
          })
          .select('id')
          .single()
        if (error) throw error
        setCurrentSessionId(data?.id)
      }
      setStatus(next)
      if (next === 'present') toast.success('Có mặt ✓')
      else toast('Vắng', { icon: '✗' })
    } catch {
      toast.error('Có lỗi, thử lại.')
    }
    setLoading(false)
  }

  const btnBase = 'flex h-11 w-11 items-center justify-center rounded-xl transition-all active:scale-95 disabled:opacity-40'

  return (
    <div className="flex shrink-0 gap-1.5">
      {/* Có mặt */}
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

      {/* Vắng */}
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
  )
}
