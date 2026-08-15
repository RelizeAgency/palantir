'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { logout } from '@/app/actions/auth'
import { IconGrid, IconScale, IconSettings, IconLogout } from '@/components/icons'

const NAV_LINKS = [
  { href: '/sites', label: 'Sites', icon: IconGrid },
  { href: '/compare', label: 'Vergelijken', icon: IconScale },
  { href: '/settings', label: 'Instellingen', icon: IconSettings },
]

export function Sidebar({ email }: { email: string }) {
  const pathname = usePathname()

  return (
    <aside className="flex h-full w-56 shrink-0 flex-col border-r border-border bg-surface">
      <div className="flex items-center gap-2 px-5 py-5">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-accent text-xs font-bold text-white">
          P
        </div>
        <span className="text-sm font-semibold text-primary">Palantir</span>
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-3">
        {NAV_LINKS.map((link) => {
          const active = pathname === link.href || pathname.startsWith(`${link.href}/`)
          const Icon = link.icon
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                active
                  ? 'bg-accent-soft text-accent'
                  : 'text-secondary hover:bg-surface-hover hover:text-primary'
              }`}
            >
              <Icon className="h-5 w-5" />
              {link.label}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-border px-3 py-4">
        <div className="mb-2 truncate px-3 text-xs text-muted">{email}</div>
        <form action={logout}>
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-secondary transition-colors hover:bg-surface-hover hover:text-primary"
          >
            <IconLogout className="h-5 w-5" />
            Uitloggen
          </button>
        </form>
      </div>
    </aside>
  )
}
