// Business Profile Performance API. profile_views is the sum of the 4
// impression surfaces (maps/search x desktop/mobile) — call_clicks is synced
// separately into daily_metrics (it's treated as a lead source), not here.
const DAILY_METRICS = [
  'CALL_CLICKS',
  'WEBSITE_CLICKS',
  'BUSINESS_DIRECTION_REQUESTS',
  'BUSINESS_IMPRESSIONS_DESKTOP_MAPS',
  'BUSINESS_IMPRESSIONS_DESKTOP_SEARCH',
  'BUSINESS_IMPRESSIONS_MOBILE_MAPS',
  'BUSINESS_IMPRESSIONS_MOBILE_SEARCH',
] as const

export type DailyGmbMetrics = {
  date: string // YYYY-MM-DD
  call_clicks: number
  website_clicks: number
  direction_requests: number
  profile_views: number
}

type DatedValue = { date: { year: number; month: number; day: number }; value?: string }
type MetricSeries = { dailyMetric: string; timeSeries?: { datedValues?: DatedValue[] } }

function isoDate(d: { year: number; month: number; day: number }): string {
  const mm = String(d.month).padStart(2, '0')
  const dd = String(d.day).padStart(2, '0')
  return `${d.year}-${mm}-${dd}`
}

export async function fetchDailyGmbMetrics(
  accessToken: string,
  gmbLocationId: string, // "locations/{id}"
  startDate: string, // YYYY-MM-DD
  endDate: string
): Promise<DailyGmbMetrics[]> {
  const [sy, sm, sd] = startDate.split('-')
  const [ey, em, ed] = endDate.split('-')

  const params = new URLSearchParams()
  for (const metric of DAILY_METRICS) params.append('dailyMetrics', metric)
  params.set('dailyRange.start_date.year', sy)
  params.set('dailyRange.start_date.month', String(Number(sm)))
  params.set('dailyRange.start_date.day', String(Number(sd)))
  params.set('dailyRange.end_date.year', ey)
  params.set('dailyRange.end_date.month', String(Number(em)))
  params.set('dailyRange.end_date.day', String(Number(ed)))

  const res = await fetch(
    `https://businessprofileperformance.googleapis.com/v1/${gmbLocationId}:fetchMultiDailyMetricsTimeSeries?${params}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )

  if (!res.ok) {
    throw new Error(`Business Profile Performance API-fout voor ${gmbLocationId}: ${await res.text()}`)
  }

  const json = (await res.json()) as {
    multiDailyMetricTimeSeries?: { dailyMetricTimeSeries?: MetricSeries[] }[]
  }

  const byDate = new Map<string, DailyGmbMetrics>()

  for (const group of json.multiDailyMetricTimeSeries ?? []) {
    for (const series of group.dailyMetricTimeSeries ?? []) {
      for (const dv of series.timeSeries?.datedValues ?? []) {
        const date = isoDate(dv.date)
        const value = Number(dv.value ?? 0)

        if (!byDate.has(date)) {
          byDate.set(date, {
            date,
            call_clicks: 0,
            website_clicks: 0,
            direction_requests: 0,
            profile_views: 0,
          })
        }
        const entry = byDate.get(date)!

        if (series.dailyMetric === 'CALL_CLICKS') entry.call_clicks += value
        else if (series.dailyMetric === 'WEBSITE_CLICKS') entry.website_clicks += value
        else if (series.dailyMetric === 'BUSINESS_DIRECTION_REQUESTS') entry.direction_requests += value
        else if (series.dailyMetric.startsWith('BUSINESS_IMPRESSIONS_')) entry.profile_views += value
      }
    }
  }

  return Array.from(byDate.values())
}
