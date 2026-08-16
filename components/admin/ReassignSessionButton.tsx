'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { ArrowRightLeft } from 'lucide-react'

interface Props {
  sessionId: string
  newPackageId: string
}

export default function ReassignSessionButton({ sessionId, newPackageId }: Props) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleClick() {
    setLoading(true)
    try {
      const { error } = await supabase.from('sessions').update({ package_id: newPackageId }).eq('id', sessionId)
      if (error) throw error
      toast.success('Đã gán lại buổi về đúng gói')
      router.refresh()
    } catch (e: unknown) {
      toast.error(`Lỗi: ${e instanceof Error ? e.message : 'không xác định'}`)
    }
    setLoading(false)
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="flex items-center gap-1 rounded-md bg-[#0D2545]/8 px-2 py-1 text-xs font-medium text-[#0D2545] hover:bg-[#0D2545]/15 disabled:opacity-50 dark:bg-[#C9A84C]/15 dark:text-[#C9A84C]"
    >
      <ArrowRightLeft className="h-3 w-3" />
      {loading ? 'Đang gán...' : 'Gán về gói đúng'}
    </button>
  )
}
