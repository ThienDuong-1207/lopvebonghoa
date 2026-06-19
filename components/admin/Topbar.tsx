import { createClient } from '@/lib/supabase/server'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

interface TopbarProps {
  title?: string
  backHref?: string
  backLabel?: string
}

export default async function Topbar({ title, backHref, backLabel }: TopbarProps) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, avatar_url')
    .eq('auth_user_id', user?.id ?? '')
    .single()

  const initials = profile?.full_name
    ?.split(' ')
    .map((w: string) => w[0])
    .slice(-2)
    .join('')
    .toUpperCase() ?? 'AD'

  return (
    <header className="flex h-16 items-center justify-between bg-white px-6 shadow-sm">
      <div className="flex items-center gap-2">
        {backHref && (
          <>
            <Link
              href={backHref}
              className="flex items-center gap-1 text-sm text-gray-400 transition-colors hover:text-gray-700"
            >
              <ChevronLeft className="h-4 w-4" />
              {backLabel ?? 'Quay lại'}
            </Link>
            <span className="text-gray-200">·</span>
          </>
        )}
        <h1 className="text-sm font-semibold text-gray-800">{title ?? 'Admin'}</h1>
      </div>

      <div className="flex items-center gap-3">
        <div className="text-right">
          <div className="hidden text-sm font-medium text-gray-700 sm:block">
            {profile?.full_name}
          </div>
          <div className="hidden text-xs text-gray-400 sm:block">Admin</div>
        </div>
        <Avatar className="h-9 w-9 ring-2 ring-[#C9A84C]/30">
          <AvatarImage src={profile?.avatar_url ?? ''} />
          <AvatarFallback className="bg-[#0D2545] text-xs font-semibold text-white">
            {initials}
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  )
}
