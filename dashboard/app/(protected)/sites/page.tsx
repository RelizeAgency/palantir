import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getActiveSites, getSiteDailyMetrics, getSitePeriodTotals } from '@/lib/metrics'
import { getPeriodRange, type PeriodKey } from '@/lib/periods'
import { PeriodDropdown } from '@/components/sites/PeriodDropdown'
import { ViewToggle } from '@/components/sites/ViewToggle'
import { SiteCard } from '@/components/sites/SiteCard'
import { SitesTable } from '@/components/sites/SitesTable'

export default async function SitesPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; view?: string }>
}) {
  const params = await searchParams
  const period = (params.period as PeriodKey) ?? 'month'
  const view = params.view === 'table' ? 'table' : 'cards'
  const range = getPeriodRange(period)

  const supabase = await createClient()

  let sites: Awaited<ReturnType<typeof getActiveSites>> = []
  let loadError: string | null = null

  try {
    sites = await getActiveSites(supabase)
  } catch {
    loadError =
      'Kon geen sites laden. Zijn de Supabase-migraties al toegepast en zijn de env-variabelen ingesteld?'
  }

  if (loadError) {
    return (
      <div>
        <h1 className="mb-1 text-lg font-semibold text-primary">Sites</h1>
        <p className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
          {loadError}
        </p>
      </div>
    )
  }

  if (sites.length === 0) {
    return (
      <div>
        <h1 className="mb-1 text-lg font-semibold text-primary">Sites</h1>
        <p className="mt-4 rounded-lg border border-border bg-surface px-4 py-8 text-center text-sm text-secondary">
          Nog geen sites toegevoegd.{' '}
          <Link href="/settings" className="font-medium text-primary underline">
            Voeg er een toe in Instellingen
          </Link>
          .
        </p>
      </div>
    )
  }

  const rows = await Promise.all(
    sites.map(async (site) => {
      const [totals, daily] = await Promise.all([
        getSitePeriodTotals(supabase, site.id, range),
        getSiteDailyMetrics(supabase, site.id, range),
      ])
      return { site, totals, daily }
    })
  )

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-lg font-semibold text-primary">Sites</h1>
        <div className="flex items-center gap-3">
          <ViewToggle current={view} />
          <PeriodDropdown paramKey="period" current={period} />
        </div>
      </div>

      {view === 'cards' ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map(({ site, totals, daily }) => (
            <SiteCard key={site.id} site={site} totals={totals} daily={daily} />
          ))}
        </div>
      ) : (
        <SitesTable rows={rows.map(({ site, totals }) => ({ site, totals }))} />
      )}
    </div>
  )
}
