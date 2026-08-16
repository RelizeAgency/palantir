'use client'

import { useRouter, useSearchParams } from 'next/navigation'

export function SiteToggleCheckbox({
  siteId,
  selectedIds,
}: {
  siteId: string
  selectedIds: string[]
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const checked = selectedIds.includes(siteId)

  function toggle() {
    const next = checked ? selectedIds.filter((id) => id !== siteId) : [...selectedIds, siteId]
    const params = new URLSearchParams(searchParams)
    params.set('sites', next.join(','))
    router.push(`?${params.toString()}`)
  }

  return (
    <input
      type="checkbox"
      checked={checked}
      onChange={toggle}
      className="h-4 w-4 rounded border-border accent-accent"
    />
  )
}
