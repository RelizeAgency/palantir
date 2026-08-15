import { percentChange } from '@/lib/periods'

// invert: for metrics where a lower number is better (e.g. gemiddelde
// zoekpositie). Both the arrow direction and the color follow whether the
// change is actually good news, not the raw sign of the number — a rising
// position number is a worse ranking, so it shows ▼ in red, not ▲.
export function TrendBadge({
  current,
  previous,
  invert,
}: {
  current: number
  previous: number
  invert?: boolean
}) {
  const change = percentChange(current, previous)

  if (change === null) {
    return <span className="text-xs font-medium text-secondary">nieuw</span>
  }
  if (change === 0 && previous === 0) {
    return <span className="text-xs font-medium text-muted">—</span>
  }

  const isUp = change >= 0
  const isGood = invert ? !isUp : isUp
  return (
    <span className={`text-xs font-medium ${isGood ? 'text-success' : 'text-danger'}`}>
      {isGood ? '▲' : '▼'} {Math.abs(change).toFixed(0)}%
    </span>
  )
}
