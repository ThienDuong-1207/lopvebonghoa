import BottomNav from '@/components/staff/BottomNav'

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50 pb-16">
      <header className="bg-[#0D2545] px-4 py-4">
        <h1 className="text-base font-bold text-white">Lớp Vẽ Sáng Tạo</h1>
        <p className="text-xs text-[#C9A84C]">Trợ giảng</p>
      </header>
      <main className="flex-1">{children}</main>
      <BottomNav />
    </div>
  )
}
