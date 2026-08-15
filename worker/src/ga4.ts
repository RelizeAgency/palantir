// GA4 event names produced by lib/analytics.ts on all lead-machine sites.
// form_leads counts 'generate_lead' (fired after a CONFIRMED submission),
// deliberately NOT 'form_submit' (fires on attempt, before confirmation).
const TRACKED_EVENTS = ['phone_call_click', 'WhatsApp-knop', 'generate_lead'] as const

export type DailyGa4Metrics = {
  date: string // YYYY-MM-DD
  phone_clicks: number
  whatsapp_clicks: number
  form_leads: number
}

type Ga4Row = {
  dimensionValues: { value: string }[]
  metricValues: { value: string }[]
}

function formatGa4Date(raw: string): string {
  // GA4 returns dates as YYYYMMDD
  return `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`
}

export async function fetchDailyEventCounts(
  accessToken: string,
  ga4PropertyId: string,
  startDate: string,
  endDate: string
): Promise<DailyGa4Metrics[]> {
  const res = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${ga4PropertyId}:runReport`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: 'date' }, { name: 'eventName' }],
        metrics: [{ name: 'eventCount' }],
        dimensionFilter: {
          filter: {
            fieldName: 'eventName',
            inListFilter: { values: [...TRACKED_EVENTS] },
          },
        },
        limit: 100000,
      }),
    }
  )

  if (!res.ok) {
    throw new Error(`GA4 Data API-fout voor property ${ga4PropertyId}: ${await res.text()}`)
  }

  const json = (await res.json()) as { rows?: Ga4Row[] }
  const byDate = new Map<string, DailyGa4Metrics>()

  for (const row of json.rows ?? []) {
    const date = formatGa4Date(row.dimensionValues[0].value)
    const eventName = row.dimensionValues[1].value
    const count = Number(row.metricValues[0].value)

    if (!byDate.has(date)) {
      byDate.set(date, { date, phone_clicks: 0, whatsapp_clicks: 0, form_leads: 0 })
    }
    const entry = byDate.get(date)!

    if (eventName === 'phone_call_click') entry.phone_clicks += count
    else if (eventName === 'WhatsApp-knop') entry.whatsapp_clicks += count
    else if (eventName === 'generate_lead') entry.form_leads += count
  }

  return Array.from(byDate.values())
}
