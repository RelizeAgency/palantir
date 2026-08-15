'use client'

import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from 'recharts'
import { STAT_COLORS } from '@/lib/statColors'

export type ComparisonBarRow = {
  name: string
  bel: number
  gmb: number
  whatsapp: number
  form: number
}

const LEGEND_ITEMS = [
  { key: 'bel', label: 'Bel (website)', color: STAT_COLORS.bel },
  { key: 'gmb', label: 'Bel (GMB)', color: STAT_COLORS.gmb },
  { key: 'whatsapp', label: 'WhatsApp', color: STAT_COLORS.whatsapp },
  { key: 'form', label: 'Formulier', color: STAT_COLORS.form },
]

export function ComparisonBarChart({ data }: { data: ComparisonBarRow[] }) {
  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-4">
        {LEGEND_ITEMS.map((item) => (
          <div key={item.key} className="flex items-center gap-1.5 text-xs text-secondary">
            <span className="h-2 w-2 rounded-full" style={{ background: item.color }} />
            {item.label}
          </div>
        ))}
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff1a" />
          <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#a1a1aa' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: '#a1a1aa' }} axisLine={false} tickLine={false} allowDecimals={false} />
          <Tooltip
            cursor={{ fill: '#ffffff0d' }}
            contentStyle={{ background: '#17171b', border: '1px solid #ffffff1a', borderRadius: 8, fontSize: 12 }}
            labelStyle={{ color: '#f4f4f5' }}
          />
          <Bar dataKey="form" name="Formulier" stackId="leads" fill={STAT_COLORS.form} radius={[0, 0, 0, 0]} />
          <Bar dataKey="whatsapp" name="WhatsApp" stackId="leads" fill={STAT_COLORS.whatsapp} radius={[0, 0, 0, 0]} />
          <Bar dataKey="gmb" name="Bel (GMB)" stackId="leads" fill={STAT_COLORS.gmb} radius={[0, 0, 0, 0]} />
          <Bar dataKey="bel" name="Bel (website)" stackId="leads" fill={STAT_COLORS.bel} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
