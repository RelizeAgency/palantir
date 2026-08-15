import { requireUser } from '@/lib/auth/dal'
import { Sidebar } from '@/components/layout/Sidebar'

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser()

  return (
    <div className="flex h-screen overflow-hidden bg-bg">
      <Sidebar email={user.email ?? ''} />
      <main className="flex-1 overflow-y-auto px-8 py-8">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
    </div>
  )
}
