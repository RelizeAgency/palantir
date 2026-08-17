'use client'

import { AreaChart, Area, ResponsiveContainer, YAxis } from 'recharts'

export function SparklineChart({ data }: { data: { date: string; total_leads: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={44}>
      <AreaChart data={data} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
        <YAxis hide domain={[0, 'dataMax']} />
        <Area
          type="linear"
          dataKey="total_leads"
          stroke="#814bc8"
          strokeWidth={1.5}
          fill="#814bc8"
          fillOpacity={0.15}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
