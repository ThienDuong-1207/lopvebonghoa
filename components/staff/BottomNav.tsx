'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const TABS = [
  { href: '/staff', label: 'Trang chủ', icon: '🏠' },
  { href: '/staff/diem-danh', label: 'Điểm danh', icon: '✅' },
  { href: '/staff/lich-ca', label: 'Lịch ca', icon: '📅' },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex border-t border-gray-200 bg-white">
      {TABS.map((tab) => {
        const isActive =
          tab.href === '/staff'
            ? pathname === '/staff'
            : pathname.startsWith(tab.href)
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              'flex flex-1 flex-col items-center gap-1 py-3 text-xs transition-colors',
              isActive ? 'text-[#0D2545]' : 'text-gray-400'
            )}
          >
            <span className="text-xl">{tab.icon}</span>
            <span className={cn('font-medium', isActive && 'text-[#C9A84C]')}>
              {tab.label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
