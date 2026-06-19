'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'

interface DataPoint {
  day: string
  count: number
  isToday: boolean
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
    <div className="rounded-xl border border-gray-100 bg-white px-3 py-2 shadow-lg text-sm">
      <p className="font-semibold text-gray-700">{label}</p>
      <p className="text-[#C9A84C] font-bold">{payload[0].value} lượt</p>
    </div>
  )
}

export default function AttendanceChart({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 4, right: 4, left: -24, bottom: 0 }} barCategoryGap="30%">
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
        <XAxis
          dataKey="day"
          tick={{ fontSize: 12, fill: '#94a3b8' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 12, fill: '#94a3b8' }}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
        <Bar dataKey="count" radius={[10, 10, 10, 10]} maxBarSize={28}>
          {data.map((entry, index) => (
            <Cell
              key={index}
              fill={entry.isToday ? '#C9A84C' : '#0D2545'}
              opacity={entry.isToday ? 1 : 0.15 + (entry.count > 0 ? 0.6 : 0)}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
