'use client'

import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface Props {
  packageId: string
  studentId: string
  studentName: string
  sessionCount: number
  amountPaid: number
  paymentStatus: 'paid' | 'pending'
}

export default function DeletePackageButton({
  packageId,
  studentId,
  studentName,
  sessionCount,
  amountPaid,
  paymentStatus,
}: Props) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  async function handleDelete() {
    setLoading(true)
    try {
      // 1. Xóa tất cả sessions của gói này
      const { error: sessErr } = await supabase
        .from('sessions')
        .delete()
        .eq('package_id', packageId)
      if (sessErr) throw sessErr

      // 2. Xóa alerts chưa xử lý liên quan đến package (near_end, package_ended)
      await supabase
        .from('alerts')
        .delete()
        .eq('student_id', studentId)
        .in('type', ['near_end', 'package_ended'])
        .eq('resolved', false)

      // 3. Xóa package
      const { error: pkgErr } = await supabase
        .from('packages')
        .delete()
        .eq('id', packageId)
      if (pkgErr) throw pkgErr

      toast.success('Đã xóa gói học và toàn bộ dữ liệu liên quan')
      setOpen(false)
      window.location.reload()
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Lỗi không xác định'
      toast.error(`Xóa thất bại: ${msg}`)
    }
    setLoading(false)
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title="Xóa gói học"
        className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-300 transition-colors hover:bg-red-50 hover:text-red-500 dark:text-gray-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-800">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
              <Trash2 className="h-5 w-5 text-red-500" />
            </div>
            <h3 className="mb-1 font-semibold text-gray-800 dark:text-gray-100">Xóa gói học?</h3>
            <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
              Gói của <strong>{studentName}</strong> sẽ bị xóa vĩnh viễn cùng với:
            </p>
            <ul className="mb-5 space-y-1.5 rounded-xl bg-red-50 px-4 py-3 dark:bg-red-900/20">
              <li className="flex items-center gap-2 text-sm text-red-700 dark:text-red-400">
                <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
                <strong>{sessionCount}</strong> buổi điểm danh
              </li>
              {paymentStatus === 'paid' && amountPaid > 0 && (
                <li className="flex items-center gap-2 text-sm text-red-700 dark:text-red-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
                  Doanh thu <strong>{amountPaid.toLocaleString('vi-VN')}đ</strong>
                </li>
              )}
              <li className="flex items-center gap-2 text-sm text-red-700 dark:text-red-400">
                <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
                Cảnh báo liên quan (nếu có)
              </li>
            </ul>
            <p className="mb-5 text-xs text-gray-400">Hành động này không thể hoàn tác.</p>
            <div className="flex gap-2">
              <button
                onClick={handleDelete}
                disabled={loading}
                className="flex-1 rounded-lg bg-red-500 py-2.5 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-50"
              >
                {loading ? 'Đang xóa...' : 'Xóa vĩnh viễn'}
              </button>
              <button
                onClick={() => setOpen(false)}
                disabled={loading}
                className="flex-1 rounded-lg border border-gray-200 py-2.5 text-sm text-gray-500 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
