import 'server-only'

// Fires the Worker's manual/backfill sync for one site, right after it's added,
// so it gets historical data immediately instead of waiting for the next
// nightly cron run. Best-effort: the Worker may not be deployed yet during
// early development, so failures are logged, not thrown.
export async function triggerBackfill(siteId: string, days = 730) {
  const url = process.env.WORKER_SYNC_URL
  const secret = process.env.SYNC_TRIGGER_SECRET
  if (!url || !secret) {
    console.warn('triggerBackfill: WORKER_SYNC_URL/SYNC_TRIGGER_SECRET not set, skipping')
    return
  }

  try {
    await fetch(`${url}?mode=backfill&days=${days}&site_id=${siteId}`, {
      headers: { 'x-sync-secret': secret },
    })
  } catch (err) {
    console.error('triggerBackfill failed', err)
  }
}
