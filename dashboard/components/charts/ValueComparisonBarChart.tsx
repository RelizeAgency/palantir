'use client'

import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from 'recharts'
import { formatEuro } from '@/lib/format'

export type ValueComparisonRow = {
  name: string
  value: number
}

export function ValueComparisonBarChart({ data }: { data: ValueComparisonRow[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff1a" />
        <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#a1a1aa' }} axisLine={false} tickLine={false} />
        <YAxis
          tick={{ fontSize: 11, fill: '#a1a1aa' }}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
          tickFormatter={formatEuro}
        />
        <Tooltip
          cursor={{ fill: '#ffffff0d' }}
          contentStyle={{ background: '#17171b', border: '1px solid #ffffff1a', borderRadius: 8, fontSize: 12 }}
          labelStyle={{ color: '#f4f4f5' }}
          formatter={(value) => formatEuro(Number(value))}
        />
        <Bar dataKey="value" fill="#814bc8" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
