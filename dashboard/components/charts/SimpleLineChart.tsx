'use client'

import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from 'recharts'
import { formatDuration } from '@/lib/format'

// "format" is a plain string, not a function — Server Components can't pass
// functions as props to Client Components (they're not serializable across
// that boundary), so the formatting choice is picked here instead.
type ValueFormat = 'number' | 'duration' | 'percent'

function formatValue(value: number, format: ValueFormat): string {
  if (format === 'duration') return formatDuration(value)
  if (format === 'percent') return `${value}%`
  return String(value)
}

// One point per day (not bucketed), consistent with the Search Console
// chart, so the density matches Google's own graphs. Single metric, single
// color — used for the GA4 visitors/engagement/bounce-rate mini-charts.
export function SimpleLineChart({
  data,
  dataKey,
  color,
  format = 'number',
}: {
  data: { label: string; value: number }[]
  dataKey?: string
  color: string
  format?: ValueFormat
}) {
  return (
    <ResponsiveContainer width="100%" height={140}>
      <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff1a" />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 10, fill: '#a1a1aa' }}
          axisLine={false}
          tickLine={false}
          interval="preserveStartEnd"
          minTickGap={24}
        />
        <YAxis
          tick={{ fontSize: 10, fill: '#a1a1aa' }}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
          width={36}
        />
        <Tooltip
          contentStyle={{ background: '#17171b', border: '1px solid #ffffff1a', borderRadius: 8, fontSize: 12 }}
          labelStyle={{ color: '#f4f4f5' }}
          formatter={(value) => formatValue(Number(value), format)}
        />
        <Line type="linear" dataKey={dataKey ?? 'value'} stroke={color} strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  )
}
