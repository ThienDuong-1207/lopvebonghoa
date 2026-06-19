'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { CheckCircle2 } from 'lucide-react'

export default function RegisterForm() {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const formData = new FormData(e.currentTarget)

    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(Object.fromEntries(formData)),
    })

    if (res.ok) {
      setSuccess(true)
    } else {
      setError('Có lỗi xảy ra, vui lòng thử lại.')
    }
    setLoading(false)
  }

  if (success) {
    return (
      <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-50">
          <CheckCircle2 className="h-7 w-7 text-green-500" />
        </div>
        <h3 className="text-xl font-bold text-[#0D2545]">Đăng ký thành công!</h3>
        <p className="mt-2 text-sm text-gray-500">
          Chúng tôi sẽ liên hệ với bạn qua Zalo trong vòng 24 giờ.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl bg-white p-8 shadow-sm">
      <h3 className="mb-6 text-xl font-bold text-[#0D2545]">Đăng ký tư vấn miễn phí</h3>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Tên con *</label>
            <Input name="child_name" required placeholder="Bé An" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Tuổi</label>
            <Input name="child_age" type="number" min={3} max={12} placeholder="6" />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Tên phụ huynh *</label>
          <Input name="parent_name" required placeholder="Nguyễn Thị B" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">SĐT Zalo *</label>
          <Input name="phone" required type="tel" placeholder="0901 234 567" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Ca học mong muốn</label>
          <Input name="preferred_slot" placeholder="VD: Thứ 7 sáng, cuối tuần..." />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Tin nhắn</label>
          <Textarea name="message" placeholder="Bé thích vẽ gì, muốn học thử không..." />
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-[#C9A84C] py-3 text-base font-semibold text-white hover:bg-[#C9A84C]/90"
        >
          {loading ? 'Đang gửi...' : 'Đăng ký tư vấn'}
        </Button>
      </div>
    </form>
  )
}
