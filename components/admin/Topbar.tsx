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
    <header className="flex h-14 items-center justify-between border-b border-gray-200 bg-white px-6">
      <div className="flex items-center gap-3">
        {backHref && (
          <Link
            href={backHref}
            className="flex items-center gap-1 text-sm text-gray-400 hover:text-[#0D2545]"
          >
            <ChevronLeft className="h-4 w-4" />
            {backLabel ?? 'Quay lại'}
          </Link>
        )}
        {backHref && <span className="text-gray-300">/</span>}
        <h1 className="text-base font-semibold text-gray-800">{title ?? 'Admin'}</h1>
      </div>
      <div className="flex items-center gap-3">
        <span className="hidden text-sm text-gray-500 sm:block">{profile?.full_name}</span>
        <Avatar className="h-8 w-8">
          <AvatarImage src={profile?.avatar_url ?? ''} />
          <AvatarFallback className="bg-[#0D2545] text-xs text-white">{initials}</AvatarFallback>
        </Avatar>
      </div>
    </header>
  )
}
