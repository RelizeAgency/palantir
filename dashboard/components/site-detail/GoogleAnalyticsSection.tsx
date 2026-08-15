import type { DailyGa4SiteMetricRow, Ga4SiteTotals } from '@/lib/types'
import { dailyVisitorsSeries, monthlyEngagementSeries } from '@/lib/aggregate'
import { formatDuration } from '@/lib/format'
import { StatCard } from '@/components/site-detail/StatCard'
import { SimpleLineChart } from '@/components/charts/SimpleLineChart'
import { STAT_COLORS } from '@/lib/statColors'

export function GoogleAnalyticsSection({
  ga4Totals,
  ga4Daily,
}: {
  ga4Totals: Ga4SiteTotals
  ga4Daily: DailyGa4SiteMetricRow[]
}) {
  const visitors = dailyVisitorsSeries(ga4Daily)
  const engagement = monthlyEngagementSeries(ga4Daily)

  return (
    <div>
      <div className="mb-3 text-xs font-semibold tracking-wide text-secondary">Google Analytics</div>

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-2">
        <StatCard
          label="Totaal bezoekers"
          value={ga4Totals.total_users_cur}
          current={ga4Totals.total_users_cur}
          previous={ga4Totals.total_users_prev}
        />
        <StatCard
          label="Gem. engagement"
          value={formatDuration(ga4Totals.avg_engagement_seconds_cur)}
          current={ga4Totals.avg_engagement_seconds_cur}
          previous={ga4Totals.avg_engagement_seconds_prev}
        />
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-surface p-4">
          <div className="mb-2 text-sm font-medium text-secondary">Bezoekers over tijd</div>
          <SimpleLineChart data={visitors} color={STAT_COLORS.ga4Visitors} />
        </div>
        <div className="rounded-xl border border-border bg-surface p-4">
          <div className="mb-2 text-sm font-medium text-secondary">Gem. engagement per maand</div>
          <SimpleLineChart data={engagement} color={STAT_COLORS.ga4Engagement} format="duration" />
        </div>
      </div>
    </div>
  )
}
