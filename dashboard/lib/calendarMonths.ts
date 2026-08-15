// Exacte kalendermaand-grenzen voor de Waarde-tab — bewust ánders dan de
// rolling-day PERIODS uit lib/periods.ts, want die zijn geen kalendermaand-
// grenzen. Altijd precies de huidige maand plus de twee ervoor, oudste eerst
// zodat de array direct als grafiek-volgorde bruikbaar is.

export type CalendarMonthRange = {
  key: string // "2026-08"
  label: string // "aug '26" — zelfde stijl als lib/aggregate.ts se eigen maand-labels
  start: string // "2026-08-01"
  end: string // laatste dag van de maand, of "vandaag" voor de lopende maand
  isCurrent: boolean
}

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

function monthLabel(year: number, month: number): string {
  const label = new Date(Date.UTC(year, month, 1)).toLocaleDateString('nl-NL', { month: 'short' })
  return `${label.slice(0, 3)} '${String(year).slice(2)}`
}

function lastDayOfMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month + 1, 0)).getUTCDate()
}

export function getThreeCalendarMonths(today: Date = new Date()): CalendarMonthRange[] {
  const months: CalendarMonthRange[] = []

  for (let offset = 2; offset >= 0; offset--) {
    const d = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - offset, 1))
    const year = d.getUTCFullYear()
    const month = d.getUTCMonth()
    const isCurrent = offset === 0
    const end = isCurrent ? today : new Date(Date.UTC(year, month, lastDayOfMonth(year, month)))

    months.push({
      key: `${year}-${pad(month + 1)}`,
      label: monthLabel(year, month),
      start: `${year}-${pad(month + 1)}-01`,
      end: `${end.getUTCFullYear()}-${pad(end.getUTCMonth() + 1)}-${pad(end.getUTCDate())}`,
      isCurrent,
    })
  }

  return months
}

// Overspant alle 3 de maanden in één query-range: start van de oudste maand
// t/m vandaag. Bruikbaar als `range`-argument voor getSiteDailyMetrics.
export function getThreeMonthFetchRange(
  months: CalendarMonthRange[]
): { currentStart: string; currentEnd: string } {
  return {
    currentStart: months[0].start,
    currentEnd: months[months.length - 1].end,
  }
}

// 1 januari van het lopende kalenderjaar t/m vandaag — bewust niet de laatste
// 12 maanden "rolling", maar het echte kalenderjaar-tot-nu-toe.
export function getYearToDateRange(
  today: Date = new Date()
): { currentStart: string; currentEnd: string } {
  const year = today.getUTCFullYear()
  return {
    currentStart: `${year}-01-01`,
    currentEnd: `${year}-${pad(today.getUTCMonth() + 1)}-${pad(today.getUTCDate())}`,
  }
}
