import { createClient } from '@/lib/supabase/server'
import { getAllSites } from '@/lib/metrics'
import { getGoogleConnectionStatus } from '@/lib/google'
import { AddSiteForm } from '@/components/sites/AddSiteForm'
import { RemoveSiteButton } from '@/components/sites/RemoveSiteButton'
import { GscSitePicker } from '@/components/sites/GscSitePicker'
import { GmbLocationPicker } from '@/components/sites/GmbLocationPicker'

export default async function SettingsPage() {
  const supabase = await createClient()

  let sites: Awaited<ReturnType<typeof getAllSites>> = []
  let loadError: string | null = null
  try {
    sites = await getAllSites(supabase)
  } catch {
    loadError = 'Kon sites niet laden — zijn de Supabase-migraties al toegepast?'
  }

  const { connected, email } = await getGoogleConnectionStatus()

  return (
    <div className="space-y-8">
      <div>
        <h1 className="mb-1 text-lg font-semibold text-primary">Instellingen</h1>
        <p className="text-sm text-secondary">Google-koppeling en sitebeheer.</p>
      </div>

      <section className="rounded-xl border border-border bg-surface p-5">
        <h2 className="mb-2 text-sm font-semibold text-primary">Google-koppeling</h2>
        {connected ? (
          <p className="text-sm text-secondary">
            Gekoppeld{email ? ` als ${email}` : ''}.{' '}
            <a href="/api/google/oauth/start" className="text-primary underline">
              Opnieuw koppelen
            </a>
          </p>
        ) : (
          <div>
            <p className="mb-3 text-sm text-secondary">
              Nog niet gekoppeld. Nodig om GA4-properties op te halen voor nieuwe sites.
            </p>
            <a
              href="/api/google/oauth/start"
              className="inline-block rounded-lg bg-accent px-3 py-2 text-sm font-medium text-white hover:bg-accent-hover"
            >
              Koppel Google-account
            </a>
          </div>
        )}
      </section>

      <section className="rounded-xl border border-border bg-surface p-5">
        <h2 className="mb-3 text-sm font-semibold text-primary">Site toevoegen</h2>
        <AddSiteForm />
      </section>

      <section className="rounded-xl border border-border bg-surface p-5">
        <h2 className="mb-3 text-sm font-semibold text-primary">Sites</h2>
        {loadError && <p className="text-sm text-amber-300">{loadError}</p>}
        {!loadError && sites.length === 0 && (
          <p className="text-sm text-secondary">Nog geen sites toegevoegd.</p>
        )}
        {!loadError && sites.length > 0 && (
          <ul className="divide-y divide-border">
            {sites.map((site) => (
              <li key={site.id} className="py-3 text-sm">
                <div className="mb-2 flex items-center justify-between gap-4">
                  <div>
                    <div className="font-medium text-primary">{site.name}</div>
                    <div className="text-xs text-secondary">
                      {site.domain} · GA4 {site.ga4_property_id} · {site.status}
                    </div>
                  </div>
                  <RemoveSiteButton siteId={site.id} />
                </div>
                <div className="flex flex-wrap items-center gap-x-6 gap-y-1.5 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-muted">Search Console:</span>
                    {site.gsc_site_url ? (
                      <span className="text-secondary">{site.gsc_site_url}</span>
                    ) : connected ? (
                      <GscSitePicker siteId={site.id} />
                    ) : (
                      <span className="text-muted">koppel eerst Google-account</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted">Business Profile:</span>
                    {site.gmb_location_id ? (
                      <span className="text-secondary">gekoppeld</span>
                    ) : connected ? (
                      <GmbLocationPicker siteId={site.id} />
                    ) : (
                      <span className="text-muted">koppel eerst Google-account</span>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
