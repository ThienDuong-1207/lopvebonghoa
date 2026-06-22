import { getAuthUser, getProfile } from '@/lib/supabase/queries'
import { createClient } from '@/lib/supabase/server'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import Link from 'next/link'
import { ChevronLeft, Bell } from 'lucide-react'
import { ThemeToggle } from '@/components/ThemeToggle'

interface TopbarProps {
  title?: string
  subtitle?: string
  backHref?: string
  backLabel?: string
}

export default async function Topbar({ title, subtitle, backHref, backLabel }: TopbarProps) {
  const supabase = createClient()
  const [user, profile, alertsRes] = await Promise.all([
    getAuthUser(),
    getProfile(),
    supabase.from('alerts').select('id', { count: 'exact', head: true }).eq('resolved', false),
  ])

  const alertCount = alertsRes.count ?? 0

  const initials = profile?.full_name
    ?.split(' ')
    .map((w: string) => w[0])
    .slice(-2)
    .join('')
    .toUpperCase() ?? 'AD'

  return (
    <header className="flex items-center justify-between border-b border-gray-100 bg-white px-8 py-5 dark:border-gray-800 dark:bg-gray-900">
      <div>
        {backHref && (
          <Link
            href={backHref}
            className="mb-1.5 flex items-center gap-1 text-sm text-gray-400 transition-colors hover:text-gray-700 dark:hover:text-gray-200"
          >
            <ChevronLeft className="h-4 w-4" />
            {backLabel ?? 'Quay lại'}
          </Link>
        )}
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{title ?? 'Dashboard'}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-gray-400">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3">
        <ThemeToggle />

        {/* Notification bell */}
        <Link
          href="/admin/canh-bao"
          className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gray-50 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200"
        >
          <Bell className="h-5 w-5" />
          {alertCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
              {alertCount > 99 ? '99+' : alertCount}
            </span>
          )}
        </Link>

        {/* User */}
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 ring-2 ring-[#C9A84C]/20">
            <AvatarImage src={profile?.avatar_url ?? ''} />
            <AvatarFallback className="bg-[#C9A84C] text-sm font-bold text-white">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="hidden sm:block">
            <div className="text-sm font-semibold text-gray-800 dark:text-gray-100">{profile?.full_name}</div>
            <div className="text-xs text-gray-400">{user?.email}</div>
          </div>
        </div>
      </div>
    </header>
  )
}
