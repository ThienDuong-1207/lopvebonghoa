import type { Metadata } from 'next'
import { Be_Vietnam_Pro } from 'next/font/google'
import { Toaster } from 'sonner'
import { ThemeProvider } from '@/components/ThemeProvider'
import './globals.css'

const beVietnamPro = Be_Vietnam_Pro({
  subsets: ['vietnamese', 'latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-sans',
})

export const metadata: Metadata = {
  title: 'Lớp Vẽ Sáng Tạo',
  description: 'Lớp vẽ sáng tạo dành cho trẻ em 4–8 tuổi.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={beVietnamPro.variable} suppressHydrationWarning>
      <body className="font-sans antialiased">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
          <Toaster position="top-right" richColors closeButton />
        </ThemeProvider>
      </body>

    </html>
  )
}
