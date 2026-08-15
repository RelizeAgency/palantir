import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import {
  getSiteDailyGa4Metrics,
  getSiteDailyMetrics,
  getSiteDailySeoMetrics,
  getSiteGa4Totals,
  getSiteGmbPeriodTotals,
  getSitePeriodTotals,
  getSiteSeoPeriodTotals,
} from '@/lib/metrics'
import { getPeriodRange, type PeriodKey } from '@/lib/periods'
import { bucketByWeek, dailySeoSeries } from '@/lib/aggregate'
import { LeadsSection } from '@/components/site-detail/LeadsSection'
import { GmbSection } from '@/components/site-detail/GmbSection'
import { SeoSection } from '@/components/site-detail/SeoSection'
import { Tabs } from '@/components/site-detail/Tabs'

export default async function SiteDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ leadsPeriod?: string; gmbPeriod?: string; seoPeriod?: string }>
}) {
  const { id } = await params
  const sp = await searchParams
  const leadsPeriod = (sp.leadsPeriod as PeriodKey) ?? 'month'
  const gmbPeriod = (sp.gmbPeriod as PeriodKey) ?? 'month'
  const seoPeriod = (sp.seoPeriod as PeriodKey) ?? 'month'

  const leadsRange = getPeriodRange(leadsPeriod)
  const gmbRange = getPeriodRange(gmbPeriod)
  const seoRange = getPeriodRange(seoPeriod)

  const supabase = await createClient()

  const { data: site, error: siteError } = await supabase.from('sites').select('*').eq('id', id).single()
  if (siteError || !site) notFound()

  const [totals, daily] = await Promise.all([
    getSitePeriodTotals(supabase, id, leadsRange),
    getSiteDailyMetrics(supabase, id, leadsRange),
  ])

  const weekly = bucketByWeek(daily)

  const [seoTotals, seoDaily] = site.gsc_site_url
    ? await Promise.all([
        getSiteSeoPeriodTotals(supabase, id, seoRange),
        getSiteDailySeoMetrics(supabase, id, seoRange),
      ])
    : [null, null]

  const seoSeries = seoDaily ? dailySeoSeries(seoDaily) : []

  const gmbTotals = site.gmb_location_id ? await getSiteGmbPeriodTotals(supabase, id, gmbRange) : null

  const [ga4Totals, ga4Daily] = await Promise.all([
    getSiteGa4Totals(supabase, id, seoRange),
    getSiteDailyGa4Metrics(supabase, id, seoRange),
  ])

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-lg font-semibold text-primary">{site.name}</h1>
        <p className="text-xs text-secondary">{site.domain}</p>
      </div>

      <Tabs
        tabs={[
          {
            id: 'leads',
            label: 'Leads',
            content: <LeadsSection leadsPeriod={leadsPeriod} totals={totals} weekly={weekly} />,
          },
          {
            id: 'gmb',
            label: 'Google Business Profile',
            content: <GmbSection gmbPeriod={gmbPeriod} gmbTotals={gmbTotals} />,
          },
          {
            id: 'seo',
            label: 'SEO',
            content: (
              <SeoSection
                seoPeriod={seoPeriod}
                seoTotals={seoTotals}
                seoSeries={seoSeries}
                ga4Totals={ga4Totals}
                ga4Daily={ga4Daily}
              />
            ),
          },
        ]}
      />
    </div>
  )
}
