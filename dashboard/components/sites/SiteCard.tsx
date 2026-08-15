import Link from 'next/link'
import type { DailyMetricRow, PeriodTotals, Site } from '@/lib/types'
import { SparklineChart } from '@/components/charts/SparklineChart'
import { TrendBadge } from '@/components/sites/TrendBadge'

export function SiteCard({
  site,
  totals,
  daily,
}: {
  site: Site
  totals: PeriodTotals
  daily: DailyMetricRow[]
}) {
  return (
    <Link
      href={`/sites/${site.id}`}
      className="block rounded-xl border border-border bg-surface p-4 transition-colors hover:bg-surface-hover"
    >
      <div className="mb-1 text-sm font-medium text-primary">{site.name}</div>
      <div className="mb-2 flex items-baseline gap-2">
        <span className="text-2xl font-semibold text-primary">{totals.total_leads_cur}</span>
        <span className="text-xs text-secondary">leads</span>
        <TrendBadge current={totals.total_leads_cur} previous={totals.total_leads_prev} />
      </div>
      <SparklineChart data={daily} />
    </Link>
  )
}
