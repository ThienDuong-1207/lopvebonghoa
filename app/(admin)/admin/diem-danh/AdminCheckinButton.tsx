'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Check, X, RotateCcw } from 'lucide-react'

interface Props {
  studentId: string
  packageId: string
  classId: string
  sessionDate: string
  profileId: string
  initialStatus: 'present' | 'absent' | 'makeup' | null
  sessionId?: string
  onCountChange?: (delta: number) => void
}

const countable = (s: 'present' | 'absent' | 'makeup' | null) =>
  s === 'present' || s === 'makeup' ? 1 : 0

export default function AdminCheckinButton({
  studentId,
  packageId,
  classId,
  sessionDate,
  profileId,
  initialStatus,
  sessionId: initialSessionId,
  onCountChange,
}: Props) {
  const [status, setStatus] = useState<'present' | 'absent' | 'makeup' | null>(initialStatus)
  const [currentSessionId, setCurrentSessionId] = useState<string | undefined>(initialSessionId)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  async function handleCheckin(newStatus: 'present' | 'absent' | 'makeup') {
    if (loading) return
    setLoading(true)
    const prev = status
    try {
      if (status === newStatus && currentSessionId) {
        const { error } = await supabase.from('sessions').delete().eq('id', currentSessionId)
        if (error) throw error
        setStatus(null)
        setCurrentSessionId(undefined)
        onCountChange?.(-countable(prev))
        toast('Đã xóa điểm danh', { icon: '↩' })
      } else if (currentSessionId) {
        const { error } = await supabase
          .from('sessions')
          .update({ status: newStatus })
          .eq('id', currentSessionId)
        if (error) throw error
        setStatus(newStatus)
        onCountChange?.(countable(newStatus) - countable(prev))
        toast.success('Đã cập nhật')
      } else {
        const { data, error } = await supabase
          .from('sessions')
          .insert({
            package_id:    packageId,
            student_id:    studentId,
            class_id:      classId,
            session_date:  sessionDate,
            checked_in_by: profileId,
            status:        newStatus,
          })
          .select('id')
          .single()
        if (error) throw error
        setStatus(newStatus)
        setCurrentSessionId(data?.id)
        onCountChange?.(countable(newStatus) - countable(prev))
        toast.success(newStatus === 'present' ? 'Có mặt ✓' : newStatus === 'absent' ? 'Vắng mặt' : 'Học bù ↩')
      }
    } catch {
      toast.error('Có lỗi xảy ra, thử lại.')
    }
    setLoading(false)
  }

  const base = 'flex h-9 w-9 items-center justify-center rounded-full transition-all disabled:opacity-50'

  return (
    <div className="flex gap-1.5">
      <button
        onClick={() => handleCheckin('present')}
        disabled={loading}
        title="Có mặt"
        className={`${base} ${status === 'present' ? 'bg-emerald-500 text-white shadow-sm' : 'bg-gray-100 text-gray-400 hover:bg-emerald-100 hover:text-emerald-600'}`}
      >
        <Check className="h-4 w-4" strokeWidth={2.5} />
      </button>
      <button
        onClick={() => handleCheckin('absent')}
        disabled={loading}
        title="Vắng"
        className={`${base} ${status === 'absent' ? 'bg-red-400 text-white shadow-sm' : 'bg-gray-100 text-gray-400 hover:bg-red-100 hover:text-red-500'}`}
      >
        <X className="h-4 w-4" strokeWidth={2.5} />
      </button>
      <button
        onClick={() => handleCheckin('makeup')}
        disabled={loading}
        title="Học bù"
        className={`${base} ${status === 'makeup' ? 'bg-amber-500 text-white shadow-sm' : 'bg-gray-100 text-gray-400 hover:bg-amber-100 hover:text-amber-500'}`}
      >
        <RotateCcw className="h-4 w-4" />
      </button>
    </div>
  )
}
