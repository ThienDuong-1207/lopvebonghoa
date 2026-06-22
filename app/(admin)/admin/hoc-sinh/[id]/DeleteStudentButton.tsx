'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Trash2 } from 'lucide-react'
import Btn from '@/components/admin/Btn'

interface Props {
  studentId: string
  studentName: string
  packageCount: number
  sessionCount: number
}

export default function DeleteStudentButton({ studentId, studentName, packageCount, sessionCount }: Props) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleDelete() {
    setLoading(true)
    try {
      const { error: sessErr } = await supabase.from('sessions').delete().eq('student_id', studentId)
      if (sessErr) throw sessErr

      const { error: alertErr } = await supabase.from('alerts').delete().eq('student_id', studentId)
      if (alertErr) throw alertErr

      const { error: pkgErr } = await supabase.from('packages').delete().eq('student_id', studentId)
      if (pkgErr) throw pkgErr

      const { error: stuErr } = await supabase.from('students').delete().eq('id', studentId)
      if (stuErr) throw stuErr

      toast.success('Đã xóa học sinh')
      router.push('/admin/hoc-sinh')
    } catch (e: unknown) {
      toast.error(`Không thể xóa: ${e instanceof Error ? e.message : 'Lỗi không xác định'}`)
      setLoading(false)
    }
  }

  return (
    <>
      <Btn variant="danger" size="xs" onClick={() => setOpen(true)}>
        <Trash2 className="h-3.5 w-3.5" /> Xóa
      </Btn>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white shadow-xl dark:bg-gray-800">
            <div className="border-b border-gray-100 px-5 py-4 dark:border-gray-700">
              <h3 className="font-semibold text-gray-800 dark:text-gray-100">Xóa học sinh</h3>
            </div>
            <div className="px-5 py-4 text-sm text-gray-600 dark:text-gray-300">
              <p>Bạn sắp xóa <strong className="text-gray-800 dark:text-gray-100">{studentName}</strong>.</p>
              {(packageCount > 0 || sessionCount > 0) && (
                <div className="mt-3 rounded-xl bg-red-50 px-4 py-3 text-xs text-red-700 dark:bg-red-900/20 dark:text-red-400">
                  <p className="font-semibold">Dữ liệu sẽ bị xóa vĩnh viễn:</p>
                  <ul className="mt-1 list-inside list-disc space-y-0.5">
                    {packageCount > 0 && <li>{packageCount} gói học</li>}
                    {sessionCount > 0 && <li>{sessionCount} buổi điểm danh</li>}
                    <li>Toàn bộ cảnh báo liên quan</li>
                  </ul>
                </div>
              )}
              <p className="mt-3 text-xs text-gray-400">Thông tin phụ huynh sẽ được giữ lại.</p>
            </div>
            <div className="flex justify-end gap-2 border-t border-gray-100 px-5 py-3 dark:border-gray-700">
              <Btn variant="outline" size="sm" onClick={() => setOpen(false)} disabled={loading}>Hủy</Btn>
              <Btn variant="danger" size="sm" onClick={handleDelete} disabled={loading}>
                <Trash2 className="h-3.5 w-3.5" />
                {loading ? 'Đang xóa...' : 'Xóa vĩnh viễn'}
              </Btn>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
