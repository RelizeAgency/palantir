export type PeriodKey = '7d' | '14d' | 'month' | '3m' | '6m' | 'year' | '2y'

export const PERIODS: { key: PeriodKey; label: string; days: number }[] = [
  { key: '7d', label: '7d', days: 7 },
  { key: '14d', label: '14d', days: 14 },
  { key: 'month', label: 'Maand', days: 30 },
  { key: '3m', label: '3mnd', days: 90 },
  { key: '6m', label: '6mnd', days: 180 },
  { key: 'year', label: 'Jaar', days: 365 },
  { key: '2y', label: '2 jaar', days: 730 },
]

export type PeriodRange = {
  currentStart: string
  currentEnd: string
  previousStart: string
  previousEnd: string
}

function toISODate(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setUTCDate(result.getUTCDate() + days)
  return result
}

// currentEnd is always "today" — the nightly sync writes up to yesterday, so
// today simply won't contribute rows yet, which is fine for a running total.
export function getPeriodRange(key: PeriodKey, today: Date = new Date()): PeriodRange {
  const period = PERIODS.find((p) => p.key === key) ?? PERIODS[2]
  const currentEnd = today
  const currentStart = addDays(currentEnd, -(period.days - 1))
  const previousEnd = addDays(currentStart, -1)
  const previousStart = addDays(previousEnd, -(period.days - 1))

  return {
    currentStart: toISODate(currentStart),
    currentEnd: toISODate(currentEnd),
    previousStart: toISODate(previousStart),
    previousEnd: toISODate(previousEnd),
  }
}

export function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return current > 0 ? null : 0
  return ((current - previous) / previous) * 100
}
