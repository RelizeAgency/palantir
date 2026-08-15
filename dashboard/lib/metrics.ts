import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  DailyGa4SiteMetricRow,
  DailyMetricRow,
  DailySeoMetricRow,
  Ga4SiteTotals,
  GmbPeriodTotals,
  PeriodTotals,
  SeoPeriodTotals,
  Site,
} from '@/lib/types'
import type { PeriodRange } from '@/lib/periods'

export async function getActiveSites(supabase: SupabaseClient): Promise<Site[]> {
  const { data, error } = await supabase
    .from('sites')
    .select('*')
    .eq('status', 'active')
    .order('name')

  if (error) throw error
  return data
}

export async function getAllSites(supabase: SupabaseClient): Promise<Site[]> {
  const { data, error } = await supabase.from('sites').select('*').order('name')

  if (error) throw error
  return data
}

export async function getSitePeriodTotals(
  supabase: SupabaseClient,
  siteId: string,
  range: PeriodRange
): Promise<PeriodTotals> {
  const { data, error } = await supabase
    .rpc('get_site_period_totals', {
      p_site_id: siteId,
      p_cur_start: range.currentStart,
      p_cur_end: range.currentEnd,
      p_prev_start: range.previousStart,
      p_prev_end: range.previousEnd,
    })
    .single()

  if (error) throw error
  return data as PeriodTotals
}

export async function getSiteDailyMetrics(
  supabase: SupabaseClient,
  siteId: string,
  range: PeriodRange
): Promise<DailyMetricRow[]> {
  const { data, error } = await supabase
    .from('daily_metrics')
    .select('site_id, date, phone_clicks, whatsapp_clicks, form_leads, gmb_calls, total_leads')
    .eq('site_id', siteId)
    .gte('date', range.currentStart)
    .lte('date', range.currentEnd)
    .order('date')

  if (error) throw error
  return data
}

export async function getSiteSeoPeriodTotals(
  supabase: SupabaseClient,
  siteId: string,
  range: PeriodRange
): Promise<SeoPeriodTotals> {
  const { data, error } = await supabase
    .rpc('get_site_seo_period_totals', {
      p_site_id: siteId,
      p_cur_start: range.currentStart,
      p_cur_end: range.currentEnd,
      p_prev_start: range.previousStart,
      p_prev_end: range.previousEnd,
    })
    .single()

  if (error) throw error
  return data as SeoPeriodTotals
}

export async function getSiteDailySeoMetrics(
  supabase: SupabaseClient,
  siteId: string,
  range: PeriodRange
): Promise<DailySeoMetricRow[]> {
  const { data, error } = await supabase
    .from('daily_seo_metrics')
    .select('site_id, date, impressions, clicks, ctr, avg_position')
    .eq('site_id', siteId)
    .gte('date', range.currentStart)
    .lte('date', range.currentEnd)
    .order('date')

  if (error) throw error
  return data
}

export async function getSiteGmbPeriodTotals(
  supabase: SupabaseClient,
  siteId: string,
  range: PeriodRange
): Promise<GmbPeriodTotals> {
  const { data, error } = await supabase
    .rpc('get_site_gmb_period_totals', {
      p_site_id: siteId,
      p_cur_start: range.currentStart,
      p_cur_end: range.currentEnd,
      p_prev_start: range.previousStart,
      p_prev_end: range.previousEnd,
    })
    .single()

  if (error) throw error
  return data as GmbPeriodTotals
}

export async function getSiteGa4Totals(
  supabase: SupabaseClient,
  siteId: string,
  range: PeriodRange
): Promise<Ga4SiteTotals> {
  const { data, error } = await supabase
    .rpc('get_site_ga4_totals', {
      p_site_id: siteId,
      p_cur_start: range.currentStart,
      p_cur_end: range.currentEnd,
      p_prev_start: range.previousStart,
      p_prev_end: range.previousEnd,
    })
    .single()

  if (error) throw error
  return data as Ga4SiteTotals
}

export async function getSiteDailyGa4Metrics(
  supabase: SupabaseClient,
  siteId: string,
  range: PeriodRange
): Promise<DailyGa4SiteMetricRow[]> {
  const { data, error } = await supabase
    .from('daily_ga4_site_metrics')
    .select('site_id, date, total_users, sessions, engaged_sessions, engagement_seconds')
    .eq('site_id', siteId)
    .gte('date', range.currentStart)
    .lte('date', range.currentEnd)
    .order('date')

  if (error) throw error
  return data
}
