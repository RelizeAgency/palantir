'use client'

import { useActionState } from 'react'
import { addSite } from '@/app/actions/sites'

export function AddSiteForm() {
  const [state, action, pending] = useActionState(addSite, undefined)

  return (
    <form action={action} className="grid gap-3 sm:grid-cols-4 sm:items-end">
      <div className="sm:col-span-1">
        <label className="mb-1 block text-xs font-medium text-secondary">Naam</label>
        <input
          name="name"
          required
          placeholder="Loodgieter013.nl"
          className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-primary outline-none focus:border-accent"
        />
      </div>
      <div className="sm:col-span-1">
        <label className="mb-1 block text-xs font-medium text-secondary">Domein</label>
        <input
          name="domain"
          required
          placeholder="loodgieter013.nl"
          className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-primary outline-none focus:border-accent"
        />
      </div>
      <div className="sm:col-span-1">
        <label className="mb-1 block text-xs font-medium text-secondary">GA4 property-ID</label>
        <input
          name="ga4_property_id"
          required
          placeholder="123456789"
          className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-primary outline-none focus:border-accent"
        />
      </div>
      <div className="sm:col-span-1">
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg bg-accent px-3 py-2 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-50"
        >
          {pending ? 'Bezig...' : 'Site toevoegen'}
        </button>
      </div>
      {state?.error && <p className="text-sm text-danger sm:col-span-4">{state.error}</p>}
    </form>
  )
}
