import { createClient } from '@/lib/supabase/server'
import { getActiveSites, getSitePeriodTotals, getSiteDailyMetrics } from '@/lib/metrics'
import { getPeriodRange, type PeriodKey } from '@/lib/periods'
import { getThreeCalendarMonths, getThreeMonthFetchRange } from '@/lib/calendarMonths'
import { bucketByCalendarMonth } from '@/lib/aggregate'
import { SiteMultiSelect } from '@/components/sites/SiteMultiSelect'
import { Tabs } from '@/components/site-detail/Tabs'
import { LeadsCompareSection } from '@/components/compare/LeadsCompareSection'
import { WaardeCompareSection } from '@/components/compare/WaardeCompareSection'

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ leadsPeriod?: string; sites?: string }>
}) {
  const params = await searchParams
  const leadsPeriod = (params.leadsPeriod as PeriodKey) ?? 'month'
  const leadsRange = getPeriodRange(leadsPeriod)

  const supabase = await createClient()
  const allSites = await getActiveSites(supabase)

  const selectedIds = params.sites
    ? params.sites.split(',').filter(Boolean)
    : allSites.slice(0, Math.min(3, allSites.length)).map((s) => s.id)

  const selectedSites = allSites.filter((s) => selectedIds.includes(s.id))

  const calendarMonths = getThreeCalendarMonths()

  const [rows, waardeRows] = await Promise.all([
    Promise.all(
      selectedSites.map(async (site) => ({
        site,
        totals: await getSitePeriodTotals(supabase, site.id, leadsRange),
      }))
    ),
    Promise.all(
      selectedSites.map(async (site) => {
        const daily = await getSiteDailyMetrics(supabase, site.id, getThreeMonthFetchRange(calendarMonths))
        const buckets = bucketByCalendarMonth(daily, calendarMonths)
        return { site, lastMonthLeads: buckets[1].totalLeads }
      })
    ),
  ])

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-lg font-semibold text-primary">Sites vergelijken</h1>
      </div>

      <div className="mb-5">
        <SiteMultiSelect sites={allSites} selectedIds={selectedIds} />
      </div>

      <Tabs
        tabs={[
          {
            id: 'leads',
            label: 'Leads',
            content: <LeadsCompareSection leadsPeriod={leadsPeriod} rows={rows} />,
          },
          {
            id: 'waarde',
            label: 'Waarde',
            content: <WaardeCompareSection rows={waardeRows} />,
          },
        ]}
      />
    </div>
  )
}
