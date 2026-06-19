import { Card, CardContent } from '@/components/ui/card'
import { type LucideIcon } from 'lucide-react'

interface Props {
  title: string
  value: string | number
  sub?: string
  color?: 'blue' | 'green' | 'amber' | 'red'
  icon?: LucideIcon
}

const colorMap = {
  blue: {
    bg: 'bg-[#0D2545]/8',
    text: 'text-[#0D2545]',
    icon: 'bg-[#0D2545]/10 text-[#0D2545]',
  },
  green: {
    bg: 'bg-green-50',
    text: 'text-green-600',
    icon: 'bg-green-100 text-green-600',
  },
  amber: {
    bg: 'bg-amber-50',
    text: 'text-amber-600',
    icon: 'bg-amber-100 text-amber-600',
  },
  red: {
    bg: 'bg-red-50',
    text: 'text-red-500',
    icon: 'bg-red-100 text-red-500',
  },
}

export default function MetricCard({ title, value, sub, color = 'blue', icon: Icon }: Props) {
  const c = colorMap[color]
  return (
    <Card>
      <CardContent className="py-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-gray-500">{title}</p>
            <p className={`mt-1 text-3xl font-bold ${c.text}`}>{value}</p>
            {sub && <p className="mt-1 text-xs text-gray-400">{sub}</p>}
          </div>
          {Icon && (
            <div className={`rounded-xl p-2.5 ${c.icon}`}>
              <Icon className="h-5 w-5" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
