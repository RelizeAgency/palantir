'use client'

import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from 'recharts'
import { STAT_COLORS } from '@/lib/statColors'

export function LineChartSeo({
  data,
}: {
  data: { week: string; impressions: number; clicks: number }[]
}) {
  return (
    <div>
      {/* Independent axis labels, like Search Console's own graph — each
          line gets its own scale (below) so a handful of clicks doesn't get
          flattened to a near-invisible line next to a much larger impressions count. */}
      <div className="mb-1 flex items-center justify-between text-xs font-medium">
        <span style={{ color: STAT_COLORS.seoClicks }}>Aantal klikken</span>
        <span style={{ color: STAT_COLORS.seoImpressions }}>Vertoningen</span>
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff1a" />
          <XAxis
            dataKey="week"
            tick={{ fontSize: 11, fill: '#a1a1aa' }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
            minTickGap={24}
          />
          <YAxis
            yAxisId="clicks"
            orientation="left"
            tick={{ fontSize: 11, fill: '#a1a1aa' }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
            domain={[0, 'auto']}
          />
          <YAxis
            yAxisId="impressions"
            orientation="right"
            tick={{ fontSize: 11, fill: '#a1a1aa' }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
            domain={[0, 'auto']}
          />
          <Tooltip
            contentStyle={{ background: '#17171b', border: '1px solid #ffffff1a', borderRadius: 8, fontSize: 12 }}
            labelStyle={{ color: '#f4f4f5' }}
          />
          <Line
            type="monotone"
            dataKey="impressions"
            name="Vertoningen"
            yAxisId="impressions"
            stroke={STAT_COLORS.seoImpressions}
            strokeWidth={2}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="clicks"
            name="Kliks"
            yAxisId="clicks"
            stroke={STAT_COLORS.seoClicks}
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
