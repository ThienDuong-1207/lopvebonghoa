'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import Btn from '@/components/admin/Btn'

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
      window.location.reload()
    } catch {
      toast.error('Có lỗi xảy ra, thử lại.')
    }
    setLoading(false)
  }

  return (
    <>
      <Btn variant="gold" size="xs" onClick={() => setOpen(true)}>Thu tiền</Btn>

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
                <Btn type="submit" variant="success" className="flex-1" disabled={loading}>
                  {loading ? 'Đang lưu...' : 'Xác nhận thu tiền'}
                </Btn>
                <Btn type="button" variant="outline" className="flex-1" onClick={() => setOpen(false)}>
                  Hủy
                </Btn>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
