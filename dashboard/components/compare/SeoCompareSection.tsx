import type { Ga4SiteTotals, SeoPeriodTotals, Site } from '@/lib/types'
import type { PeriodKey } from '@/lib/periods'
import { formatDuration } from '@/lib/format'
import { PeriodDropdown } from '@/components/sites/PeriodDropdown'
import { SeoComparisonBarChart, type SeoComparisonRow } from '@/components/charts/SeoComparisonBarChart'
import { SiteToggleCheckbox } from '@/components/sites/SiteToggleCheckbox'

export type SeoCompareRow = {
  site: Site
  seoTotals: SeoPeriodTotals | null
  ga4Totals: Ga4SiteTotals
}

export function SeoCompareSection({
  seoPeriod,
  rows,
  selectedIds,
}: {
  seoPeriod: PeriodKey
  rows: SeoCompareRow[]
  selectedIds: string[]
}) {
  const chartData: SeoComparisonRow[] = rows
    .filter((r) => selectedIds.includes(r.site.id) && r.seoTotals !== null)
    .map((r) => ({
      name: r.site.name,
      value: (r.seoTotals as SeoPeriodTotals).clicks_cur,
    }))

  return (
    <div>
      <div className="mb-4 flex justify-start">
        <PeriodDropdown paramKey="seoPeriod" current={seoPeriod} />
      </div>

      <div className="space-y-4">
        <div className="rounded-xl border border-border bg-surface p-4">
          {chartData.length === 0 ? (
            <p className="py-8 text-center text-sm text-secondary">
              Vink minstens één site met een Search Console-koppeling aan om te vergelijken.
            </p>
          ) : (
            <SeoComparisonBarChart data={chartData} />
          )}
        </div>

        <div className="overflow-hidden rounded-xl border border-border bg-surface">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-secondary">
                <th className="w-8 px-4 py-2"></th>
                <th className="px-4 py-2 font-medium">Site</th>
                <th className="px-4 py-2 font-medium">Vertoningen</th>
                <th className="px-4 py-2 font-medium">Organische kliks</th>
                <th className="px-4 py-2 font-medium">Totaal bezoekers</th>
                <th className="px-4 py-2 font-medium">Gem. engagement</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ site, seoTotals, ga4Totals }) => (
                <tr
                  key={site.id}
                  className={`border-b border-border last:border-0 ${
                    selectedIds.includes(site.id) ? '' : 'opacity-40'
                  }`}
                >
                  <td className="px-4 py-2.5">
                    <SiteToggleCheckbox siteId={site.id} siteName={site.name} selectedIds={selectedIds} />
                  </td>
                  <td className="px-4 py-2.5 font-medium text-primary">{site.name}</td>
                  <td className="px-4 py-2.5 text-secondary">
                    {seoTotals !== null ? seoTotals.impressions_cur : 'niet gekoppeld'}
                  </td>
                  <td className="px-4 py-2.5 text-secondary">
                    {seoTotals !== null ? seoTotals.clicks_cur : 'niet gekoppeld'}
                  </td>
                  <td className="px-4 py-2.5 text-secondary">{ga4Totals.total_users_cur}</td>
                  <td className="px-4 py-2.5 text-secondary">
                    {formatDuration(ga4Totals.avg_engagement_seconds_cur)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
