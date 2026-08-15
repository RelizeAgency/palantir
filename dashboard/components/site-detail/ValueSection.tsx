import type { MonthlyValueBucket } from '@/lib/aggregate'
import { LeadValueForm } from '@/components/site-detail/LeadValueForm'
import { StatCard } from '@/components/site-detail/StatCard'
import { BarChartMonthly } from '@/components/charts/BarChartMonthly'
import { formatEuro } from '@/lib/format'

export function ValueSection({
  siteId,
  leadValueEur,
  months,
  ytdLeads,
}: {
  siteId: string
  leadValueEur: number | null
  months: MonthlyValueBucket[]
  ytdLeads: number
}) {
  // months is oudste-eerst: [maand-2, vorige maand, huidige maand]
  const lastMonth = months[1]
  const monthBeforeThat = months[0]

  return (
    <div>
      <div className="mb-4">
        <LeadValueForm siteId={siteId} initialValue={leadValueEur} />
      </div>

      {leadValueEur === null ? (
        <p className="text-sm text-secondary">
          Vul een gemiddelde leadwaarde in om de potentiële omzet te zien.
        </p>
      ) : (
        <>
          <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <StatCard
              label="Potentiële omzet vorige maand"
              value={formatEuro(lastMonth.totalLeads * leadValueEur)}
              current={lastMonth.totalLeads * leadValueEur}
              previous={monthBeforeThat.totalLeads * leadValueEur}
              emphasize
            />
            <StatCard
              label="Potentiële omzet dit jaar (jan t/m nu)"
              value={formatEuro(ytdLeads * leadValueEur)}
              current={ytdLeads * leadValueEur}
              previous={ytdLeads * leadValueEur}
            />
          </div>

          <div className="rounded-xl border border-border bg-surface p-4">
            <div className="mb-2 text-sm font-medium text-secondary">Potentiële omzet per maand</div>
            <BarChartMonthly data={months} leadValueEur={leadValueEur} />
          </div>
        </>
      )}
    </div>
  )
}
