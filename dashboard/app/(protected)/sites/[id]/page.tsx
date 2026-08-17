import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import type { SupabaseClient } from '@supabase/supabase-js'
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
import { bucketByWeek, bucketByCalendarMonth, dailySeoSeries } from '@/lib/aggregate'
import { getThreeCalendarMonths, getThreeMonthFetchRange, getYearToDateRange } from '@/lib/calendarMonths'
import { LeadsSection } from '@/components/site-detail/LeadsSection'
import { GmbSection } from '@/components/site-detail/GmbSection'
import { SeoSection } from '@/components/site-detail/SeoSection'
import { ValueSection } from '@/components/site-detail/ValueSection'
import { Tabs } from '@/components/site-detail/Tabs'
import { TabSkeleton } from '@/components/site-detail/TabSkeleton'

// Elke tab haalt zijn eigen data op in een losse Suspense-boundary, zodat de
// pagina-shell + snelste tab meteen streamen i.p.v. te wachten tot alle 4
// secties klaar zijn. Instant tab-wisselen blijft behouden: de client-side
// Tabs-component krijgt alle 4 content-nodes meteen, ze poppen alleen los
// van elkaar in zodra hun data binnen is.

async function LeadsSectionAsync({
  supabase,
  siteId,
  leadsPeriod,
}: {
  supabase: SupabaseClient
  siteId: string
  leadsPeriod: PeriodKey
}) {
  const range = getPeriodRange(leadsPeriod)
  const [totals, daily] = await Promise.all([
    getSitePeriodTotals(supabase, siteId, range),
    getSiteDailyMetrics(supabase, siteId, range),
  ])
  const weekly = bucketByWeek(daily)
  return <LeadsSection leadsPeriod={leadsPeriod} totals={totals} weekly={weekly} />
}

async function GmbSectionAsync({
  supabase,
  siteId,
  gmbPeriod,
  hasGmb,
}: {
  supabase: SupabaseClient
  siteId: string
  gmbPeriod: PeriodKey
  hasGmb: boolean
}) {
  const range = getPeriodRange(gmbPeriod)
  const gmbTotals = hasGmb ? await getSiteGmbPeriodTotals(supabase, siteId, range) : null
  return <GmbSection gmbPeriod={gmbPeriod} gmbTotals={gmbTotals} />
}

async function SeoSectionAsync({
  supabase,
  siteId,
  seoPeriod,
  hasGsc,
}: {
  supabase: SupabaseClient
  siteId: string
  seoPeriod: PeriodKey
  hasGsc: boolean
}) {
  const range = getPeriodRange(seoPeriod)
  const [seoTotals, seoDaily, ga4Totals, ga4Daily] = await Promise.all([
    hasGsc ? getSiteSeoPeriodTotals(supabase, siteId, range) : Promise.resolve(null),
    hasGsc ? getSiteDailySeoMetrics(supabase, siteId, range) : Promise.resolve(null),
    getSiteGa4Totals(supabase, siteId, range),
    getSiteDailyGa4Metrics(supabase, siteId, range),
  ])
  const seoSeries = seoDaily ? dailySeoSeries(seoDaily) : []
  return (
    <SeoSection
      seoPeriod={seoPeriod}
      seoTotals={seoTotals}
      seoSeries={seoSeries}
      ga4Totals={ga4Totals}
      ga4Daily={ga4Daily}
    />
  )
}

async function ValueSectionAsync({
  supabase,
  siteId,
  leadValueEur,
}: {
  supabase: SupabaseClient
  siteId: string
  leadValueEur: number | null
}) {
  const calendarMonths = getThreeCalendarMonths()
  const [valueDaily, ytdDaily] = await Promise.all([
    getSiteDailyMetrics(supabase, siteId, getThreeMonthFetchRange(calendarMonths)),
    getSiteDailyMetrics(supabase, siteId, getYearToDateRange()),
  ])
  const monthlyValueBuckets = bucketByCalendarMonth(valueDaily, calendarMonths)
  const ytdLeads = ytdDaily.reduce((sum, row) => sum + row.total_leads, 0)
  return (
    <ValueSection siteId={siteId} leadValueEur={leadValueEur} months={monthlyValueBuckets} ytdLeads={ytdLeads} />
  )
}

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

  const supabase = await createClient()

  const { data: site, error: siteError } = await supabase.from('sites').select('*').eq('id', id).single()
  if (siteError || !site) notFound()

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
            content: (
              <Suspense fallback={<TabSkeleton />}>
                <LeadsSectionAsync supabase={supabase} siteId={id} leadsPeriod={leadsPeriod} />
              </Suspense>
            ),
          },
          {
            id: 'gmb',
            label: 'Google Business Profile',
            content: (
              <Suspense fallback={<TabSkeleton />}>
                <GmbSectionAsync
                  supabase={supabase}
                  siteId={id}
                  gmbPeriod={gmbPeriod}
                  hasGmb={!!site.gmb_location_id}
                />
              </Suspense>
            ),
          },
          {
            id: 'seo',
            label: 'SEO',
            content: (
              <Suspense fallback={<TabSkeleton />}>
                <SeoSectionAsync
                  supabase={supabase}
                  siteId={id}
                  seoPeriod={seoPeriod}
                  hasGsc={!!site.gsc_site_url}
                />
              </Suspense>
            ),
          },
          {
            id: 'value',
            label: 'Waarde',
            content: (
              <Suspense fallback={<TabSkeleton />}>
                <ValueSectionAsync supabase={supabase} siteId={id} leadValueEur={site.lead_value_eur} />
              </Suspense>
            ),
          },
        ]}
      />
    </div>
  )
}
