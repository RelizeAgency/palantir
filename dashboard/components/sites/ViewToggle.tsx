'use client'

import { useRouter, useSearchParams } from 'next/navigation'

type View = 'cards' | 'table'

export function ViewToggle({ current }: { current: View }) {
  const router = useRouter()
  const searchParams = useSearchParams()

  function setView(view: View) {
    const params = new URLSearchParams(searchParams)
    params.set('view', view)
    router.push(`?${params.toString()}`)
  }

  return (
    <div className="flex gap-1 text-xs">
      <button
        onClick={() => setView('cards')}
        className={`rounded-md px-2.5 py-1 font-medium transition-colors ${
          current === 'cards' ? 'bg-accent text-white' : 'border border-border text-secondary hover:bg-surface-hover'
        }`}
      >
        ▦ Kaarten
      </button>
      <button
        onClick={() => setView('table')}
        className={`rounded-md px-2.5 py-1 font-medium transition-colors ${
          current === 'table' ? 'bg-accent text-white' : 'border border-border text-secondary hover:bg-surface-hover'
        }`}
      >
        ☰ Tabel
      </button>
    </div>
  )
}
