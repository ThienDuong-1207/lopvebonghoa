import { type LucideIcon, ArrowUpRight } from 'lucide-react'

interface Props {
  title: string
  value: string | number
  sub?: string
  color?: 'blue' | 'green' | 'amber' | 'red'
  icon?: LucideIcon
  hero?: boolean
}

const colorMap = {
  blue: { text: 'text-[#0D2545] dark:text-blue-300', icon: 'bg-[#0D2545]/10 text-[#0D2545] dark:bg-blue-900/30 dark:text-blue-300' },
  green: { text: 'text-emerald-600 dark:text-emerald-400', icon: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' },
  amber: { text: 'text-amber-600 dark:text-amber-400', icon: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' },
  red: { text: 'text-red-500 dark:text-red-400', icon: 'bg-red-50 text-red-500 dark:bg-red-900/30 dark:text-red-400' },
}

export default function MetricCard({ title, value, sub, color = 'blue', icon: Icon, hero }: Props) {
  if (hero) {
    return (
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#C9A84C] to-[#7A5520] p-6 text-white shadow-lg shadow-[#C9A84C]/25">
        <div className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full bg-white/10" />
        <div className="mb-4 flex items-start justify-between">
          <p className="text-sm font-medium text-white/70">{title}</p>
          <div className="rounded-xl bg-white/20 p-1.5">
            <ArrowUpRight className="h-4 w-4 text-white" />
          </div>
        </div>
        <p className="text-4xl font-bold">{value}</p>
        {sub && <p className="mt-2 text-xs text-white/60">{sub}</p>}
        {!sub && (
          <p className="mt-2 text-xs text-white/50">Cập nhật theo thời gian thực</p>
        )}
      </div>
    )
  }

  const c = colorMap[color]
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-gray-800">
      <div className="mb-4 flex items-start justify-between">
        <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
        {Icon && (
          <div className={`rounded-xl p-2 ${c.icon}`}>
            <Icon className="h-4 w-4" />
          </div>
        )}
      </div>
      <p className={`text-3xl font-bold ${c.text}`}>{value}</p>
      {sub && <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500">{sub}</p>}
    </div>
  )
}
