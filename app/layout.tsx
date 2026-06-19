import type { Metadata } from 'next'
import { DM_Sans } from 'next/font/google'
import './globals.css'

const dmSans = DM_Sans({ subsets: ['latin'], variable: '--font-sans' })

export const metadata: Metadata = {
  title: 'Lớp Vẽ Sáng Tạo',
  description: 'Lớp vẽ sáng tạo dành cho trẻ em 4–8 tuổi.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={dmSans.variable}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  )
}
