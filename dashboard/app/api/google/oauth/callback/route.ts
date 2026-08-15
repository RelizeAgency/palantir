import { NextResponse, type NextRequest } from 'next/server'
import { requireUser } from '@/lib/auth/dal'
import { createServiceRoleClient } from '@/lib/supabase/serviceRole'
import { GOOGLE_OAUTH_SCOPE } from '@/lib/google'

export async function GET(request: NextRequest) {
  await requireUser()

  const code = request.nextUrl.searchParams.get('code')
  if (!code) {
    return NextResponse.redirect(new URL('/settings?google_error=missing_code', request.url))
  }

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: process.env.GOOGLE_OAUTH_REDIRECT_URI!,
      code,
      grant_type: 'authorization_code',
    }),
  })

  if (!tokenRes.ok) {
    console.error('Google token exchange failed', await tokenRes.text())
    return NextResponse.redirect(new URL('/settings?google_error=token_exchange', request.url))
  }

  const tokens = await tokenRes.json()
  if (!tokens.refresh_token) {
    // Happens if the user already granted consent before without `prompt=consent`.
    // /oauth/start always sets prompt=consent, so this should be rare.
    return NextResponse.redirect(new URL('/settings?google_error=no_refresh_token', request.url))
  }

  let email: string | null = null
  try {
    const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    })
    if (userInfoRes.ok) {
      email = (await userInfoRes.json()).email ?? null
    }
  } catch {
    // non-fatal — email is only shown for display purposes
  }

  const supabase = createServiceRoleClient()
  await supabase.from('google_oauth_tokens').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabase.from('google_oauth_tokens').insert({
    google_account_email: email,
    refresh_token: tokens.refresh_token,
    scope: GOOGLE_OAUTH_SCOPE,
  })

  return NextResponse.redirect(new URL('/settings?google_connected=1', request.url))
}
