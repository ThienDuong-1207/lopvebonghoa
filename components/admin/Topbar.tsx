import { createClient } from '@/lib/supabase/server'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

export default async function Topbar({ title }: { title?: string }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, avatar_url')
    .eq('id', user?.id ?? '')
    .single()

  const initials = profile?.full_name
    ?.split(' ')
    .map((w: string) => w[0])
    .slice(-2)
    .join('')
    .toUpperCase() ?? 'AD'

  return (
    <header className="flex h-14 items-center justify-between border-b border-gray-200 bg-white px-6">
      <h1 className="text-base font-semibold text-gray-800">{title ?? 'Admin'}</h1>
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-500">{profile?.full_name}</span>
        <Avatar className="h-8 w-8">
          <AvatarImage src={profile?.avatar_url ?? ''} />
          <AvatarFallback className="bg-[#0D2545] text-xs text-white">{initials}</AvatarFallback>
        </Avatar>
      </div>
    </header>
  )
}
