import Link from 'next/link'
import type { PeriodTotals, Site } from '@/lib/types'
import { TrendBadge } from '@/components/sites/TrendBadge'
import { SiteToggleCheckbox } from '@/components/sites/SiteToggleCheckbox'

export function SitesTable({
  rows,
  selectedIds = rows.map((r) => r.site.id),
}: {
  rows: { site: Site; totals: PeriodTotals }[]
  selectedIds?: string[]
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs text-secondary">
            <th className="w-8 px-4 py-2"></th>
            <th className="px-4 py-2 font-medium">Site</th>
            <th className="px-4 py-2 font-medium">Bel (website)</th>
            <th className="px-4 py-2 font-medium">Bel (GMB)</th>
            <th className="px-4 py-2 font-medium">WhatsApp</th>
            <th className="px-4 py-2 font-medium">Formulier</th>
            <th className="px-4 py-2 font-medium">Totaal</th>
            <th className="px-4 py-2 font-medium">Trend</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ site, totals }) => (
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
              <td className="px-4 py-2.5 text-secondary">{totals.phone_clicks_cur}</td>
              <td className="px-4 py-2.5 text-secondary">{totals.gmb_calls_cur}</td>
              <td className="px-4 py-2.5 text-secondary">{totals.whatsapp_clicks_cur}</td>
              <td className="px-4 py-2.5 text-secondary">{totals.form_leads_cur}</td>
              <td className="px-4 py-2.5 font-medium text-primary">{totals.total_leads_cur}</td>
              <td className="px-4 py-2.5">
                <TrendBadge current={totals.total_leads_cur} previous={totals.total_leads_prev} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
