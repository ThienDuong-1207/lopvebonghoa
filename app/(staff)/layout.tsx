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
    <div className="flex min-h-screen flex-col bg-slate-50 pb-16">
      <header className="bg-[#0D2545] shadow-md">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#C9A84C]/25">
              <span className="text-xs font-bold text-[#C9A84C]">LV</span>
            </div>
            <div>
              <div className="text-sm font-bold text-white">Lớp Vẽ Sáng Tạo</div>
              <div className="text-[10px] font-medium uppercase tracking-widest text-[#C9A84C]/80">
                Trợ giảng
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8 ring-2 ring-[#C9A84C]/30">
              <AvatarImage src={profile?.avatar_url ?? ''} />
              <AvatarFallback className="bg-white/20 text-xs font-semibold text-white">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="text-xs font-semibold text-white">
                {profile?.full_name ?? 'Trợ giảng'}
              </div>
              <form action="/auth/signout" method="post">
                <button
                  type="submit"
                  className="flex items-center gap-1 text-[10px] text-white/50 transition-colors hover:text-white/80"
                >
                  <LogOut className="h-2.5 w-2.5" />
                  Đăng xuất
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
