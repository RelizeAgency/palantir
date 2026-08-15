import { TrendBadge } from '@/components/sites/TrendBadge'
import { STAT_COLORS } from '@/lib/statColors'

// Website bel-clicks and GMB-belletjes zijn beide "iemand belde ons", maar
// via een andere ingang — één totaal met een duidelijke opsplitsing eronder,
// i.p.v. twee losse kaarten die eigenlijk bij elkaar horen.
export function CombinedCallsCard({
  websiteCallsCur,
  websiteCallsPrev,
  gmbCallsCur,
  gmbCallsPrev,
}: {
  websiteCallsCur: number
  websiteCallsPrev: number
  gmbCallsCur: number
  gmbCallsPrev: number
}) {
  const totalCur = websiteCallsCur + gmbCallsCur
  const totalPrev = websiteCallsPrev + gmbCallsPrev
  const totalForBar = totalCur || 1
  const websiteShare = (websiteCallsCur / totalForBar) * 100
  const gmbShare = (gmbCallsCur / totalForBar) * 100

  return (
    <div className="rounded-xl border bg-surface p-3" style={{ borderColor: STAT_COLORS.bel }}>
      <div className="flex items-center gap-1.5 text-xs text-secondary">
        <span className="h-2 w-2 rounded-full" style={{ background: STAT_COLORS.bel }} /> Bellen
      </div>
      <div className="flex items-baseline gap-2">
        <div className="text-2xl font-semibold text-primary">{totalCur}</div>
        <TrendBadge current={totalCur} previous={totalPrev} />
      </div>

      {totalCur > 0 && (
        <div className="mt-2 mb-2 flex h-1.5 overflow-hidden rounded-full bg-bg">
          <div className="h-full" style={{ width: `${websiteShare}%`, background: STAT_COLORS.bel }} />
          <div className="h-full" style={{ width: `${gmbShare}%`, background: STAT_COLORS.gmb }} />
        </div>
      )}

      <div className="mt-2 space-y-1 text-xs">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-secondary">
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: STAT_COLORS.bel }} /> Website
          </span>
          <span className="font-medium text-primary">{websiteCallsCur}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-secondary">
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: STAT_COLORS.gmb }} /> Google Business
          </span>
          <span className="font-medium text-primary">{gmbCallsCur}</span>
        </div>
      </div>
    </div>
  )
}
