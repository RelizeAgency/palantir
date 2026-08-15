import type { SupabaseClient } from '@supabase/supabase-js'
import type { Env } from './index'

// Exchanges the single stored refresh_token for a short-lived access_token.
// Called once per sync run and reused across all sites — well under the
// token's ~1hr lifetime.
export async function getAccessToken(env: Env, supabase: SupabaseClient): Promise<string> {
  const { data, error } = await supabase
    .from('google_oauth_tokens')
    .select('refresh_token')
    .limit(1)
    .maybeSingle()

  if (error || !data) {
    throw new Error('Geen Google-koppeling gevonden (google_oauth_tokens is leeg)')
  }

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      refresh_token: data.refresh_token,
      grant_type: 'refresh_token',
    }),
  })

  if (!res.ok) {
    throw new Error(`Google token-refresh mislukt: ${await res.text()}`)
  }

  const json = (await res.json()) as { access_token: string }
  return json.access_token
}
