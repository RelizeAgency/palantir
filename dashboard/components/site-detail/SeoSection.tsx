import Link from 'next/link'
import type { DailyGa4SiteMetricRow, Ga4SiteTotals, SeoPeriodTotals } from '@/lib/types'
import type { PeriodKey } from '@/lib/periods'
import { PeriodDropdown } from '@/components/sites/PeriodDropdown'
import { TrendBadge } from '@/components/sites/TrendBadge'
import { LineChartSeo } from '@/components/charts/LineChartSeo'
import { STAT_COLORS } from '@/lib/statColors'
import { GoogleAnalyticsSection } from '@/components/site-detail/GoogleAnalyticsSection'

// Rebuilt as its own self-contained section (not reusing the generic
// StatCard) — the card markup lives directly here so there's no shared
// component indirection between this section and the Leads section above it.
function SeoCard({
  label,
  value,
  current,
  previous,
  accentColor,
  invert,
}: {
  label: string
  value: string | number
  current: number
  previous: number
  accentColor?: string
  invert?: boolean
}) {
  return (
    <div
      className={`rounded-xl border bg-surface p-3 ${accentColor ? '' : 'border-border'}`}
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

export function SeoSection({
  seoPeriod,
  seoTotals,
  seoSeries,
  ga4Totals,
  ga4Daily,
}: {
  seoPeriod: PeriodKey
  seoTotals: SeoPeriodTotals | null
  seoSeries: { week: string; impressions: number; clicks: number }[]
  ga4Totals: Ga4SiteTotals
  ga4Daily: DailyGa4SiteMetricRow[]
}) {
  return (
    <div>
      <div className="mb-4 flex justify-start">
        <PeriodDropdown paramKey="seoPeriod" current={seoPeriod} />
      </div>

      <GoogleAnalyticsSection ga4Totals={ga4Totals} ga4Daily={ga4Daily} />

      <div className="mb-3 text-xs font-semibold tracking-wide text-secondary">Google Search Console</div>

      {seoTotals ? (
        <>
          <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <SeoCard
              label="Kliks"
              value={seoTotals.clicks_cur}
              current={seoTotals.clicks_cur}
              previous={seoTotals.clicks_prev}
              accentColor={STAT_COLORS.seoClicks}
            />
            <SeoCard
              label="Vertoningen"
              value={seoTotals.impressions_cur}
              current={seoTotals.impressions_cur}
              previous={seoTotals.impressions_prev}
              accentColor={STAT_COLORS.seoImpressions}
            />
            <SeoCard
              label="CTR"
              value={`${seoTotals.ctr_cur}%`}
              current={seoTotals.ctr_cur}
              previous={seoTotals.ctr_prev}
            />
            <SeoCard
              label="Gem. positie"
              value={seoTotals.avg_position_cur || '—'}
              current={seoTotals.avg_position_cur}
              previous={seoTotals.avg_position_prev}
              invert
            />
          </div>
          <div className="rounded-xl border border-border bg-surface p-4">
            <div className="mb-2 text-sm font-medium text-secondary">Vertoningen & kliks over tijd</div>
            <LineChartSeo data={seoSeries} />
          </div>
        </>
      ) : (
        <div className="rounded-xl border border-dashed border-border bg-surface p-6 text-center text-sm text-muted">
          Nog geen Search Console-koppeling voor deze site.{' '}
          <Link href="/settings" className="font-medium text-secondary underline">
            Koppel er een in Instellingen
          </Link>
          .
        </div>
      )}
    </div>
  )
}
