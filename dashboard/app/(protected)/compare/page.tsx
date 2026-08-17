import { Suspense } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import {
  getActiveSites,
  getSitePeriodTotals,
  getSiteDailyMetrics,
  getSiteSeoPeriodTotals,
  getSiteGa4Totals,
} from '@/lib/metrics'
import { getPeriodRange, type PeriodKey } from '@/lib/periods'
import { getThreeCalendarMonths, getThreeMonthFetchRange, getYearToDateRange } from '@/lib/calendarMonths'
import { bucketByCalendarMonth } from '@/lib/aggregate'
import type { Site } from '@/lib/types'
import { Tabs } from '@/components/site-detail/Tabs'
import { TabSkeleton } from '@/components/site-detail/TabSkeleton'
import { LeadsCompareSection } from '@/components/compare/LeadsCompareSection'
import { WaardeCompareSection } from '@/components/compare/WaardeCompareSection'
import { SeoCompareSection } from '@/components/compare/SeoCompareSection'

// Elke tab haalt zijn eigen data op voor allSites in een losse Suspense-
// boundary, zodat de pagina-shell + snelste tab meteen streamen i.p.v. te
// wachten tot alle 3 tabbladen klaar zijn. Elke tak haalt nog steeds data op
// voor allSites, niet alleen de aangevinkte sites (nodig omdat elke tabel
// altijd alle sites toont) — bij het huidige aantal sites verwaarloosbaar;
// als dit aantal fors groeit, is dat de volgende plek om te optimaliseren.

async function LeadsCompareSectionAsync({
  supabase,
  allSites,
  leadsPeriod,
  selectedIds,
}: {
  supabase: SupabaseClient
  allSites: Site[]
  leadsPeriod: PeriodKey
  selectedIds: string[]
}) {
  const leadsRange = getPeriodRange(leadsPeriod)
  const rows = await Promise.all(
    allSites.map(async (site) => ({
      site,
      totals: await getSitePeriodTotals(supabase, site.id, leadsRange),
    }))
  )
  return <LeadsCompareSection leadsPeriod={leadsPeriod} rows={rows} selectedIds={selectedIds} />
}

async function WaardeCompareSectionAsync({
  supabase,
  allSites,
  selectedIds,
}: {
  supabase: SupabaseClient
  allSites: Site[]
  selectedIds: string[]
}) {
  const calendarMonths = getThreeCalendarMonths()
  const rows = await Promise.all(
    allSites.map(async (site) => {
      const [daily, ytdDaily] = await Promise.all([
        getSiteDailyMetrics(supabase, site.id, getThreeMonthFetchRange(calendarMonths)),
        getSiteDailyMetrics(supabase, site.id, getYearToDateRange()),
      ])
      const buckets = bucketByCalendarMonth(daily, calendarMonths)
      const ytdLeads = ytdDaily.reduce((sum, row) => sum + row.total_leads, 0)
      return { site, lastMonthLeads: buckets[1].totalLeads, ytdLeads }
    })
  )
  return <WaardeCompareSection rows={rows} selectedIds={selectedIds} />
}

async function SeoCompareSectionAsync({
  supabase,
  allSites,
  seoPeriod,
  selectedIds,
}: {
  supabase: SupabaseClient
  allSites: Site[]
  seoPeriod: PeriodKey
  selectedIds: string[]
}) {
  const seoRange = getPeriodRange(seoPeriod)
  const rows = await Promise.all(
    allSites.map(async (site) => {
      const [seoTotals, ga4Totals] = await Promise.all([
        site.gsc_site_url ? getSiteSeoPeriodTotals(supabase, site.id, seoRange) : Promise.resolve(null),
        getSiteGa4Totals(supabase, site.id, seoRange),
      ])
      return { site, seoTotals, ga4Totals }
    })
  )
  return <SeoCompareSection seoPeriod={seoPeriod} rows={rows} selectedIds={selectedIds} />
}

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ leadsPeriod?: string; seoPeriod?: string; sites?: string }>
}) {
  const params = await searchParams
  const leadsPeriod = (params.leadsPeriod as PeriodKey) ?? 'month'
  const seoPeriod = (params.seoPeriod as PeriodKey) ?? 'month'

  const supabase = await createClient()
  const allSites = await getActiveSites(supabase)

  const selectedIds = params.sites
    ? params.sites.split(',').filter(Boolean)
    : allSites.slice(0, Math.min(3, allSites.length)).map((s) => s.id)

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-lg font-semibold text-primary">Sites vergelijken</h1>
      </div>

      <Tabs
        tabs={[
          {
            id: 'leads',
            label: 'Leads',
            content: (
              <Suspense fallback={<TabSkeleton />}>
                <LeadsCompareSectionAsync
                  supabase={supabase}
                  allSites={allSites}
                  leadsPeriod={leadsPeriod}
                  selectedIds={selectedIds}
                />
              </Suspense>
            ),
          },
          {
            id: 'waarde',
            label: 'Waarde',
            content: (
              <Suspense fallback={<TabSkeleton />}>
                <WaardeCompareSectionAsync supabase={supabase} allSites={allSites} selectedIds={selectedIds} />
              </Suspense>
            ),
          },
          {
            id: 'seo',
            label: 'SEO',
            content: (
              <Suspense fallback={<TabSkeleton />}>
                <SeoCompareSectionAsync
                  supabase={supabase}
                  allSites={allSites}
                  seoPeriod={seoPeriod}
                  selectedIds={selectedIds}
                />
              </Suspense>
            ),
          },
        ]}
      />
    </div>
  )
}
