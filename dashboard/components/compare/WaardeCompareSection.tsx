import type { Site } from '@/lib/types'
import { formatEuro } from '@/lib/format'
import { ValueComparisonBarChart, type ValueComparisonRow } from '@/components/charts/ValueComparisonBarChart'

export type WaardeCompareRow = {
  site: Site
  lastMonthLeads: number
}

export function WaardeCompareSection({ rows }: { rows: WaardeCompareRow[] }) {
  if (rows.length === 0) {
    return (
      <p className="rounded-lg border border-border bg-surface px-4 py-8 text-center text-sm text-secondary">
        Selecteer minstens één site om te vergelijken.
      </p>
    )
  }

  const chartData: ValueComparisonRow[] = rows
    .filter((r) => r.site.lead_value_eur !== null)
    .map((r) => ({
      name: r.site.name,
      value: r.lastMonthLeads * (r.site.lead_value_eur as number),
    }))

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-surface p-4">
        <ValueComparisonBarChart data={chartData} />
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-secondary">
              <th className="px-4 py-2 font-medium">Site</th>
              <th className="px-4 py-2 font-medium">Leads vorige maand</th>
              <th className="px-4 py-2 font-medium">Leadwaarde (€/lead)</th>
              <th className="px-4 py-2 font-medium">Potentiële omzet vorige maand</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ site, lastMonthLeads }) => (
              <tr key={site.id} className="border-b border-border last:border-0">
                <td className="px-4 py-2.5 font-medium text-primary">{site.name}</td>
                <td className="px-4 py-2.5 text-secondary">{lastMonthLeads}</td>
                <td className="px-4 py-2.5 text-secondary">
                  {site.lead_value_eur !== null ? formatEuro(site.lead_value_eur) : 'niet ingesteld'}
                </td>
                <td className="px-4 py-2.5 font-medium text-primary">
                  {site.lead_value_eur !== null
                    ? formatEuro(lastMonthLeads * site.lead_value_eur)
                    : 'niet ingesteld'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
