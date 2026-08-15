import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth/dal'
import { GOOGLE_OAUTH_SCOPE } from '@/lib/google'

export async function GET() {
  await requireUser()

  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: process.env.GOOGLE_OAUTH_REDIRECT_URI!,
    response_type: 'code',
    scope: `${GOOGLE_OAUTH_SCOPE} openid email`,
    access_type: 'offline',
    prompt: 'consent',
  })

  return NextResponse.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`)
}
