'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { RotateCcw, ChevronDown, ChevronUp } from 'lucide-react'

export interface MakeupStudent {
  id: string
  full_name: string
  nickname: string | null
  class_id: string | null
  package_id: string
  used_sessions: number
  total_sessions: number
  alreadyDone: boolean
}

interface Props {
  students: MakeupStudent[]
  sessionDate: string
}

export default function MakeupCheckin({ students, sessionDate }: Props) {
  const [open, setOpen] = useState(false)
  const [done, setDone] = useState<Set<string>>(
    new Set(students.filter((s) => s.alreadyDone).map((s) => s.id))
  )
  const [loading, setLoading] = useState<string | null>(null)
  const supabase = createClient()

  async function handleMakeup(student: MakeupStudent) {
    if (loading || done.has(student.id)) return
    setLoading(student.id)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const { error } = await supabase.from('sessions').insert({
        package_id:    student.package_id,
        student_id:    student.id,
        class_id:      student.class_id,
        session_date:  sessionDate,
        checked_in_by: user?.id,
        status:        'makeup',
      })
      if (error) throw error
      setDone((prev) => new Set(prev).add(student.id))
      toast.success(`${student.nickname ?? student.full_name}: Đã ghi học bù`)
    } catch {
      toast.error('Có lỗi xảy ra, thử lại.')
    }
    setLoading(null)
  }

  if (students.length === 0) return null

  const pendingCount = students.filter((s) => !done.has(s.id)).length

  return (
    <div className="mt-6">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between rounded-xl bg-amber-50 px-4 py-3 text-left dark:bg-amber-900/20"
      >
        <div className="flex items-center gap-2">
          <RotateCcw className="h-4 w-4 text-amber-600" />
          <span className="font-medium text-amber-700 dark:text-amber-400">Học bù hôm nay</span>
          {pendingCount > 0 && (
            <span className="rounded-full bg-amber-200 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-800 dark:text-amber-300">
              {pendingCount}
            </span>
          )}
        </div>
        {open
          ? <ChevronUp className="h-4 w-4 text-amber-600" />
          : <ChevronDown className="h-4 w-4 text-amber-600" />}
      </button>

      {open && (
        <div className="mt-2 space-y-2">
          {students.map((s) => {
            const isDone = done.has(s.id)
            return (
              <div
                key={s.id}
                className="flex items-center justify-between rounded-xl bg-white p-3 shadow-sm dark:bg-gray-800"
              >
                <div>
                  <div className="font-medium text-gray-800 dark:text-gray-100">
                    {s.nickname ?? s.full_name}
                  </div>
                  <div className="text-xs text-gray-400">
                    Buổi {s.used_sessions}/{s.total_sessions}
                  </div>
                </div>
                {isDone ? (
                  <span className="rounded-full bg-amber-100 px-3 py-1.5 text-xs font-semibold text-amber-700 dark:bg-amber-900/40 dark:text-amber-400">
                    ↩ Đã ghi
                  </span>
                ) : (
                  <button
                    onClick={() => handleMakeup(s)}
                    disabled={loading === s.id}
                    className="flex items-center gap-1.5 rounded-full bg-amber-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-amber-600 disabled:opacity-60"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Học bù
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
