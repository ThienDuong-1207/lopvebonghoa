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
  Palette,
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
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#C9A84C]/20">
          <Palette className="h-4 w-4 text-[#C9A84C]" />
        </div>
        <div>
          <div className="text-sm font-bold leading-tight text-white">Lớp Vẽ</div>
          <div className="text-[10px] font-medium uppercase tracking-widest text-[#C9A84C]/80">
            Admin
          </div>
        </div>
      </div>

      <div className="mx-5 mb-2 h-px bg-white/10" />

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 px-2 py-3">
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
                'relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-150',
                isActive
                  ? 'bg-white/15 font-medium text-white'
                  : 'text-white/55 hover:bg-white/8 hover:text-white/90'
              )}
            >
              {isActive && (
                <span className="absolute bottom-2 left-0 top-2 w-[3px] rounded-r-full bg-[#C9A84C]" />
              )}
              <Icon
                className={cn(
                  'h-4 w-4 shrink-0 transition-colors',
                  isActive ? 'text-[#C9A84C]' : 'text-current'
                )}
              />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="mx-5 mb-2 h-px bg-white/10" />
      <div className="px-2 py-3">
        <form action="/auth/signout" method="post">
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-white/40 transition-all duration-150 hover:bg-white/8 hover:text-white/80"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            Đăng xuất
          </button>
        </form>
      </div>
    </aside>
  )
}
