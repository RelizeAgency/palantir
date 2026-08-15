export type Site = {
  id: string
  name: string
  domain: string
  ga4_property_id: string
  ga4_property_display_name: string | null
  gsc_site_url: string | null
  gmb_location_id: string | null
  status: 'active' | 'paused'
  lead_value_eur: number | null
  created_at: string
}

export type DailyMetricRow = {
  site_id: string
  date: string
  phone_clicks: number
  whatsapp_clicks: number
  form_leads: number
  gmb_calls: number
  total_leads: number
}

export type PeriodTotals = {
  phone_clicks_cur: number
  whatsapp_clicks_cur: number
  form_leads_cur: number
  gmb_calls_cur: number
  total_leads_cur: number
  phone_clicks_prev: number
  whatsapp_clicks_prev: number
  form_leads_prev: number
  gmb_calls_prev: number
  total_leads_prev: number
}

export type GmbPeriodTotals = {
  profile_views_cur: number
  website_clicks_cur: number
  direction_requests_cur: number
  profile_views_prev: number
  website_clicks_prev: number
  direction_requests_prev: number
}

export type DailySeoMetricRow = {
  site_id: string
  date: string
  impressions: number
  clicks: number
  ctr: number | null
  avg_position: number | null
}

export type SeoPeriodTotals = {
  impressions_cur: number
  clicks_cur: number
  ctr_cur: number
  avg_position_cur: number
  impressions_prev: number
  clicks_prev: number
  ctr_prev: number
  avg_position_prev: number
}

export type Ga4SiteTotals = {
  total_users_cur: number
  avg_engagement_seconds_cur: number
  total_users_prev: number
  avg_engagement_seconds_prev: number
}

export type DailyGa4SiteMetricRow = {
  site_id: string
  date: string
  total_users: number
  sessions: number
  engaged_sessions: number
  engagement_seconds: number
}
