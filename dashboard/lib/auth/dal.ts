import 'server-only'
import { redirect } from 'next/navigation'
import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'

// Authoritative session check — validates the JWT against Supabase, unlike
// reading the cookie alone. Cached per request so calling it from a layout
// and a page doesn't trigger duplicate network calls.
export const requireUser = cache(async () => {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return user
})
