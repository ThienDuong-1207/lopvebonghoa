'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { href: '/admin', label: 'Dashboard', icon: '🏠' },
  { href: '/admin/hoc-sinh', label: 'Học sinh', icon: '👦' },
  { href: '/admin/dang-ky-moi', label: 'Đăng ký mới', icon: '📋' },
  { href: '/admin/thanh-toan', label: 'Thanh toán', icon: '💰' },
  { href: '/admin/canh-bao', label: 'Cảnh báo', icon: '🔔' },
  { href: '/admin/lich-hoc', label: 'Lịch & Ca học', icon: '📅' },
  { href: '/admin/staff', label: 'Trợ giảng', icon: '👩‍🏫' },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="flex h-screen w-60 flex-col border-r border-gray-200 bg-[#0D2545]">
      <div className="px-6 py-5">
        <span className="text-lg font-bold text-white">Lớp Vẽ Sáng Tạo</span>
        <span className="ml-2 text-xs text-[#C9A84C]">Admin</span>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-2">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === '/admin'
              ? pathname === '/admin'
              : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors',
                isActive
                  ? 'bg-white/10 text-white'
                  : 'text-white/60 hover:bg-white/5 hover:text-white'
              )}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-white/10 px-3 py-4">
        <form action="/auth/signout" method="post">
          <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-white/60 hover:bg-white/5 hover:text-white">
            <span>🚪</span> Đăng xuất
          </button>
        </form>
      </div>
    </aside>
  )
}
