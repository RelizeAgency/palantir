export function TabSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="h-20 rounded-xl border border-border bg-surface" />
        <div className="h-20 rounded-xl border border-border bg-surface" />
        <div className="h-20 rounded-xl border border-border bg-surface" />
        <div className="h-20 rounded-xl border border-border bg-surface" />
      </div>
      <div className="h-64 rounded-xl border border-border bg-surface" />
    </div>
  )
}
