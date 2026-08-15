'use client'

import { useState, type ReactNode } from 'react'

type Tab = { id: string; label: string; content: ReactNode }

export function Tabs({ tabs }: { tabs: Tab[] }) {
  const [activeId, setActiveId] = useState(tabs[0].id)
  const active = tabs.find((t) => t.id === activeId) ?? tabs[0]

  return (
    <div>
      <div className="mb-6 flex gap-6 border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveId(tab.id)}
            className={`-mb-px border-b-2 pb-3 text-sm font-medium transition-colors ${
              tab.id === activeId
                ? 'border-accent text-primary'
                : 'border-transparent text-secondary hover:text-primary'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {active.content}
    </div>
  )
}
