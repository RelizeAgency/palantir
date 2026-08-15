export type DailySeoMetrics = {
  date: string // YYYY-MM-DD
  impressions: number
  clicks: number
  ctr: number
  avg_position: number
}

type GscRow = {
  keys: string[]
  clicks: number
  impressions: number
  ctr: number
  position: number
}

// Search Console's own data typically lags 1-3 days behind "today" — rows
// for the most recent days may simply be absent from the response, which is
// fine: the upsert is idempotent and self-corrects on the next nightly run.
export async function fetchDailySearchAnalytics(
  accessToken: string,
  gscSiteUrl: string,
  startDate: string,
  endDate: string
): Promise<DailySeoMetrics[]> {
  const res = await fetch(
    `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(gscSiteUrl)}/searchAnalytics/query`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        startDate,
        endDate,
        dimensions: ['date'],
        rowLimit: 25000,
      }),
    }
  )

  if (!res.ok) {
    throw new Error(`Search Console API-fout voor ${gscSiteUrl}: ${await res.text()}`)
  }

  const json = (await res.json()) as { rows?: GscRow[] }

  return (json.rows ?? []).map((row) => ({
    date: row.keys[0],
    impressions: row.impressions,
    clicks: row.clicks,
    ctr: row.ctr,
    avg_position: row.position,
  }))
}
