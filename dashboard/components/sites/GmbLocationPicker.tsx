'use client'

import { useEffect, useState, useTransition } from 'react'
import { updateSiteGmb } from '@/app/actions/sites'

type GmbLocation = { locationId: string; title: string; accountName: string }

export function GmbLocationPicker({ siteId }: { siteId: string }) {
  const [options, setOptions] = useState<GmbLocation[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState('')
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    fetch('/api/google/gmb-locations')
      .then((res) => res.json())
      .then((data) => {
        if (data.error) setError(data.error)
        else setOptions(data.locations)
      })
      .catch(() => setError('Kon Business Profile-locaties niet laden'))
  }, [])

  if (error) {
    // While Google's GBP API access request is pending, this is expected to
    // fail with a quota/permission error — surface that plainly instead of
    // dumping the raw API error JSON.
    const pending = /PERMISSION_DENIED|SERVICE_DISABLED|quota/i.test(error)
    return (
      <span className="text-xs text-amber-400" title={error}>
        {pending ? 'Nog geen toegang (wacht op Google-goedkeuring)' : 'Fout bij laden — zie console'}
      </span>
    )
  }
  if (!options) return <span className="text-xs text-muted">Laden...</span>
  if (options.length === 0) return <span className="text-xs text-muted">Geen Business Profile-locaties gevonden</span>

  return (
    <div className="flex items-center gap-2">
      <select
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
        className="rounded-md border border-border bg-bg px-2 py-1 text-xs text-primary"
      >
        <option value="">Kies Business Profile-locatie...</option>
        {options.map((o) => (
          <option key={o.locationId} value={o.locationId}>
            {o.title}
          </option>
        ))}
      </select>
      <button
        disabled={!selected || isPending}
        onClick={() => startTransition(() => updateSiteGmb(siteId, selected))}
        className="rounded-md bg-accent px-2 py-1 text-xs font-medium text-white disabled:opacity-50"
      >
        Koppelen
      </button>
    </div>
  )
}
