import 'server-only'
import { createServiceRoleClient } from '@/lib/supabase/serviceRole'

export const GOOGLE_OAUTH_SCOPE =
  'https://www.googleapis.com/auth/analytics.readonly https://www.googleapis.com/auth/webmasters.readonly https://www.googleapis.com/auth/business.manage'

export async function getGoogleConnectionStatus(): Promise<{ connected: boolean; email: string | null }> {
  const supabase = createServiceRoleClient()
  const { data } = await supabase
    .from('google_oauth_tokens')
    .select('google_account_email')
    .limit(1)
    .maybeSingle()

  return { connected: Boolean(data), email: data?.google_account_email ?? null }
}

type GA4Property = { propertyId: string; displayName: string; accountName: string }

async function getAccessToken(): Promise<string> {
  const supabase = createServiceRoleClient()
  const { data, error } = await supabase
    .from('google_oauth_tokens')
    .select('refresh_token')
    .limit(1)
    .maybeSingle()

  if (error || !data) throw new Error('Geen Google-koppeling gevonden')

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: data.refresh_token,
      grant_type: 'refresh_token',
    }),
  })

  if (!res.ok) throw new Error(`Token-refresh mislukt: ${await res.text()}`)
  const json = await res.json()
  return json.access_token as string
}

// Used by the "add site" GA4-property dropdown (GA4 Admin API).
export async function listGa4Properties(): Promise<GA4Property[]> {
  const accessToken = await getAccessToken()

  const res = await fetch('https://analyticsadmin.googleapis.com/v1beta/accountSummaries', {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) throw new Error(`GA4 Admin API-fout: ${await res.text()}`)

  const json = await res.json()
  const properties: GA4Property[] = []

  for (const account of json.accountSummaries ?? []) {
    for (const property of account.propertySummaries ?? []) {
      properties.push({
        propertyId: (property.property as string).replace('properties/', ''),
        displayName: property.displayName,
        accountName: account.displayName,
      })
    }
  }

  return properties
}

type GscSite = { siteUrl: string; permissionLevel: string }

// Used by the "koppel Search Console" dropdown per site (Search Console API).
export async function listGscSites(): Promise<GscSite[]> {
  const accessToken = await getAccessToken()

  const res = await fetch('https://www.googleapis.com/webmasters/v3/sites', {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) throw new Error(`Search Console API-fout: ${await res.text()}`)

  const json = await res.json()
  return (json.siteEntry ?? []).map((entry: { siteUrl: string; permissionLevel: string }) => ({
    siteUrl: entry.siteUrl,
    permissionLevel: entry.permissionLevel,
  }))
}

type GmbLocation = { locationId: string; title: string; accountName: string }

// Used by the "koppel Business Profile" dropdown per site. Two-step lookup:
// list accounts, then list locations per account (Account Management API +
// Business Information API — both gated behind the same GBP API access
// approval as the Performance API itself).
export async function listGmbLocations(): Promise<GmbLocation[]> {
  const accessToken = await getAccessToken()
  const headers = { Authorization: `Bearer ${accessToken}` }

  const accountsRes = await fetch('https://mybusinessaccountmanagement.googleapis.com/v1/accounts', {
    headers,
  })
  if (!accountsRes.ok) throw new Error(`Business Profile Account API-fout: ${await accountsRes.text()}`)
  const accountsJson = await accountsRes.json()

  const locations: GmbLocation[] = []

  for (const account of accountsJson.accounts ?? []) {
    const locationsRes = await fetch(
      `https://mybusinessbusinessinformation.googleapis.com/v1/${account.name}/locations?readMask=name,title`,
      { headers }
    )
    if (!locationsRes.ok) continue // skip accounts we can't list (e.g. no locations, no access)
    const locationsJson = await locationsRes.json()

    for (const location of locationsJson.locations ?? []) {
      locations.push({
        locationId: location.name as string, // "locations/{id}"
        title: location.title,
        accountName: account.accountName ?? account.name,
      })
    }
  }

  return locations
}
