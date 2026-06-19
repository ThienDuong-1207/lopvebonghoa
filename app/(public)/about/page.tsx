import Link from 'next/link'
import { Button } from '@/components/ui/button'

const TEACHERS = [
  {
    name: 'Huyền',
    desc: 'Tốt nghiệp Đại học Mỹ thuật, hơn 5 năm kinh nghiệm dạy vẽ cho trẻ em. Yêu thích màu nước và tranh sáng tạo.',
  },
  {
    name: 'Hương',
    desc: 'Trợ giảng nhiều năm, đam mê giúp các bé khám phá nghệ thuật theo cách vui vẻ và tự nhiên nhất.',
  },
]

const FAQ = [
  {
    q: 'Lịch học như thế nào?',
    a: 'Lớp học tổ chức nhiều ca trong tuần, bao gồm cả buổi sáng và chiều tối. Bạn có thể chọn ca phù hợp khi đăng ký.',
  },
  {
    q: 'Cần mang gì đi học?',
    a: 'Học phí đã bao gồm toàn bộ dụng cụ (bút chì, màu, giấy vẽ). Bé chỉ cần mặc đồ thoải mái là được.',
  },
  {
    q: 'Bé mấy tuổi thì bắt đầu được?',
    a: 'Lớp nhận bé từ 4 tuổi. Ở độ tuổi này bé đã có thể cầm bút và bắt đầu thể hiện sáng tạo.',
  },
  {
    q: 'Một gói học gồm bao nhiêu buổi?',
    a: 'Một gói học gồm 8 buổi với học phí 1.200.000đ. Bé có thể đăng ký gia hạn liên tục.',
  },
]

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      {/* Giới thiệu lớp */}
      <section className="mb-16 text-center">
        <h1 className="text-3xl font-bold text-[#0D2545]">Về chúng tôi</h1>
        <p className="mx-auto mt-4 max-w-2xl text-gray-500">
          Lớp Vẽ Sáng Tạo được thành lập với một mục tiêu duy nhất: giúp trẻ em khám phá thế giới
          thông qua màu sắc và hình ảnh. Chúng tôi tin rằng mỗi đứa trẻ đều có một nghệ sĩ bên
          trong — nhiệm vụ của chúng tôi là giúp bé tìm thấy điều đó.
        </p>
      </section>

      {/* Giáo viên */}
      <section className="mb-16">
        <h2 className="mb-8 text-center text-2xl font-bold text-[#0D2545]">Đội ngũ giáo viên</h2>
        <div className="grid gap-6 sm:grid-cols-2">
          {TEACHERS.map((t) => (
            <div key={t.name} className="rounded-2xl border border-gray-100 p-6">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#0D2545]/10 text-2xl font-bold text-[#0D2545]">
                {t.name[0]}
              </div>
              <h3 className="text-lg font-bold text-[#0D2545]">{t.name}</h3>
              <p className="mt-2 text-sm text-gray-500">{t.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="mb-16">
        <h2 className="mb-8 text-center text-2xl font-bold text-[#0D2545]">Câu hỏi thường gặp</h2>
        <div className="space-y-4">
          {FAQ.map((item) => (
            <div key={item.q} className="rounded-xl border border-gray-100 p-5">
              <h3 className="font-semibold text-[#0D2545]">{item.q}</h3>
              <p className="mt-2 text-sm text-gray-500">{item.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <div className="rounded-2xl bg-[#0D2545] p-8 text-center text-white">
        <h3 className="text-xl font-bold">Sẵn sàng cho bé bắt đầu?</h3>
        <p className="mt-2 text-white/70">Đăng ký tư vấn miễn phí, chúng tôi sẽ liên hệ trong 24 giờ.</p>
        <Link href="/#dang-ky" className="mt-6 inline-block">
          <Button className="bg-[#C9A84C] px-8 py-3 text-white hover:bg-[#C9A84C]/90">
            Đăng ký ngay
          </Button>
        </Link>
      </div>
    </div>
  )
}
