import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Palette } from 'lucide-react'

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 border-b border-gray-100/80 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0D2545]">
            <Palette className="h-4 w-4 text-[#C9A84C]" />
          </div>
          <span className="text-base font-bold text-[#0D2545]">Lớp Vẽ Sáng Tạo</span>
        </Link>

        <div className="flex items-center gap-6">
          <Link
            href="/gallery"
            className="hidden text-sm font-medium text-gray-600 transition-colors hover:text-[#0D2545] sm:block"
          >
            Gallery
          </Link>
          <Link
            href="/about"
            className="hidden text-sm font-medium text-gray-600 transition-colors hover:text-[#0D2545] sm:block"
          >
            Về chúng tôi
          </Link>
          <Link href="#dang-ky">
            <Button className="bg-[#C9A84C] text-sm text-white hover:bg-[#C9A84C]/90">
              Đăng ký học thử
            </Button>
          </Link>
          <Link
            href="/auth/login"
            className="text-sm text-gray-400 transition-colors hover:text-[#0D2545]"
          >
            Đăng nhập
          </Link>
        </div>
      </div>
    </nav>
  )
}
