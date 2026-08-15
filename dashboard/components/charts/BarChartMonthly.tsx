'use client'

import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid, Cell } from 'recharts'
import type { MonthlyValueBucket } from '@/lib/aggregate'
import { STAT_COLORS } from '@/lib/statColors'
import { formatEuro } from '@/lib/format'

type ChartRow = MonthlyValueBucket & { value: number }

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: { payload: ChartRow }[]
  label?: string
}) {
  if (!active || !payload?.length) return null
  const row = payload[0].payload

  return (
    <div className="rounded-lg border border-[#ffffff1a] bg-[#17171b] px-3 py-2 text-xs">
      <div className="mb-1 font-medium text-primary">
        {label}
        {row.isCurrent ? ' (tot nu toe)' : ''}
      </div>
      <div className="flex items-center justify-between gap-6">
        <span className="text-secondary">Potentiële waarde</span>
        <span className="font-semibold text-primary">{formatEuro(row.value)}</span>
      </div>
      <div className="flex items-center justify-between gap-6">
        <span className="text-secondary">Leads</span>
        <span className="text-primary">{row.totalLeads}</span>
      </div>
    </div>
  )
}

export function BarChartMonthly({
  data,
  leadValueEur,
}: {
  data: MonthlyValueBucket[]
  leadValueEur: number
}) {
  const chartData: ChartRow[] = data.map((d) => ({ ...d, value: d.totalLeads * leadValueEur }))

  return (
    <ResponsiveContainer width="100%" height={190}>
      <BarChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff1a" />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#a1a1aa' }} axisLine={false} tickLine={false} />
        <YAxis
          tick={{ fontSize: 11, fill: '#a1a1aa' }}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
          tickFormatter={formatEuro}
        />
        <Tooltip cursor={{ fill: '#ffffff0d' }} content={<CustomTooltip />} />
        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
          {chartData.map((entry) => (
            <Cell key={entry.key} fill={STAT_COLORS.value} fillOpacity={entry.isCurrent ? 0.4 : 1} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
