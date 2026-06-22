'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface Props { packageId: string }

export default function MarkPaidButton({ packageId }: Props) {
  const [open, setOpen] = useState(false)
  const [amount, setAmount] = useState('1200000')
  const [paidAt, setPaidAt] = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const { data: profile } = await supabase
        .from('profiles').select('id').eq('auth_user_id', user!.id).maybeSingle()

      const { error } = await supabase.from('packages').update({
        payment_status: 'paid',
        amount_paid:    Number(amount),
        paid_at:        paidAt,
        marked_paid_by: profile?.id ?? null,
      }).eq('id', packageId)

      if (error) throw error
      toast.success('Đã ghi nhận thanh toán!')
      setOpen(false)
      // Reload to refresh list
      window.location.reload()
    } catch {
      toast.error('Có lỗi xảy ra, thử lại.')
    }
    setLoading(false)
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg bg-amber-500 px-2.5 py-1 text-xs font-semibold text-white hover:bg-amber-600"
      >
        Thu tiền
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-800">
            <h3 className="mb-4 font-semibold text-gray-800 dark:text-gray-100">Ghi nhận thanh toán</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Ngày thu</label>
                <input
                  type="date"
                  value={paidAt}
                  onChange={(e) => setPaidAt(e.target.value)}
                  required
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Số tiền (VNĐ)</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  min={0}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
                />
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 rounded-lg bg-emerald-500 py-2 text-sm font-semibold text-white hover:bg-emerald-600 disabled:opacity-50"
                >
                  {loading ? 'Đang lưu...' : 'Xác nhận thu tiền'}
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex-1 rounded-lg border border-gray-200 py-2 text-sm text-gray-500 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700"
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
