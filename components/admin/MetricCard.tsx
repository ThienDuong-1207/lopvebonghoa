import { Card, CardContent } from '@/components/ui/card'

interface Props {
  title: string
  value: string | number
  sub?: string
  color?: 'blue' | 'green' | 'amber' | 'red'
}

const colorMap = {
  blue: 'bg-[#0D2545]/10 text-[#0D2545]',
  green: 'bg-green-50 text-green-600',
  amber: 'bg-amber-50 text-amber-600',
  red: 'bg-red-50 text-red-500',
}

export default function MetricCard({ title, value, sub, color = 'blue' }: Props) {
  return (
    <Card>
      <CardContent className="py-5">
        <p className="text-sm text-gray-500">{title}</p>
        <div className={`mt-2 inline-flex items-baseline gap-1 rounded-lg px-3 py-1 ${colorMap[color]}`}>
          <span className="text-3xl font-bold">{value}</span>
        </div>
        {sub && <p className="mt-1 text-xs text-gray-400">{sub}</p>}
      </CardContent>
    </Card>
  )
}
