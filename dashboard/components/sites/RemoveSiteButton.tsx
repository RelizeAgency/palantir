'use client'

import { removeSite } from '@/app/actions/sites'

export function RemoveSiteButton({ siteId }: { siteId: string }) {
  return (
    <button
      onClick={() => {
        if (confirm('Site verwijderen? Historische data blijft niet bewaard.')) {
          removeSite(siteId)
        }
      }}
      className="text-xs text-muted hover:text-danger"
    >
      Verwijderen
    </button>
  )
}
