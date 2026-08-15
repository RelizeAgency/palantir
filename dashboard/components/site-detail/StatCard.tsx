import { TrendBadge } from '@/components/sites/TrendBadge'

export function StatCard({
  label,
  value,
  current,
  previous,
  emphasize,
  invert,
  accentColor,
}: {
  label: string
  value: string | number
  current: number
  previous: number
  emphasize?: boolean
  invert?: boolean
  accentColor?: string // ties this card to a matching line/series elsewhere (e.g. a chart) via its border + a label dot
}) {
  return (
    <div
      className={`rounded-xl border bg-surface p-3 ${
        accentColor ? '' : emphasize ? 'border-accent/50' : 'border-border'
      }`}
      style={accentColor ? { borderColor: accentColor } : undefined}
    >
      <div className="flex items-center gap-1.5 text-xs text-secondary">
        {accentColor && <span className="h-2 w-2 rounded-full" style={{ background: accentColor }} />}
        {label}
      </div>
      <div className="text-2xl font-semibold text-primary">{value}</div>
      <TrendBadge current={current} previous={previous} invert={invert} />
    </div>
  )
}
