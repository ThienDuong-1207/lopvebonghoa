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

  async function handleCheckin(newStatus: 'present' | 'absent') {
    if (loading) return
    setLoading(true)

    try {
      if (status === newStatus && currentSessionId) {
        // Bấm lại cùng trạng thái → huỷ
        const { error } = await supabase.from('sessions').delete().eq('id', currentSessionId)
        if (error) throw error
        setStatus(null)
        setCurrentSessionId(undefined)
        toast('Đã huỷ điểm danh', { icon: '↩' })
      } else if (currentSessionId) {
        // Đổi trạng thái (present ↔ absent)
        const { error } = await supabase
          .from('sessions')
          .update({ status: newStatus })
          .eq('id', currentSessionId)
        if (error) throw error
        setStatus(newStatus)
        toast.success(newStatus === 'present' ? 'Đã cập nhật: Có mặt' : 'Đã cập nhật: Vắng mặt')
      } else {
        // Chưa có session → tạo mới
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
        toast.success(newStatus === 'present' ? 'Có mặt ✓' : 'Vắng mặt đã ghi nhận')
      }
    } catch {
      toast.error('Có lỗi xảy ra, thử lại.')
    }

    setLoading(false)
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={() => handleCheckin('present')}
        disabled={loading}
        className={`flex h-11 w-11 items-center justify-center rounded-full text-sm font-bold transition-all ${
          status === 'present'
            ? 'bg-emerald-500 text-white shadow-sm'
            : 'bg-gray-100 text-gray-400 hover:bg-emerald-100 hover:text-emerald-600'
        }`}
        title="Có mặt"
      >
        <Check className="h-5 w-5" strokeWidth={2.5} />
      </button>
      <button
        onClick={() => handleCheckin('absent')}
        disabled={loading}
        className={`flex h-11 w-11 items-center justify-center rounded-full text-sm font-bold transition-all ${
          status === 'absent'
            ? 'bg-red-400 text-white shadow-sm'
            : 'bg-gray-100 text-gray-400 hover:bg-red-100 hover:text-red-500'
        }`}
        title="Vắng"
      >
        <X className="h-5 w-5" strokeWidth={2.5} />
      </button>
    </div>
  )
}
