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
import { Tabs } from '@/components/site-detail/Tabs'
import { LeadsCompareSection } from '@/components/compare/LeadsCompareSection'
import { WaardeCompareSection } from '@/components/compare/WaardeCompareSection'
import { SeoCompareSection } from '@/components/compare/SeoCompareSection'

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ leadsPeriod?: string; seoPeriod?: string; sites?: string }>
}) {
  const params = await searchParams
  const leadsPeriod = (params.leadsPeriod as PeriodKey) ?? 'month'
  const leadsRange = getPeriodRange(leadsPeriod)
  const seoPeriod = (params.seoPeriod as PeriodKey) ?? 'month'
  const seoRange = getPeriodRange(seoPeriod)

  const supabase = await createClient()
  const allSites = await getActiveSites(supabase)

  const selectedIds = params.sites
    ? params.sites.split(',').filter(Boolean)
    : allSites.slice(0, Math.min(3, allSites.length)).map((s) => s.id)

  const calendarMonths = getThreeCalendarMonths()

  const [rows, waardeRows, seoRows] = await Promise.all([
    Promise.all(
      allSites.map(async (site) => ({
        site,
        totals: await getSitePeriodTotals(supabase, site.id, leadsRange),
      }))
    ),
    Promise.all(
      allSites.map(async (site) => {
        const daily = await getSiteDailyMetrics(supabase, site.id, getThreeMonthFetchRange(calendarMonths))
        const buckets = bucketByCalendarMonth(daily, calendarMonths)
        const ytdDaily = await getSiteDailyMetrics(supabase, site.id, getYearToDateRange())
        const ytdLeads = ytdDaily.reduce((sum, row) => sum + row.total_leads, 0)
        return { site, lastMonthLeads: buckets[1].totalLeads, ytdLeads }
      })
    ),
    Promise.all(
      allSites.map(async (site) => ({
        site,
        seoTotals: site.gsc_site_url ? await getSiteSeoPeriodTotals(supabase, site.id, seoRange) : null,
        ga4Totals: await getSiteGa4Totals(supabase, site.id, seoRange),
      }))
    ),
  ])

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
            content: <LeadsCompareSection leadsPeriod={leadsPeriod} rows={rows} selectedIds={selectedIds} />,
          },
          {
            id: 'waarde',
            label: 'Waarde',
            content: <WaardeCompareSection rows={waardeRows} selectedIds={selectedIds} />,
          },
          {
            id: 'seo',
            label: 'SEO',
            content: <SeoCompareSection seoPeriod={seoPeriod} rows={seoRows} selectedIds={selectedIds} />,
          },
        ]}
      />
    </div>
  )
}
