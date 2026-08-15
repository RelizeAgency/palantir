import { getAccessToken } from './googleAuth'
import { fetchDailyEventCounts } from './ga4'
import { fetchDailySearchAnalytics } from './gsc'
import { fetchDailyGmbMetrics } from './gmb'
import { fetchDailySiteMetrics } from './ga4Site'
import { getActiveSites, getSupabase, type Site } from './supabase'

export interface Env {
  SUPABASE_URL: string
  SUPABASE_SERVICE_ROLE_KEY: string
  GOOGLE_CLIENT_ID: string
  GOOGLE_CLIENT_SECRET: string
  SYNC_TRIGGER_SECRET: string
}

function isoDateDaysAgo(days: number): string {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() - days)
  return d.toISOString().slice(0, 10)
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

type SyncSummary = { site: string; status: 'success' | 'error'; rows?: number; error?: string }

async function runSync(env: Env, opts: { days: number; siteId?: string }): Promise<SyncSummary[]> {
  const supabase = getSupabase(env)
  const runStartedAt = new Date().toISOString()

  let sites: Site[]
  if (opts.siteId) {
    const { data, error } = await supabase
      .from('sites')
      .select('id, name, ga4_property_id, gsc_site_url, gmb_location_id, status')
      .eq('id', opts.siteId)
      .single()
    if (error || !data) {
      await supabase.from('sync_log').insert({
        site_id: opts.siteId,
        source: 'ga4',
        run_started_at: runStartedAt,
        run_finished_at: new Date().toISOString(),
        status: 'error',
        error_message: `Site niet gevonden: ${opts.siteId}`,
      })
      return [{ site: opts.siteId, status: 'error', error: 'not found' }]
    }
    sites = [data]
  } else {
    sites = await getActiveSites(supabase)
  }

  let accessToken: string
  try {
    accessToken = await getAccessToken(env, supabase)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    await supabase.from('sync_log').insert({
      site_id: null,
      source: 'ga4',
      run_started_at: runStartedAt,
      run_finished_at: new Date().toISOString(),
      status: 'error',
      error_message: message,
    })
    return [{ site: 'ALL', status: 'error', error: message }]
  }

  const startDate = isoDateDaysAgo(opts.days)
  const endDate = todayIso()
  const summaries: SyncSummary[] = []

  for (const site of sites) {
    const started = new Date().toISOString()
    try {
      const daily = await fetchDailyEventCounts(accessToken, site.ga4_property_id, startDate, endDate)

      if (daily.length > 0) {
        const { error } = await supabase.from('daily_metrics').upsert(
          daily.map((row) => ({
            site_id: site.id,
            date: row.date,
            phone_clicks: row.phone_clicks,
            whatsapp_clicks: row.whatsapp_clicks,
            form_leads: row.form_leads,
            synced_at: new Date().toISOString(),
          })),
          { onConflict: 'site_id,date' }
        )
        if (error) throw error
      }

      await supabase.from('sync_log').insert({
        site_id: site.id,
        source: 'ga4',
        run_started_at: started,
        run_finished_at: new Date().toISOString(),
        status: 'success',
        rows_upserted: daily.length,
      })
      summaries.push({ site: site.name, status: 'success', rows: daily.length })
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      await supabase.from('sync_log').insert({
        site_id: site.id,
        source: 'ga4',
        run_started_at: started,
        run_finished_at: new Date().toISOString(),
        status: 'error',
        error_message: message,
      })
      summaries.push({ site: site.name, status: 'error', error: message })
    }

    {
      const ga4SiteStarted = new Date().toISOString()
      try {
        const siteDaily = await fetchDailySiteMetrics(accessToken, site.ga4_property_id, startDate, endDate)

        if (siteDaily.length > 0) {
          const { error } = await supabase.from('daily_ga4_site_metrics').upsert(
            siteDaily.map((row) => ({
              site_id: site.id,
              date: row.date,
              total_users: row.total_users,
              sessions: row.sessions,
              engaged_sessions: row.engaged_sessions,
              engagement_seconds: row.engagement_seconds,
              synced_at: new Date().toISOString(),
            })),
            { onConflict: 'site_id,date' }
          )
          if (error) throw error
        }

        await supabase.from('sync_log').insert({
          site_id: site.id,
          source: 'ga4_site',
          run_started_at: ga4SiteStarted,
          run_finished_at: new Date().toISOString(),
          status: 'success',
          rows_upserted: siteDaily.length,
        })
        summaries.push({
          site: `${site.name} (GA4 site)`,
          status: 'success',
          rows: siteDaily.length,
        })
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        await supabase.from('sync_log').insert({
          site_id: site.id,
          source: 'ga4_site',
          run_started_at: ga4SiteStarted,
          run_finished_at: new Date().toISOString(),
          status: 'error',
          error_message: message,
        })
        summaries.push({ site: `${site.name} (GA4 site)`, status: 'error', error: message })
      }
    }

    if (site.gsc_site_url) {
      const gscStarted = new Date().toISOString()
      try {
        const daily = await fetchDailySearchAnalytics(accessToken, site.gsc_site_url, startDate, endDate)

        if (daily.length > 0) {
          const { error } = await supabase.from('daily_seo_metrics').upsert(
            daily.map((row) => ({
              site_id: site.id,
              date: row.date,
              impressions: row.impressions,
              clicks: row.clicks,
              ctr: row.ctr,
              avg_position: row.avg_position,
              synced_at: new Date().toISOString(),
            })),
            { onConflict: 'site_id,date' }
          )
          if (error) throw error
        }

        await supabase.from('sync_log').insert({
          site_id: site.id,
          source: 'gsc',
          run_started_at: gscStarted,
          run_finished_at: new Date().toISOString(),
          status: 'success',
          rows_upserted: daily.length,
        })
        summaries.push({ site: `${site.name} (GSC)`, status: 'success', rows: daily.length })
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        await supabase.from('sync_log').insert({
          site_id: site.id,
          source: 'gsc',
          run_started_at: gscStarted,
          run_finished_at: new Date().toISOString(),
          status: 'error',
          error_message: message,
        })
        summaries.push({ site: `${site.name} (GSC)`, status: 'error', error: message })
      }
    }

    if (site.gmb_location_id) {
      const gmbStarted = new Date().toISOString()
      try {
        const daily = await fetchDailyGmbMetrics(accessToken, site.gmb_location_id, startDate, endDate)

        if (daily.length > 0) {
          // call_clicks is a lead source and lives in daily_metrics (same
          // primary key as the GA4 upsert above) — this is a partial-column
          // upsert, so it only touches gmb_calls/synced_at and leaves the
          // GA4-sourced columns on the same row untouched.
          const { error: metricsError } = await supabase.from('daily_metrics').upsert(
            daily.map((row) => ({
              site_id: site.id,
              date: row.date,
              gmb_calls: row.call_clicks,
              synced_at: new Date().toISOString(),
            })),
            { onConflict: 'site_id,date' }
          )
          if (metricsError) throw metricsError

          const { error: gmbError } = await supabase.from('daily_gmb_metrics').upsert(
            daily.map((row) => ({
              site_id: site.id,
              date: row.date,
              profile_views: row.profile_views,
              website_clicks: row.website_clicks,
              direction_requests: row.direction_requests,
              synced_at: new Date().toISOString(),
            })),
            { onConflict: 'site_id,date' }
          )
          if (gmbError) throw gmbError
        }

        await supabase.from('sync_log').insert({
          site_id: site.id,
          source: 'gmb',
          run_started_at: gmbStarted,
          run_finished_at: new Date().toISOString(),
          status: 'success',
          rows_upserted: daily.length,
        })
        summaries.push({ site: `${site.name} (GMB)`, status: 'success', rows: daily.length })
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        await supabase.from('sync_log').insert({
          site_id: site.id,
          source: 'gmb',
          run_started_at: gmbStarted,
          run_finished_at: new Date().toISOString(),
          status: 'error',
          error_message: message,
        })
        summaries.push({ site: `${site.name} (GMB)`, status: 'error', error: message })
      }
    }
  }

  return summaries
}

export default {
  async scheduled(_event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    // 3-day lookback so late-processed GA4 data self-corrects via the
    // idempotent upsert on the next run.
    ctx.waitUntil(runSync(env, { days: 3 }))
  },

  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)

    if (request.headers.get('x-sync-secret') !== env.SYNC_TRIGGER_SECRET) {
      return new Response('Unauthorized', { status: 401 })
    }

    const days = Number(url.searchParams.get('days') ?? '3') || 3
    const siteId = url.searchParams.get('site_id') ?? undefined

    const summaries = await runSync(env, { days, siteId })
    return Response.json({ summaries })
  },
}
