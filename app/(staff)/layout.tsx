import { createClient } from '@/lib/supabase/server'
import BottomNav from '@/components/staff/BottomNav'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { LogOut } from 'lucide-react'

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
    <div className="flex min-h-screen flex-col bg-gray-50 pb-16">
      <header className="flex items-center justify-between bg-[#0D2545] px-4 py-3">
        <div>
          <h1 className="text-sm font-bold text-white">Lớp Vẽ Sáng Tạo</h1>
          <p className="text-xs text-[#C9A84C]">Trợ giảng</p>
        </div>

        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={profile?.avatar_url ?? ''} />
            <AvatarFallback className="bg-white/20 text-xs font-semibold text-white">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="text-right">
            <div className="text-xs font-medium text-white">{profile?.full_name ?? 'Trợ giảng'}</div>
            <form action="/auth/signout" method="post">
              <button
                type="submit"
                className="flex items-center gap-1 text-xs text-white/50 hover:text-white/80"
              >
                <LogOut className="h-3 w-3" />
                Đăng xuất
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>
      <BottomNav />
    </div>
  )
}
