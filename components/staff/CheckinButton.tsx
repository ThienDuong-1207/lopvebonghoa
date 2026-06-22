'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Check } from 'lucide-react'

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

  async function toggle() {
    if (loading) return
    setLoading(true)

    const nextStatus = status === 'present' ? 'absent' : 'present'

    try {
      if (currentSessionId) {
        const { error } = await supabase
          .from('sessions')
          .update({ status: nextStatus })
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
            status:        nextStatus,
          })
          .select('id')
          .single()
        if (error) throw error
        setCurrentSessionId(data?.id)
      }

      setStatus(nextStatus)
      if (nextStatus === 'present') {
        toast.success('Có mặt ✓')
      } else {
        toast('Đã ghi nhận vắng', { icon: '✗' })
      }
    } catch {
      toast.error('Có lỗi xảy ra, thử lại.')
    }

    setLoading(false)
  }

  const isPresent = status === 'present'

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`flex min-w-[90px] items-center justify-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-all disabled:opacity-60 ${
        isPresent
          ? 'bg-emerald-500 text-white shadow-sm'
          : status === 'absent'
          ? 'bg-red-100 text-red-400 hover:bg-emerald-100 hover:text-emerald-600'
          : 'bg-gray-100 text-gray-400 hover:bg-emerald-100 hover:text-emerald-600'
      }`}
      title={isPresent ? 'Bấm để đánh dấu vắng' : 'Bấm để điểm danh'}
    >
      {isPresent && <Check className="h-4 w-4" strokeWidth={2.5} />}
      {isPresent ? 'Có mặt' : status === 'absent' ? 'Vắng' : 'Chưa điểm'}
    </button>
  )
}
