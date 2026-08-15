'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { PERIODS, type PeriodKey } from '@/lib/periods'
import { IconClock, IconChevronDown } from '@/components/icons'

// The standard date range selector used everywhere in the dashboard: a
// compact <select> (clock icon, custom chevron) that writes its chosen
// period to its own search-param key — letting multiple independent
// selectors coexist on one page (one per dashboard section) when needed.
export function PeriodDropdown({ paramKey, current }: { paramKey: string; current: PeriodKey }) {
  const router = useRouter()
  const searchParams = useSearchParams()

  function setPeriod(key: string) {
    const params = new URLSearchParams(searchParams)
    params.set(paramKey, key)
    router.push(`?${params.toString()}`)
  }

  return (
    <div className="relative">
      <IconClock className="pointer-events-none absolute top-1/2 left-2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
      <select
        value={current}
        onChange={(e) => setPeriod(e.target.value)}
        className="appearance-none rounded-md border border-border bg-bg py-1 pr-7 pl-7 text-xs text-secondary outline-none focus:border-accent"
      >
        {PERIODS.map((p) => (
          <option key={p.key} value={p.key}>
            {p.label}
          </option>
        ))}
      </select>
      <IconChevronDown className="pointer-events-none absolute top-1/2 right-2 h-3 w-3 -translate-y-1/2 text-muted" />
    </div>
  )
}
