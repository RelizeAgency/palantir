import type { DailyGa4SiteMetricRow, DailyMetricRow, DailySeoMetricRow } from '@/lib/types'

function formatDayLabel(dateStr: string): string {
  return new Date(`${dateStr}T00:00:00Z`).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })
}

export type WeeklyLeadsBucket = {
  week: string
  bel_total: number // phone_clicks + gmb_calls, combined — this is what the stacked bar renders
  phone_clicks: number // website calls — sub-breakdown of bel_total, shown in the tooltip
  gmb_calls: number // Google Business calls — sub-breakdown of bel_total, shown in the tooltip
  whatsapp_clicks: number
  form_leads: number
  total_leads: number
}

// "20 tot 26 jul" (same month) or "27 jul tot 2 aug" (crosses a month
// boundary) — shows the full week the bar covers, not just its start date.
// Months are abbreviated to 3 letters so the label stays short enough to
// render horizontally (0°) without overlapping its neighbors.
function formatWeekRange(monday: Date): string {
  const sunday = new Date(monday)
  sunday.setUTCDate(monday.getUTCDate() + 6)

  const startDay = monday.getUTCDate()
  const endDay = sunday.getUTCDate()
  const startMonth = monday.toLocaleDateString('nl-NL', { month: 'long' }).slice(0, 3)
  const endMonth = sunday.toLocaleDateString('nl-NL', { month: 'long' }).slice(0, 3)

  if (startMonth === endMonth) {
    return `${startDay} tot ${endDay} ${endMonth}`
  }
  return `${startDay} ${startMonth} tot ${endDay} ${endMonth}`
}

// Groups daily rows into ISO-week buckets (week starting Monday) for the
// weekly bar chart, keeping the per-source breakdown (not just the total) so
// the chart can render a stacked bar with a detailed tooltip.
export function bucketByWeek(rows: DailyMetricRow[]): WeeklyLeadsBucket[] {
  const buckets = new Map<
    string,
    { phone_clicks: number; gmb_calls: number; whatsapp_clicks: number; form_leads: number; total_leads: number }
  >()

  for (const row of rows) {
    const date = new Date(`${row.date}T00:00:00Z`)
    const day = date.getUTCDay() || 7 // Sunday (0) -> 7
    const monday = new Date(date)
    monday.setUTCDate(date.getUTCDate() - (day - 1))
    const key = monday.toISOString().slice(0, 10)

    const entry = buckets.get(key) ?? {
      phone_clicks: 0,
      gmb_calls: 0,
      whatsapp_clicks: 0,
      form_leads: 0,
      total_leads: 0,
    }
    entry.phone_clicks += row.phone_clicks
    entry.gmb_calls += row.gmb_calls
    entry.whatsapp_clicks += row.whatsapp_clicks
    entry.form_leads += row.form_leads
    entry.total_leads += row.total_leads
    buckets.set(key, entry)
  }

  return Array.from(buckets.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([week, values]) => ({
      week: formatWeekRange(new Date(`${week}T00:00:00Z`)),
      bel_total: values.phone_clicks + values.gmb_calls,
      ...values,
    }))
}

// One point per day (not bucketed), so the chart shows the same density of
// datapoints as Search Console's own graphs.
export function dailySeoSeries(
  rows: DailySeoMetricRow[]
): { week: string; impressions: number; clicks: number }[] {
  return [...rows]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((row) => ({
      week: formatDayLabel(row.date),
      impressions: row.impressions,
      clicks: row.clicks,
    }))
}

export type Ga4DailyPoint = { label: string; value: number }

// One point per day, so the chart shows the same density as the other
// per-day charts (Search Console etc).
export function dailyVisitorsSeries(rows: DailyGa4SiteMetricRow[]): Ga4DailyPoint[] {
  return [...rows]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((row) => ({ label: formatDayLabel(row.date), value: row.total_users }))
}

function formatMonthLabel(monthKey: string): string {
  const [year, month] = monthKey.split('-')
  const label = new Date(Date.UTC(Number(year), Number(month) - 1, 1)).toLocaleDateString('nl-NL', {
    month: 'short',
  })
  return `${label.slice(0, 3)} '${year.slice(2)}`
}

// One point per month — engagement is a ratio (engagement_seconds/sessions)
// so it's computed from the summed raw components of each month, never
// stored or averaged as a ratio directly (same reasoning as ctr/avg_position
// for Search Console). A daily engagement chart is too noisy to read
// trends from, so this buckets by month instead of by day.
export function monthlyEngagementSeries(rows: DailyGa4SiteMetricRow[]): Ga4DailyPoint[] {
  const buckets = new Map<string, { engagement_seconds: number; sessions: number }>()

  for (const row of rows) {
    const key = row.date.slice(0, 7) // YYYY-MM
    const entry = buckets.get(key) ?? { engagement_seconds: 0, sessions: 0 }
    entry.engagement_seconds += row.engagement_seconds
    entry.sessions += row.sessions
    buckets.set(key, entry)
  }

  return Array.from(buckets.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, values]) => ({
      label: formatMonthLabel(key),
      value: values.sessions > 0 ? Math.round((values.engagement_seconds / values.sessions) * 10) / 10 : 0,
    }))
}
