'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { CheckCircle2 } from 'lucide-react'

const CURRENT_YEAR = new Date().getFullYear()

export default function RegisterForm() {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [birthYear, setBirthYear] = useState('')
  const autoAge = birthYear ? CURRENT_YEAR - Number(birthYear) : null

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

    if (res.ok) setSuccess(true)
    else setError('Có lỗi xảy ra, vui lòng thử lại.')
    setLoading(false)
  }

  if (success) {
    return (
      <div className="rounded-2xl bg-white p-10 text-center shadow-2xl shadow-black/20">
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
    <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl bg-white p-8 shadow-2xl shadow-black/20">
      <h3 className="text-xl font-bold text-[#0D2545]">Đăng ký tư vấn miễn phí</h3>

      {/* ① Thông tin học viên */}
      <div className="overflow-hidden rounded-xl border border-gray-100">
        <div className="border-b border-gray-100 bg-gray-50/80 px-4 py-2.5">
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#0D2545] text-[11px] font-bold text-white">1</span>
            <span className="text-sm font-semibold text-gray-700">Thông tin học viên</span>
          </div>
        </div>
        <div className="space-y-3 p-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Tên học viên <span className="text-red-500">*</span>
            </label>
            <Input name="child_name" required placeholder="Nguyễn Văn An" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Năm sinh
              {autoAge !== null && (
                <span className="ml-1.5 text-xs font-normal text-[#C9A84C]">({autoAge} tuổi)</span>
              )}
            </label>
            <Input
              name="birth_year"
              type="number"
              min={CURRENT_YEAR - 18}
              max={CURRENT_YEAR - 2}
              placeholder="2018"
              value={birthYear}
              onChange={(e) => setBirthYear(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Ghi chú</label>
            <Textarea name="message" placeholder="Bé thích vẽ gì, dị ứng, sở thích..." rows={2} />
          </div>
        </div>
      </div>

      {/* ② Phụ huynh */}
      <div className="overflow-hidden rounded-xl border border-gray-100">
        <div className="border-b border-gray-100 bg-gray-50/80 px-4 py-2.5">
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#0D2545] text-[11px] font-bold text-white">2</span>
            <span className="text-sm font-semibold text-gray-700">Phụ huynh</span>
          </div>
        </div>
        <div className="space-y-3 p-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Tên phụ huynh <span className="text-red-500">*</span>
            </label>
            <Input name="parent_name" required placeholder="Nguyễn Thị B" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              SĐT liên lạc <span className="text-red-500">*</span>
            </label>
            <Input name="phone" required type="tel" placeholder="0901 234 567" />
          </div>
        </div>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <Button
        type="submit"
        disabled={loading}
        className="w-full bg-[#C9A84C] py-3 text-base font-semibold text-white hover:bg-[#C9A84C]/90"
      >
        {loading ? 'Đang gửi...' : 'Đăng ký tư vấn'}
      </Button>
    </form>
  )
}
