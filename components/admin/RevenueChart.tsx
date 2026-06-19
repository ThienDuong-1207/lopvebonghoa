'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

interface DataPoint {
  month: string
  revenue: number
}

interface Props {
  data: DataPoint[]
}

function CustomTooltip({ active, payload, label }: {
  active?: boolean
  payload?: { value: number }[]
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-white/10 bg-white/10 px-3 py-2 backdrop-blur-sm text-sm">
      <p className="font-medium text-white/70">{label}</p>
      <p className="font-bold text-white">{payload[0].value.toFixed(1)}M đ</p>
    </div>
  )
}

export default function RevenueChart({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={data} margin={{ top: 4, right: 4, left: -24, bottom: 0 }} barCategoryGap="30%">
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" vertical={false} />
        <XAxis
          dataKey="month"
          tick={{ fontSize: 12, fill: 'rgba(255,255,255,0.4)' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 12, fill: 'rgba(255,255,255,0.4)' }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `${v}M`}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
        <Bar dataKey="revenue" fill="#C9A84C" radius={[10, 10, 10, 10]} maxBarSize={28} />
      </BarChart>
    </ResponsiveContainer>
  )
}
