'use client'

import { useEffect, useState, useTransition } from 'react'
import { updateSiteGsc } from '@/app/actions/sites'

type GscSite = { siteUrl: string; permissionLevel: string }

export function GscSitePicker({ siteId }: { siteId: string }) {
  const [options, setOptions] = useState<GscSite[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState('')
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    fetch('/api/google/gsc-sites')
      .then((res) => res.json())
      .then((data) => {
        if (data.error) setError(data.error)
        else setOptions(data.sites)
      })
      .catch(() => setError('Kon Search Console-sites niet laden'))
  }, [])

  if (error) return <span className="text-xs text-danger">{error}</span>
  if (!options) return <span className="text-xs text-muted">Laden...</span>
  if (options.length === 0) return <span className="text-xs text-muted">Geen Search Console-sites gevonden</span>

  return (
    <div className="flex items-center gap-2">
      <select
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
        className="rounded-md border border-border bg-bg px-2 py-1 text-xs text-primary"
      >
        <option value="">Kies Search Console-property...</option>
        {options.map((o) => (
          <option key={o.siteUrl} value={o.siteUrl}>
            {o.siteUrl}
          </option>
        ))}
      </select>
      <button
        disabled={!selected || isPending}
        onClick={() => startTransition(() => updateSiteGsc(siteId, selected))}
        className="rounded-md bg-accent px-2 py-1 text-xs font-medium text-white disabled:opacity-50"
      >
        Koppelen
      </button>
    </div>
  )
}
