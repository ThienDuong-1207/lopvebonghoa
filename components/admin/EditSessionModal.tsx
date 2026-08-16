'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Pencil, X } from 'lucide-react'
import Btn from './Btn'

const STATUS_OPTIONS = [
  { value: 'present', label: 'Có mặt' },
  { value: 'absent', label: 'Vắng' },
  { value: 'makeup', label: 'Học bù' },
]

interface PackageOption {
  id: string
  label: string
}

interface Props {
  sessionId: string
  initialDate: string
  initialStatus: string
  initialPackageId: string
  packageOptions: PackageOption[]
}

export default function EditSessionModal({ sessionId, initialDate, initialStatus, initialPackageId, packageOptions }: Props) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [date, setDate] = useState(initialDate)
  const [status, setStatus] = useState(initialStatus)
  const [packageId, setPackageId] = useState(initialPackageId)
  const router = useRouter()
  const supabase = createClient()

  async function handleSave() {
    setLoading(true)
    try {
      const { error } = await supabase
        .from('sessions')
        .update({ session_date: date, status, package_id: packageId })
        .eq('id', sessionId)
      if (error) throw error
      toast.success('Đã cập nhật buổi điểm danh')
      setOpen(false)
      router.refresh()
    } catch (e: unknown) {
      toast.error(`Lỗi khi lưu: ${e instanceof Error ? e.message : 'không xác định'}`)
    }
    setLoading(false)
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title="Sửa buổi điểm danh"
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-gray-300 hover:bg-gray-100 hover:text-[#0D2545] dark:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-[#C9A84C]"
      >
        <Pencil className="h-3 w-3" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-800">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold text-gray-800 dark:text-gray-100">Sửa buổi điểm danh</h3>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">Ngày</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-700 dark:text-gray-200"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">Trạng thái</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-700 dark:text-gray-200"
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">Gói học</label>
                <select
                  value={packageId}
                  onChange={(e) => setPackageId(e.target.value)}
                  className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-700 dark:text-gray-200"
                >
                  {packageOptions.map((p) => (
                    <option key={p.id} value={p.id}>{p.label}</option>
                  ))}
                </select>
                <p className="mt-1 text-[11px] text-gray-400">Đổi gói ở đây nếu buổi này đang bị gắn nhầm.</p>
              </div>
            </div>

            <div className="mt-5 flex gap-2">
              <Btn variant="primary" className="flex-1" onClick={handleSave} disabled={loading}>
                {loading ? 'Đang lưu...' : 'Lưu'}
              </Btn>
              <Btn variant="outline" className="flex-1" onClick={() => setOpen(false)} disabled={loading}>
                Huỷ
              </Btn>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
