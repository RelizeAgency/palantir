import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Env } from './index'

export function getSupabase(env: Env): SupabaseClient {
  return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

export type Site = {
  id: string
  name: string
  ga4_property_id: string
  gsc_site_url: string | null
  gmb_location_id: string | null
  status: 'active' | 'paused'
}

export async function getActiveSites(supabase: SupabaseClient): Promise<Site[]> {
  const { data, error } = await supabase
    .from('sites')
    .select('id, name, ga4_property_id, gsc_site_url, gmb_location_id, status')
    .eq('status', 'active')

  if (error) throw error
  return data
}
