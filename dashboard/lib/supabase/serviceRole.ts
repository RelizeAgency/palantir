import 'server-only'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// Bypasses RLS entirely — only use for the Google OAuth token exchange and
// other server-only writes. Never expose this client (or its result) to the browser.
export function createServiceRoleClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}
