'use client'

import { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from 'recharts'
import type { WeeklyLeadsBucket } from '@/lib/aggregate'
import { IconChevronLeft, IconChevronRight } from '@/components/icons'
import { STAT_COLORS as COLORS } from '@/lib/statColors'

// Weeks visible at once — kept smaller now that labels show a full date
// range ("20 tot 26 juli") instead of a single date, so each needs more room.
const WINDOW_SIZE = 5

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: { payload: WeeklyLeadsBucket }[]
  label?: string
}) {
  if (!active || !payload?.length) return null
  const row = payload[0].payload

  return (
    <div className="rounded-lg border border-[#ffffff1a] bg-[#17171b] px-3 py-2 text-xs">
      <div className="mb-1.5 font-medium text-primary">{label}</div>
      <div className="mb-1.5 flex items-center justify-between gap-6">
        <span className="text-secondary">Totaal</span>
        <span className="font-semibold text-primary">{row.total_leads}</span>
      </div>
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-6">
          <span className="flex items-center gap-1.5 text-secondary">
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: COLORS.bel }} /> Bellen
          </span>
          <span className="text-primary">{row.bel_total}</span>
        </div>
        <div className="ml-3 flex items-center justify-between gap-6 text-[11px] text-muted">
          <span>— Website</span>
          <span>{row.phone_clicks}</span>
        </div>
        <div className="ml-3 flex items-center justify-between gap-6 text-[11px] text-muted">
          <span>— Google Business</span>
          <span>{row.gmb_calls}</span>
        </div>
        <div className="flex items-center justify-between gap-6">
          <span className="flex items-center gap-1.5 text-secondary">
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: COLORS.whatsapp }} /> WhatsApp
          </span>
          <span className="text-primary">{row.whatsapp_clicks}</span>
        </div>
        <div className="flex items-center justify-between gap-6">
          <span className="flex items-center gap-1.5 text-secondary">
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: COLORS.form }} /> Formulieren
          </span>
          <span className="text-primary">{row.form_leads}</span>
        </div>
      </div>
    </div>
  )
}

export function BarChartWeekly({ data }: { data: WeeklyLeadsBucket[] }) {
  // offset counts weeks back from the most recent one — 0 = newest window.
  // The parent remounts this component (via a `key` tied to the period) when
  // the dataset changes, so offset naturally resets to 0 — no effect needed.
  const [offset, setOffset] = useState(0)
  const maxOffset = Math.max(0, data.length - WINDOW_SIZE)
  const clampedOffset = Math.min(offset, maxOffset)
  const end = data.length - clampedOffset
  const start = Math.max(0, end - WINDOW_SIZE)
  const visible = data.slice(start, end)

  const canGoOlder = end - WINDOW_SIZE > 0
  const canGoNewer = clampedOffset > 0

  // Fixed across the whole dataset (not just the visible window), so bar
  // heights stay comparable when paging between weeks — otherwise the axis
  // would rescale to each page's own max and make relative comparison impossible.
  const maxTotal = Math.max(...data.map((d) => d.total_leads), 1)
  const yDomain: [number, number] = [0, Math.ceil(maxTotal * 1.1)]

  return (
    <div>
      {data.length > WINDOW_SIZE && (
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs text-muted">
            {visible[0]?.week} — {visible[visible.length - 1]?.week}
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => setOffset((o) => Math.min(o + WINDOW_SIZE, maxOffset))}
              disabled={!canGoOlder}
              className="rounded-md border border-border p-1 text-secondary transition-colors hover:bg-surface-hover disabled:opacity-30"
              aria-label="Eerdere weken"
            >
              <IconChevronLeft className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setOffset((o) => Math.max(o - WINDOW_SIZE, 0))}
              disabled={!canGoNewer}
              className="rounded-md border border-border p-1 text-secondary transition-colors hover:bg-surface-hover disabled:opacity-30"
              aria-label="Recentere weken"
            >
              <IconChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
      <ResponsiveContainer width="100%" height={190}>
        <BarChart data={visible} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff1a" />
          <XAxis
            dataKey="week"
            tick={{ fontSize: 10, fill: '#a1a1aa' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#a1a1aa' }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
            domain={yDomain}
          />
          <Tooltip cursor={{ fill: '#ffffff0d' }} content={<CustomTooltip />} />
          <Bar dataKey="form_leads" name="Formulieren" stackId="leads" fill={COLORS.form} radius={[0, 0, 0, 0]} />
          <Bar dataKey="whatsapp_clicks" name="WhatsApp" stackId="leads" fill={COLORS.whatsapp} radius={[0, 0, 0, 0]} />
          <Bar dataKey="bel_total" name="Bellen" stackId="leads" fill={COLORS.bel} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
