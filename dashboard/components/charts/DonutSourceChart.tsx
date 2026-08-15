'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { STAT_COLORS } from '@/lib/statColors'

const COLORS = {
  Bel: STAT_COLORS.bel,
  WhatsApp: STAT_COLORS.whatsapp,
  Formulier: STAT_COLORS.form,
  'GMB-bellen': STAT_COLORS.gmb,
}

export function DonutSourceChart({
  phoneClicks,
  whatsappClicks,
  formLeads,
  gmbCalls,
}: {
  phoneClicks: number
  whatsappClicks: number
  formLeads: number
  gmbCalls?: number
}) {
  const data = [
    { name: 'Bel', value: phoneClicks },
    { name: 'WhatsApp', value: whatsappClicks },
    { name: 'Formulier', value: formLeads },
    ...(gmbCalls ? [{ name: 'GMB-bellen', value: gmbCalls }] : []),
  ]
  const total = phoneClicks + whatsappClicks + formLeads + (gmbCalls ?? 0)

  if (total === 0) {
    return <div className="flex h-[140px] items-center justify-center text-xs text-muted">Nog geen data</div>
  }

  return (
    <div>
      <ResponsiveContainer width="100%" height={140}>
        <PieChart>
          <Pie data={data} dataKey="value" innerRadius={40} outerRadius={60} paddingAngle={0} stroke="none">
            {data.map((entry) => (
              <Cell key={entry.name} fill={COLORS[entry.name as keyof typeof COLORS]} stroke="none" />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ background: '#17171b', border: '1px solid #ffffff1a', borderRadius: 8, fontSize: 12 }}
            labelStyle={{ color: '#f4f4f5' }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex flex-col gap-1 text-xs text-secondary">
        {data.map((entry) => (
          <span key={entry.name}>
            <span style={{ color: COLORS[entry.name as keyof typeof COLORS] }}>●</span>{' '}
            {entry.name} — {total > 0 ? Math.round((entry.value / total) * 100) : 0}%
          </span>
        ))}
      </div>
    </div>
  )
}
