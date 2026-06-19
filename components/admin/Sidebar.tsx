'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  CreditCard,
  Bell,
  CalendarDays,
  UserCog,
  LogOut,
} from 'lucide-react'

const NAV_ITEMS = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/hoc-sinh', label: 'Học sinh', icon: Users },
  { href: '/admin/dang-ky-moi', label: 'Đăng ký mới', icon: ClipboardList },
  { href: '/admin/thanh-toan', label: 'Thanh toán', icon: CreditCard },
  { href: '/admin/canh-bao', label: 'Cảnh báo', icon: Bell },
  { href: '/admin/lich-hoc', label: 'Lịch & Ca học', icon: CalendarDays },
  { href: '/admin/staff', label: 'Trợ giảng', icon: UserCog },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="flex h-screen w-56 flex-col bg-[#0D2545]">
      <div className="px-5 py-5">
        <span className="text-base font-bold text-white">Lớp Vẽ Sáng Tạo</span>
        <div className="mt-0.5 text-xs font-medium text-[#C9A84C]">Admin Panel</div>
      </div>

      <nav className="flex-1 space-y-0.5 px-3 py-2">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === '/admin'
              ? pathname === '/admin'
              : pathname.startsWith(item.href)
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors',
                isActive
                  ? 'bg-white/15 text-white'
                  : 'text-white/60 hover:bg-white/10 hover:text-white/90'
              )}
            >
              <Icon
                className={cn('h-4 w-4 shrink-0', isActive ? 'text-[#C9A84C]' : '')}
              />
              {item.label}
              {isActive && (
                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#C9A84C]" />
              )}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-white/10 px-3 py-4">
        <form action="/auth/signout" method="post">
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-white/55 transition-colors hover:bg-white/8 hover:text-white/90"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            Đăng xuất
          </button>
        </form>
      </div>
    </aside>
  )
}
