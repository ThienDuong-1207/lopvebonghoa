import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 border-b border-gray-100 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/" className="text-lg font-bold text-[#0D2545]">
          Lớp Vẽ Sáng Tạo
        </Link>
        <div className="flex items-center gap-6">
          <Link href="/gallery" className="hidden text-sm font-medium text-gray-900 hover:text-[#0D2545] sm:block">
            Gallery
          </Link>
          <Link href="/about" className="hidden text-sm font-medium text-gray-900 hover:text-[#0D2545] sm:block">
            Về chúng tôi
          </Link>
          <Link href="#dang-ky">
            <Button className="bg-[#C9A84C] text-white hover:bg-[#C9A84C]/90">
              Đăng ký học thử
            </Button>
          </Link>
          <Link href="/auth/login" className="text-sm text-gray-500 hover:text-[#0D2545]">
            Đăng nhập
          </Link>
        </div>
      </div>
    </nav>
  )
}
