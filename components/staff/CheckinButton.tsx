'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Props {
  studentId: string
  packageId: string
  slotId: string
  sessionDate: string
  initialStatus: 'present' | 'absent' | null
  sessionId?: string
}

export default function CheckinButton({
  studentId,
  packageId,
  slotId,
  sessionDate,
  initialStatus,
  sessionId,
}: Props) {
  const [status, setStatus] = useState<'present' | 'absent' | null>(initialStatus)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  async function handleCheckin(newStatus: 'present' | 'absent') {
    if (loading) return
    setLoading(true)

    if (sessionId && status !== null) {
      // Undo: xoá session cũ
      await supabase.from('sessions').delete().eq('id', sessionId)
      setStatus(null)
    } else {
      const { data: { user } } = await supabase.auth.getUser()
      await supabase.from('sessions').insert({
        package_id: packageId,
        student_id: studentId,
        slot_id: slotId,
        session_date: sessionDate,
        checked_in_by: user?.id,
        status: newStatus,
      })
      setStatus(newStatus)
    }

    setLoading(false)
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={() => handleCheckin('present')}
        disabled={loading}
        className={`h-11 w-11 rounded-full text-lg font-bold transition-colors ${
          status === 'present'
            ? 'bg-green-500 text-white'
            : 'bg-gray-100 text-gray-400 hover:bg-green-100'
        }`}
        title="Có mặt"
      >
        ✓
      </button>
      <button
        onClick={() => handleCheckin('absent')}
        disabled={loading}
        className={`h-11 w-11 rounded-full text-lg font-bold transition-colors ${
          status === 'absent'
            ? 'bg-red-400 text-white'
            : 'bg-gray-100 text-gray-400 hover:bg-red-100'
        }`}
        title="Vắng"
      >
        ✗
      </button>
    </div>
  )
}
