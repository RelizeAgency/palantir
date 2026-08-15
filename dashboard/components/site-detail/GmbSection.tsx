import Link from 'next/link'
import type { GmbPeriodTotals } from '@/lib/types'
import type { PeriodKey } from '@/lib/periods'
import { PeriodDropdown } from '@/components/sites/PeriodDropdown'
import { StatCard } from '@/components/site-detail/StatCard'

export function GmbSection({
  gmbPeriod,
  gmbTotals,
}: {
  gmbPeriod: PeriodKey
  gmbTotals: GmbPeriodTotals | null
}) {
  return (
    <div>
      <div className="mb-4 flex justify-start">
        <PeriodDropdown paramKey="gmbPeriod" current={gmbPeriod} />
      </div>

      {gmbTotals ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <StatCard
            label="Profielweergaven"
            value={gmbTotals.profile_views_cur}
            current={gmbTotals.profile_views_cur}
            previous={gmbTotals.profile_views_prev}
          />
          <StatCard
            label="Kliks naar website"
            value={gmbTotals.website_clicks_cur}
            current={gmbTotals.website_clicks_cur}
            previous={gmbTotals.website_clicks_prev}
          />
          <StatCard
            label="Route-aanvragen"
            value={gmbTotals.direction_requests_cur}
            current={gmbTotals.direction_requests_cur}
            previous={gmbTotals.direction_requests_prev}
          />
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border bg-surface p-6 text-center text-sm text-muted">
          Nog geen Business Profile-koppeling voor deze site.{' '}
          <Link href="/settings" className="font-medium text-secondary underline">
            Koppel er een in Instellingen
          </Link>
          .
        </div>
      )}
    </div>
  )
}
