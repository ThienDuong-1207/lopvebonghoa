export const dynamic = 'force-dynamic'

import Link from 'next/link'
import RegisterForm from '@/components/public/RegisterForm'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/server'
import { Users, Palette, Award, Clock, Brush, Star } from 'lucide-react'
import type { Class } from '@/lib/types/database'
import { formatDays } from '@/lib/types/database'

const FEATURES = [
  {
    icon: Users,
    title: 'Nhóm nhỏ tối đa 10 bé',
    desc: 'Giáo viên chú ý từng bé, không để bé nào bị bỏ lại phía sau.',
    color: 'bg-blue-50 text-blue-600',
  },
  {
    icon: Palette,
    title: 'Phương pháp sáng tạo',
    desc: 'Không copy mẫu — bé tự sáng tác, phát triển tư duy hình ảnh riêng.',
    color: 'bg-amber-50 text-[#C9A84C]',
  },
  {
    icon: Award,
    title: 'Giáo viên giàu kinh nghiệm',
    desc: 'Hơn 5 năm dạy vẽ cho trẻ em, am hiểu tâm lý phát triển của bé.',
    color: 'bg-green-50 text-green-600',
  },
]

const STATS = [
  { value: '5+', label: 'Năm kinh nghiệm' },
  { value: '200+', label: 'Bé đã học' },
  { value: '10', label: 'Bé / lớp' },
  { value: '90\'', label: 'Mỗi buổi học' },
]

export default async function HomePage() {
  const supabase = createClient()
  const { data: classes } = await supabase
    .from('classes')
    .select('id, name, days_of_week, time_start, time_end')
    .eq('is_active', true)
    .order('time_start')
    .order('name')

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-[#0D2545]">
        {/* Decorative circles */}
        <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-[#C9A84C]/10" />
        <div className="pointer-events-none absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-white/5" />

        <div className="relative mx-auto max-w-4xl px-4 py-28 text-center text-white">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#C9A84C]/30 bg-[#C9A84C]/10 px-4 py-1.5">
            <Star className="h-3.5 w-3.5 text-[#C9A84C]" />
            <span className="text-xs font-medium text-[#C9A84C]">Dành cho trẻ 4–8 tuổi</span>
          </div>

          <h1 className="text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
            Nơi bé khám phá
            <br />
            <span className="text-[#C9A84C]">thế giới màu sắc</span>
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-white/65">
            Lớp vẽ sáng tạo nơi mỗi buổi học là một cuộc phiêu lưu. Bé tự sáng tác,
            tự khám phá — không copy mẫu.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <a href="#dang-ky">
              <Button className="bg-[#C9A84C] px-8 py-3 text-base font-semibold text-white hover:bg-[#C9A84C]/90">
                Đăng ký học thử miễn phí
              </Button>
            </a>
            <Link href="/gallery">
              <Button
                variant="outline"
                className="border-white/25 bg-transparent px-8 py-3 text-base text-white hover:bg-white/10"
              >
                Xem tác phẩm của bé
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats bar */}
        <div className="border-t border-white/10 bg-white/5">
          <div className="mx-auto grid max-w-4xl grid-cols-4 divide-x divide-white/10 px-4">
            {STATS.map(({ value, label }) => (
              <div key={label} className="py-5 text-center">
                <div className="text-2xl font-bold text-[#C9A84C]">{value}</div>
                <div className="mt-0.5 text-xs text-white/50">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Ưu điểm */}
      <section className="py-24">
        <div className="mx-auto max-w-5xl px-4">
          <div className="mb-4 text-center text-sm font-semibold uppercase tracking-widest text-[#C9A84C]">
            Tại sao chọn chúng tôi
          </div>
          <h2 className="mb-14 text-center text-3xl font-bold text-[#0D2545]">
            Học vẽ đúng cách — phát triển toàn diện
          </h2>
          <div className="grid gap-6 sm:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, desc, color }) => (
              <div
                key={title}
                className="rounded-2xl border border-gray-100 bg-white p-7 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className={`mb-5 inline-flex rounded-xl p-3 ${color}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="mb-2 font-bold text-[#0D2545]">{title}</h3>
                <p className="text-sm leading-relaxed text-gray-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Học phí & Lịch học */}
      <section className="bg-slate-50 py-24">
        <div className="mx-auto max-w-4xl px-4">
          <div className="mb-4 text-center text-sm font-semibold uppercase tracking-widest text-[#C9A84C]">
            Học phí
          </div>
          <h2 className="mb-6 text-center text-3xl font-bold text-[#0D2545]">
            Minh bạch, đơn giản
          </h2>

          {/* Pricing card */}
          <div className="mx-auto mb-14 max-w-sm rounded-2xl border-2 border-[#C9A84C]/30 bg-white p-8 text-center shadow-sm">
            <div className="mb-1 text-sm font-medium text-gray-400">Gói học phí</div>
            <div className="my-4 flex items-baseline justify-center gap-1">
              <span className="text-5xl font-bold text-[#0D2545]">1.200.000</span>
              <span className="text-xl text-gray-400">đ</span>
            </div>
            <div className="mb-6 text-sm text-gray-500">cho 8 buổi học</div>
            <div className="space-y-2.5 text-left">
              {[
                { icon: Clock, text: 'Mỗi buổi 90 phút' },
                { icon: Brush, text: 'Bao gồm dụng cụ vẽ' },
                { icon: Users, text: 'Lớp tối đa 10 bé' },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-3 text-sm text-gray-600">
                  <Icon className="h-4 w-4 shrink-0 text-[#C9A84C]" />
                  {text}
                </div>
              ))}
            </div>
          </div>

          {/* Lịch học */}
          <h3 className="mb-5 text-center text-lg font-semibold text-[#0D2545]">
            Các ca học hiện có
          </h3>
          {(classes ?? []).length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {(classes ?? []).map((cls: Pick<Class, 'id' | 'name' | 'days_of_week' | 'time_start' | 'time_end'>) => (
                <div
                  key={cls.id}
                  className="flex items-center gap-4 rounded-xl border border-[#C9A84C]/20 bg-white px-5 py-4 shadow-sm"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#C9A84C]/10 text-sm font-bold text-[#C9A84C]">
                    {cls.days_of_week.length === 1
                      ? ['CN','T2','T3','T4','T5','T6','T7'][cls.days_of_week[0]]
                      : `${cls.days_of_week.length}N`}
                  </div>
                  <div>
                    <div className="font-semibold text-[#0D2545]">{cls.name}</div>
                    <div className="mt-0.5 text-xs text-gray-400">
                      {formatDays(cls.days_of_week)} · {cls.time_start.slice(0, 5)}–{cls.time_end.slice(0, 5)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-400">Lịch học sẽ được cập nhật sớm.</p>
          )}
        </div>
      </section>

      {/* Form đăng ký */}
      <section id="dang-ky" className="relative overflow-hidden bg-[#0D2545] py-24">
        {/* Decorative circles — echo hero */}
        <div className="pointer-events-none absolute -left-20 -top-20 h-72 w-72 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute -bottom-16 -right-16 h-64 w-64 rounded-full bg-[#C9A84C]/10" />

        <div className="relative mx-auto max-w-lg px-4">
          <div className="mb-4 text-center text-sm font-semibold uppercase tracking-widest text-[#C9A84C]">
            Đăng ký
          </div>
          <h2 className="mb-10 text-center text-3xl font-bold text-white">
            Bắt đầu hành trình sáng tạo
          </h2>
          <RegisterForm />
        </div>
      </section>
    </>
  )
}
