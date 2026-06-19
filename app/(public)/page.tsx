export const dynamic = 'force-dynamic'

import Link from 'next/link'
import RegisterForm from '@/components/public/RegisterForm'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/server'
import type { Slot } from '@/lib/types/database'

const DAY_SHORT = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']

const FEATURES = [
  {
    icon: '👥',
    title: 'Nhóm nhỏ tối đa 10 bé',
    desc: 'Giáo viên chú ý từng bé, không để bé nào bị bỏ lại phía sau.',
  },
  {
    icon: '🎨',
    title: 'Phương pháp sáng tạo',
    desc: 'Không copy mẫu — bé tự sáng tác, phát triển tư duy hình ảnh riêng.',
  },
  {
    icon: '⭐',
    title: 'Giáo viên giàu kinh nghiệm',
    desc: 'Hơn 5 năm dạy vẽ cho trẻ em, am hiểu tâm lý phát triển của bé.',
  },
]

export default async function HomePage() {
  const supabase = createClient()
  const { data: slots } = await supabase
    .from('slots')
    .select('*')
    .eq('is_active', true)
    .order('day_of_week')
    .order('time_start')

  return (
    <>
      {/* Hero */}
      <section className="bg-[#0D2545] py-24 text-center text-white">
        <div className="mx-auto max-w-3xl px-4">
          <h1 className="text-4xl font-bold leading-tight sm:text-5xl">
            Nơi bé khám phá<br />
            <span className="text-[#C9A84C]">thế giới màu sắc</span>
          </h1>
          <p className="mt-4 text-lg text-white/70">
            Lớp vẽ sáng tạo dành cho trẻ 4–8 tuổi. Mỗi buổi học là một cuộc phiêu lưu mới.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <a href="#dang-ky">
              <Button className="bg-[#C9A84C] px-8 py-3 text-base font-semibold text-white hover:bg-[#C9A84C]/90">
                Đăng ký học thử
              </Button>
            </a>
            <Link href="/gallery">
              <Button variant="outline" className="border-white/30 px-8 py-3 text-base text-white hover:bg-white/10">
                Xem Gallery
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Ưu điểm */}
      <section className="py-20">
        <div className="mx-auto max-w-5xl px-4">
          <h2 className="mb-12 text-center text-3xl font-bold text-[#0D2545]">
            Tại sao chọn chúng tôi?
          </h2>
          <div className="grid gap-8 sm:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="rounded-2xl border border-gray-100 p-6 text-center">
                <div className="mb-4 text-4xl">{f.icon}</div>
                <h3 className="mb-2 font-bold text-[#0D2545]">{f.title}</h3>
                <p className="text-sm text-gray-500">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Giá & Lịch học */}
      <section className="bg-gray-50 py-20">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="mb-4 text-3xl font-bold text-[#0D2545]">Học phí & Lịch học</h2>
          <div className="mb-8 inline-flex items-baseline gap-2">
            <span className="text-5xl font-bold text-[#0D2545]">1.200.000đ</span>
            <span className="text-gray-500">/gói 8 buổi</span>
          </div>
          <p className="mb-10 text-gray-500">Mỗi buổi học kéo dài 90 phút. Học phí bao gồm dụng cụ vẽ.</p>

          <h3 className="mb-4 font-semibold text-gray-700">Các ca học hiện có</h3>
          {(slots ?? []).length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {(slots ?? []).map((slot: Slot) => (
                <div key={slot.id} className="rounded-xl border border-[#C9A84C]/30 bg-white p-4 text-left">
                  <div className="font-semibold text-[#0D2545]">{slot.name}</div>
                  <div className="mt-1 text-sm text-gray-500">
                    {DAY_SHORT[slot.day_of_week]} · {slot.time_start.slice(0, 5)}–{slot.time_end.slice(0, 5)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400">Lịch học sẽ được cập nhật sớm.</p>
          )}
        </div>
      </section>

      {/* Form đăng ký */}
      <section id="dang-ky" className="py-20">
        <div className="mx-auto max-w-lg px-4">
          <RegisterForm />
        </div>
      </section>
    </>
  )
}
