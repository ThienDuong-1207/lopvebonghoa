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
  CheckSquare,
} from 'lucide-react'

const MENU_ITEMS = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/hoc-sinh', label: 'Học sinh', icon: Users },
  { href: '/admin/dang-ky-moi', label: 'Đăng ký mới', icon: ClipboardList },
  { href: '/admin/thanh-toan', label: 'Thanh toán', icon: CreditCard },
  { href: '/admin/diem-danh', label: 'Điểm danh', icon: CheckSquare },
  { href: '/admin/canh-bao', label: 'Cảnh báo', icon: Bell },
  { href: '/admin/lich-hoc', label: 'Lịch & Ca học', icon: CalendarDays },
]

const SETTINGS_ITEMS = [
  { href: '/admin/staff', label: 'Trợ giảng', icon: UserCog },
]

export default function Sidebar() {
  const pathname = usePathname()

  function NavItem({ href, label, icon: Icon }: { href: string; label: string; icon: typeof LayoutDashboard }) {
    const isActive = href === '/admin' ? pathname === '/admin' : pathname.startsWith(href)
    return (
      <Link
        href={href}
        className={cn(
          'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-150',
          isActive
            ? 'bg-[#C9A84C] font-semibold text-white shadow-sm shadow-[#C9A84C]/30'
            : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100'
        )}
      >
        <Icon className="h-4 w-4 shrink-0" />
        {label}
      </Link>
    )
  }

  return (
    <aside className="flex h-screen w-60 flex-col border-r border-gray-100 bg-white dark:border-gray-800 dark:bg-gray-900">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#C9A84C] shadow-md shadow-[#C9A84C]/30">
          <Palette className="h-5 w-5 text-white" />
        </div>
        <div>
          <div className="text-sm font-bold text-gray-900 dark:text-white">Lớp Vẽ Sáng Tạo</div>
          <div className="text-[10px] text-gray-400 dark:text-gray-500">Management</div>
        </div>
      </div>

      {/* Menu section */}
      <div className="flex-1 overflow-y-auto px-3">
        <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-gray-300 dark:text-gray-600">
          Menu
        </p>
        <nav className="space-y-0.5">
          {MENU_ITEMS.map((item) => (
            <NavItem key={item.href} {...item} />
          ))}
        </nav>

        <p className="mb-2 mt-6 px-3 text-[10px] font-semibold uppercase tracking-widest text-gray-300 dark:text-gray-600">
          Cài đặt
        </p>
        <nav className="space-y-0.5">
          {SETTINGS_ITEMS.map((item) => (
            <NavItem key={item.href} {...item} />
          ))}
        </nav>
      </div>

      {/* Logout */}
      <div className="border-t border-gray-100 px-3 py-4 dark:border-gray-800">
        <form action="/auth/signout" method="post">
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-gray-400 transition-all hover:bg-gray-50 hover:text-gray-700 dark:text-gray-500 dark:hover:bg-gray-800 dark:hover:text-gray-200"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            Đăng xuất
          </button>
        </form>
      </div>
    </aside>
  )
}
