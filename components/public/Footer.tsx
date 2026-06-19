import { Palette, MapPin, Phone } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-[#0D2545]">
      <div className="mx-auto max-w-6xl px-4 py-14">
        <div className="grid gap-10 sm:grid-cols-3">
          {/* Brand */}
          <div className="sm:col-span-1">
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#C9A84C]/20">
                <Palette className="h-4 w-4 text-[#C9A84C]" />
              </div>
              <span className="font-bold text-white">Lớp Vẽ Sáng Tạo</span>
            </div>
            <p className="text-sm leading-relaxed text-white/50">
              Nơi bé khám phá thế giới màu sắc và phát triển tư duy sáng tạo.
            </p>
          </div>

          {/* Liên hệ */}
          <div>
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white/40">
              Liên hệ
            </h4>
            <div className="space-y-3">
              <div className="flex items-start gap-2.5 text-sm text-white/60">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#C9A84C]/60" />
                <span>Địa chỉ cơ sở (sẽ cập nhật)</span>
              </div>
              <div className="flex items-center gap-2.5 text-sm text-white/60">
                <Phone className="h-4 w-4 shrink-0 text-[#C9A84C]/60" />
                <span>Zalo: 0xxx xxx xxx</span>
              </div>
            </div>
          </div>

          {/* Khám phá */}
          <div>
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white/40">
              Khám phá
            </h4>
            <div className="space-y-2.5 text-sm">
              <a href="/gallery" className="block text-white/60 transition-colors hover:text-white">
                Gallery tác phẩm
              </a>
              <a href="/about" className="block text-white/60 transition-colors hover:text-white">
                Về chúng tôi
              </a>
              <a href="#dang-ky" className="block text-white/60 transition-colors hover:text-white">
                Đăng ký học thử
              </a>
            </div>
          </div>
        </div>

        <div className="mt-12 border-t border-white/10 pt-6 text-center text-xs text-white/30">
          © {new Date().getFullYear()} Lớp Vẽ Sáng Tạo. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
