'use client'

import { useState, useTransition } from 'react'
import { updateLeadValue } from '@/app/actions/sites'

export function LeadValueForm({
  siteId,
  initialValue,
}: {
  siteId: string
  initialValue: number | null
}) {
  const [value, setValue] = useState(initialValue !== null ? String(initialValue) : '')
  const [isPending, startTransition] = useTransition()

  const parsed = value.trim() === '' ? null : Number(value)
  const isValid = value.trim() === '' || (Number.isFinite(parsed) && (parsed as number) >= 0)

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="lead-value" className="text-xs text-secondary">
        Gemiddelde waarde per lead (€)
      </label>
      <input
        id="lead-value"
        type="number"
        min="0"
        step="0.01"
        inputMode="decimal"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="w-24 rounded-md border border-border bg-bg px-2 py-1 text-xs text-primary"
      />
      <button
        disabled={!isValid || isPending}
        onClick={() => startTransition(() => updateLeadValue(siteId, parsed))}
        className="rounded-md bg-accent px-2 py-1 text-xs font-medium text-white disabled:opacity-50"
      >
        Opslaan
      </button>
    </div>
  )
}
