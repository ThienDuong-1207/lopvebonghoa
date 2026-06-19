export default function Footer() {
  return (
    <footer className="bg-[#0D2545] py-10 text-white">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex flex-col gap-6 sm:flex-row sm:justify-between">
          <div>
            <h3 className="text-lg font-bold">Lớp Vẽ Sáng Tạo</h3>
            <p className="mt-1 text-sm text-gray-300">Nơi bé khám phá thế giới màu sắc</p>
          </div>
          <div className="text-sm text-gray-300">
            <p>📍 Địa chỉ cơ sở</p>
            <p className="mt-1">📞 Zalo: 0xxx xxx xxx</p>
          </div>
        </div>
        <div className="mt-8 border-t border-white/20 pt-6 text-center text-xs text-gray-400">
          © {new Date().getFullYear()} Lớp Vẽ Sáng Tạo. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
