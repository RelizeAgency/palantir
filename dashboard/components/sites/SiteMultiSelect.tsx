'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import type { Site } from '@/lib/types'

export function SiteMultiSelect({ sites, selectedIds }: { sites: Site[]; selectedIds: string[] }) {
  const router = useRouter()
  const searchParams = useSearchParams()

  function toggle(id: string) {
    const next = selectedIds.includes(id)
      ? selectedIds.filter((s) => s !== id)
      : [...selectedIds, id]

    const params = new URLSearchParams(searchParams)
    params.set('sites', next.join(','))
    router.push(`?${params.toString()}`)
  }

  return (
    <div className="flex flex-wrap gap-2">
      {sites.map((site) => (
        <button
          key={site.id}
          onClick={() => toggle(site.id)}
          className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
            selectedIds.includes(site.id)
              ? 'bg-accent text-white'
              : 'border border-border text-secondary hover:bg-surface-hover'
          }`}
        >
          {site.name}
        </button>
      ))}
    </div>
  )
}
