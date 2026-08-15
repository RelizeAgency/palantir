import type { PeriodTotals, Site } from '@/lib/types'
import type { PeriodKey } from '@/lib/periods'
import { PeriodDropdown } from '@/components/sites/PeriodDropdown'
import { ComparisonBarChart, type ComparisonBarRow } from '@/components/charts/ComparisonBarChart'
import { SitesTable } from '@/components/sites/SitesTable'

export function LeadsCompareSection({
  leadsPeriod,
  rows,
}: {
  leadsPeriod: PeriodKey
  rows: { site: Site; totals: PeriodTotals }[]
}) {
  const chartData: ComparisonBarRow[] = rows.map(({ site, totals }) => ({
    name: site.name,
    bel: totals.phone_clicks_cur,
    gmb: totals.gmb_calls_cur,
    whatsapp: totals.whatsapp_clicks_cur,
    form: totals.form_leads_cur,
  }))

  return (
    <div>
      <div className="mb-4 flex justify-start">
        <PeriodDropdown paramKey="leadsPeriod" current={leadsPeriod} />
      </div>

      {rows.length === 0 ? (
        <p className="rounded-lg border border-border bg-surface px-4 py-8 text-center text-sm text-secondary">
          Selecteer minstens één site om te vergelijken.
        </p>
      ) : (
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-surface p-4">
            <ComparisonBarChart data={chartData} />
          </div>
          <SitesTable rows={rows} />
        </div>
      )}
    </div>
  )
}
