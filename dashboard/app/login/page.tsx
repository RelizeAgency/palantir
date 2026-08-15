'use client'

import { useActionState } from 'react'
import { login } from '@/app/actions/auth'

export default function LoginPage() {
  const [state, action, pending] = useActionState(login, undefined)

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4">
      <form
        action={action}
        className="w-full max-w-sm rounded-xl border border-border bg-surface p-8"
      >
        <div className="mb-6 flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-accent text-xs font-bold text-white">
            P
          </div>
          <h1 className="text-lg font-semibold text-primary">Palantir</h1>
        </div>
        <p className="mb-6 text-sm text-secondary">Log in om je dashboard te bekijken.</p>

        <label className="mb-1 block text-sm font-medium text-secondary" htmlFor="email">
          E-mail
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="mb-4 w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-primary outline-none focus:border-accent"
        />

        <label className="mb-1 block text-sm font-medium text-secondary" htmlFor="password">
          Wachtwoord
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="mb-4 w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-primary outline-none focus:border-accent"
        />

        {state?.error && <p className="mb-4 text-sm text-danger">{state.error}</p>}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg bg-accent px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
        >
          {pending ? 'Bezig...' : 'Inloggen'}
        </button>
      </form>
    </div>
  )
}
