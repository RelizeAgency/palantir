'use server'

import { revalidatePath } from 'next/cache'
import { requireUser } from '@/lib/auth/dal'
import { createServiceRoleClient } from '@/lib/supabase/serviceRole'
import { triggerBackfill } from '@/lib/sync'

export type SiteFormState = { error?: string } | undefined

export async function addSite(_state: SiteFormState, formData: FormData): Promise<SiteFormState> {
  await requireUser()

  const name = String(formData.get('name') ?? '').trim()
  const domain = String(formData.get('domain') ?? '').trim()
  const ga4PropertyId = String(formData.get('ga4_property_id') ?? '').trim()

  if (!name || !domain || !ga4PropertyId) {
    return { error: 'Vul naam, domein en GA4 property-ID in.' }
  }

  const supabase = createServiceRoleClient()
  const { data, error } = await supabase
    .from('sites')
    .insert({ name, domain, ga4_property_id: ga4PropertyId })
    .select('id')
    .single()

  if (error) {
    return { error: `Opslaan mislukt: ${error.message}` }
  }

  await triggerBackfill(data.id)
  revalidatePath('/sites')
  revalidatePath('/settings')
}

export async function updateSiteGsc(siteId: string, gscSiteUrl: string) {
  await requireUser()
  const supabase = createServiceRoleClient()
  const { error } = await supabase.from('sites').update({ gsc_site_url: gscSiteUrl }).eq('id', siteId)
  if (error) throw error
  revalidatePath('/settings')
  revalidatePath('/sites')
}

export async function updateSiteGmb(siteId: string, gmbLocationId: string) {
  await requireUser()
  const supabase = createServiceRoleClient()
  const { error } = await supabase.from('sites').update({ gmb_location_id: gmbLocationId }).eq('id', siteId)
  if (error) throw error
  revalidatePath('/settings')
  revalidatePath('/sites')
}

export async function removeSite(siteId: string) {
  await requireUser()
  const supabase = createServiceRoleClient()
  await supabase.from('sites').delete().eq('id', siteId)
  revalidatePath('/sites')
  revalidatePath('/settings')
}

export async function updateLeadValue(siteId: string, leadValueEur: number | null) {
  await requireUser()
  const supabase = createServiceRoleClient()
  const { error } = await supabase.from('sites').update({ lead_value_eur: leadValueEur }).eq('id', siteId)
  if (error) throw error
  revalidatePath(`/sites/${siteId}`)
}
