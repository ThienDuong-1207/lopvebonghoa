'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Home, CheckSquare, CalendarDays } from 'lucide-react'

const TABS = [
  { href: '/staff', label: 'Trang chủ', icon: Home },
  { href: '/staff/diem-danh', label: 'Điểm danh', icon: CheckSquare },
  { href: '/staff/lich-ca', label: 'Lịch ca', icon: CalendarDays },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex border-t border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
      {TABS.map((tab) => {
        const isActive =
          tab.href === '/staff'
            ? pathname === '/staff'
            : pathname.startsWith(tab.href)
        const Icon = tab.icon
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              'relative flex flex-1 flex-col items-center gap-1 py-3 text-xs transition-colors',
              isActive ? 'text-[#0D2545] dark:text-white' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
            )}
          >
            {isActive && (
              <span className="absolute left-4 right-4 top-0 h-0.5 rounded-b-full bg-[#C9A84C]" />
            )}
            <Icon className={cn('h-5 w-5', isActive ? 'text-[#0D2545] dark:text-white' : 'text-gray-400')} />
            <span className={cn('font-medium', isActive ? 'text-[#C9A84C]' : '')}>
              {tab.label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
