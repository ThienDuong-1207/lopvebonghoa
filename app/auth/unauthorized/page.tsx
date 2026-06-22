import Link from 'next/link'
import { Button } from '@/components/ui/button'

const REASON_MSG: Record<string, string> = {
  no_code:      'Không nhận được mã xác thực từ Google.',
  session:      'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.',
  no_user:      'Không lấy được thông tin tài khoản Google.',
  no_profile:   'Email này chưa được thêm vào hệ thống. Vui lòng liên hệ Admin.',
  inactive:     'Tài khoản đã bị khóa. Vui lòng liên hệ Admin.',
  unknown_role: 'Vai trò tài khoản không hợp lệ.',
}

interface Props { searchParams: { reason?: string } }

export default function UnauthorizedPage({ searchParams }: Props) {
  const msg = REASON_MSG[searchParams.reason ?? ''] ?? 'Email này chưa được cấp quyền vào hệ thống. Vui lòng liên hệ Admin.'

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm rounded-xl border border-gray-200 bg-white p-8 text-center">
        <div className="mb-4 text-4xl">🔒</div>
        <h1 className="text-xl font-bold text-[#0D2545]">Không có quyền truy cập</h1>
        <p className="mt-3 text-sm text-gray-500">{msg}</p>
        {searchParams.reason && (
          <p className="mt-2 text-xs text-gray-300">Mã lỗi: {searchParams.reason}</p>
        )}
        <Link href="/auth/login" className="mt-6 block">
          <Button variant="outline" className="w-full">Thử lại</Button>
        </Link>
        <Link href="/" className="mt-3 block">
          <Button variant="ghost" className="w-full text-sm text-gray-400">Về trang chủ</Button>
        </Link>
      </div>
    </div>
  )
}
