import { createClient } from '@/lib/supabase/server'
import BottomNav from '@/components/staff/BottomNav'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Bell, LogOut } from 'lucide-react'

export default async function StaffLayout({ children }: { children: React.ReactNode }) {
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
    .toUpperCase() ?? 'TV'

  return (
    <div className="flex min-h-screen flex-col bg-[#F5F5F2] pb-16">
      <header className="border-b border-gray-100 bg-white px-4 py-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-gray-400">
              Lớp Vẽ Sáng Tạo
            </p>
            <h1 className="mt-0.5 text-lg font-bold text-gray-900">
              {profile?.full_name ?? 'Trợ giảng'}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-50 text-gray-400">
              <Bell className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-2">
              <Avatar className="h-9 w-9 ring-2 ring-[#C9A84C]/20">
                <AvatarImage src={profile?.avatar_url ?? ''} />
                <AvatarFallback className="bg-[#C9A84C] text-xs font-bold text-white">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <form action="/auth/signout" method="post">
                <button
                  type="submit"
                  className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-700"
                >
                  <LogOut className="h-3.5 w-3.5" />
                </button>
              </form>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>
      <BottomNav />
    </div>
  )
}
