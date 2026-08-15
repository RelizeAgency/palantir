import { createClient } from '@/lib/supabase/server'
import { getActiveSites, getSitePeriodTotals } from '@/lib/metrics'
import { getPeriodRange, type PeriodKey } from '@/lib/periods'
import { PeriodDropdown } from '@/components/sites/PeriodDropdown'
import { SiteMultiSelect } from '@/components/sites/SiteMultiSelect'
import { SitesTable } from '@/components/sites/SitesTable'
import { ComparisonBarChart } from '@/components/charts/ComparisonBarChart'

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; sites?: string }>
}) {
  const params = await searchParams
  const period = (params.period as PeriodKey) ?? 'month'
  const range = getPeriodRange(period)

  const supabase = await createClient()
  const allSites = await getActiveSites(supabase)

  const selectedIds = params.sites
    ? params.sites.split(',').filter(Boolean)
    : allSites.slice(0, Math.min(3, allSites.length)).map((s) => s.id)

  const selectedSites = allSites.filter((s) => selectedIds.includes(s.id))

  const rows = await Promise.all(
    selectedSites.map(async (site) => ({
      site,
      totals: await getSitePeriodTotals(supabase, site.id, range),
    }))
  )

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-lg font-semibold text-primary">Sites vergelijken</h1>
        <PeriodDropdown paramKey="period" current={period} />
      </div>

      <div className="mb-5">
        <SiteMultiSelect sites={allSites} selectedIds={selectedIds} />
      </div>

      {rows.length === 0 ? (
        <p className="rounded-lg border border-border bg-surface px-4 py-8 text-center text-sm text-secondary">
          Selecteer minstens één site om te vergelijken.
        </p>
      ) : (
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-surface p-4">
            <ComparisonBarChart
              data={rows.map(({ site, totals }) => ({ name: site.name, total_leads: totals.total_leads_cur }))}
            />
          </div>
          <SitesTable rows={rows} />
        </div>
      )}
    </div>
  )
}
