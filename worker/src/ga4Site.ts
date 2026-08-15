// Full-site Google Analytics data for the SEO tab's "Google Analytics"
// section — separate from ga4.ts, which only tracks the 3 lead-conversion
// events. bounce_rate isn't stored directly (a ratio can't be validly
// averaged across days); engaged_sessions/sessions are stored so the
// dashboard can derive per-day bounce rate and period-aggregated bounce
// rate itself, same approach as ctr/avg_position for Search Console.

type Ga4Row = {
  dimensionValues: { value: string }[]
  metricValues: { value: string }[]
}

function formatGa4Date(raw: string): string {
  return `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`
}

async function runReport(accessToken: string, ga4PropertyId: string, body: unknown) {
  const res = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${ga4PropertyId}:runReport`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }
  )
  if (!res.ok) {
    throw new Error(`GA4 Data API-fout voor property ${ga4PropertyId}: ${await res.text()}`)
  }
  return (await res.json()) as { rows?: Ga4Row[] }
}

export type DailySiteMetrics = {
  date: string
  total_users: number
  sessions: number
  engaged_sessions: number
  engagement_seconds: number
}

export async function fetchDailySiteMetrics(
  accessToken: string,
  ga4PropertyId: string,
  startDate: string,
  endDate: string
): Promise<DailySiteMetrics[]> {
  const json = await runReport(accessToken, ga4PropertyId, {
    dateRanges: [{ startDate, endDate }],
    dimensions: [{ name: 'date' }],
    metrics: [
      { name: 'totalUsers' },
      { name: 'sessions' },
      { name: 'engagedSessions' },
      { name: 'userEngagementDuration' },
    ],
  })

  return (json.rows ?? []).map((row) => ({
    date: formatGa4Date(row.dimensionValues[0].value),
    total_users: Number(row.metricValues[0].value),
    sessions: Number(row.metricValues[1].value),
    engaged_sessions: Number(row.metricValues[2].value),
    engagement_seconds: Number(row.metricValues[3].value),
  }))
}
