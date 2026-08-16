import Link from 'next/link'
import type { Site } from '@/lib/types'
import { formatEuro } from '@/lib/format'
import { ValueComparisonBarChart, type ValueComparisonRow } from '@/components/charts/ValueComparisonBarChart'
import { SiteToggleCheckbox } from '@/components/sites/SiteToggleCheckbox'

export type WaardeCompareRow = {
  site: Site
  lastMonthLeads: number
  ytdLeads: number
}

export function WaardeCompareSection({
  rows,
  selectedIds,
}: {
  rows: WaardeCompareRow[]
  selectedIds: string[]
}) {
  const chartData: ValueComparisonRow[] = rows
    .filter((r) => selectedIds.includes(r.site.id) && r.site.lead_value_eur !== null)
    .map((r) => ({
      name: r.site.name,
      value: r.lastMonthLeads * (r.site.lead_value_eur as number),
    }))

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-surface p-4">
        {chartData.length === 0 ? (
          <p className="py-8 text-center text-sm text-secondary">
            Vink minstens één site met een ingestelde leadwaarde aan om te vergelijken.
          </p>
        ) : (
          <ValueComparisonBarChart data={chartData} />
        )}
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-secondary">
              <th className="w-8 px-4 py-2"></th>
              <th className="px-4 py-2 font-medium">Site</th>
              <th className="px-4 py-2 font-medium">Leads vorige maand</th>
              <th className="px-4 py-2 font-medium">Leadwaarde (€/lead)</th>
              <th className="px-4 py-2 font-medium">Potentiële omzet vorige maand</th>
              <th className="px-4 py-2 font-medium">Potentiële omzet dit jaar (jan t/m nu)</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ site, lastMonthLeads, ytdLeads }) => (
              <tr
                key={site.id}
                className={`border-b border-border last:border-0 ${
                  selectedIds.includes(site.id) ? '' : 'opacity-40'
                }`}
              >
                <td className="px-4 py-2.5">
                  <SiteToggleCheckbox siteId={site.id} siteName={site.name} selectedIds={selectedIds} />
                </td>
                <td className="px-4 py-2.5">
                  <Link href={`/sites/${site.id}`} className="font-medium text-primary hover:text-accent">
                    {site.name}
                  </Link>
                </td>
                <td className="px-4 py-2.5 text-secondary">{lastMonthLeads}</td>
                <td className="px-4 py-2.5 text-secondary">
                  {site.lead_value_eur !== null ? formatEuro(site.lead_value_eur) : 'niet ingesteld'}
                </td>
                <td className="px-4 py-2.5 font-medium text-primary">
                  {site.lead_value_eur !== null
                    ? formatEuro(lastMonthLeads * site.lead_value_eur)
                    : 'niet ingesteld'}
                </td>
                <td className="px-4 py-2.5 font-medium text-primary">
                  {site.lead_value_eur !== null
                    ? formatEuro(ytdLeads * site.lead_value_eur)
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
