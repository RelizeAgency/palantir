# Lead-waarde tab Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Een vierde tab ("Waarde") op de site-detailpagina die, op basis van een
handmatig ingevulde gemiddelde leadwaarde per site, de potentiële omzet van de
vorige maand groot toont plus een 3-maands trendgrafiek (maand-2, vorige maand,
huidige maand — de lopende maand visueel als "in uitvoering" gemarkeerd).

**Architecture:** Eén nieuwe, nullable kolom (`lead_value_eur`) op de `sites`-tabel.
Alle rekenwerk (leads × leadwaarde) gebeurt client/server-side in JS bij het
renderen, niet in SQL — er wordt nergens een waarde per maand weggeschreven, dus
een latere aanpassing van de leadwaarde herberekent met terugwerkende kracht ook
de eerder getoonde maanden. Volgt het bestaande patroon van de andere drie tabs
(`LeadsSection`/`GmbSection`/`SeoSection` in `components/site-detail/`, data
opgehaald in `app/(protected)/sites/[id]/page.tsx`).

**Tech Stack:** Next.js 16 (App Router), Supabase (Postgres + JS-client zonder
gegenereerde `Database`-types — `.select('*')` resolvet naar `any`, net als de
rest van deze pagina), Recharts voor de grafiek, Tailwind voor styling.

**Over verificatie:** dit project heeft geen testrunner (geen vitest/jest, geen
`*.test.*`-bestanden) — dat is een bewuste, bestaande keuze in deze codebase, geen
omissie. Dit plan volgt daarom niet de letterlijke "schrijf eerst een falende
test"-cadans, maar verifieert elke stap met `npx tsc --noEmit` (pakt het merendeel
van de echte fouten in een typed codebase als deze) en sluit af met een handmatige
end-to-end check in de dev server en een echte Cloudflare-deploy. Er wordt geen
testframework toegevoegd — dat zou scope toevoegen die niet in de spec staat.

**Spec:** `docs/superpowers/specs/2026-08-16-lead-value-tab-design.md`

---

### Task 1: Database — `lead_value_eur`-kolom

**Files:**
- Create: `supabase/migrations/0007_lead_value.sql`

- [ ] **Step 1: Schrijf de migratie**

```sql
-- Voegt een handmatig instelbare gemiddelde leadwaarde per site toe, voor de
-- "Waarde"-tab op de site-detailpagina (potentiële omzetschatting).
-- Nullable, geen default: null betekent expliciet "nog niet ingesteld", te
-- onderscheiden van 0 (een geldige, zij het onwaarschijnlijke, waarde).
alter table sites add column lead_value_eur numeric(10,2);
```

- [ ] **Step 2: Pas de migratie toe op de live database**

Er is geen `psql`/`supabase`-CLI op deze machine geïnstalleerd (geen Homebrew
beschikbaar). Gebruik in plaats daarvan een directe Postgres-connectie via
`pg8000` (pure Python, geen compilatie nodig — al eerder in deze sessie geverifieerd
te werken tegen dit project):

```bash
pip3 install --user pg8000 -q
DBPASS=$(grep SUPABASE_DB_PASSWORD /Users/krino/Desktop/Claude/Palantir/.env.local | cut -d= -f2)
python3 -c "
import pg8000.native
conn = pg8000.native.Connection(user='postgres', password='$DBPASS', host='db.jnevwlayotiltscmhpme.supabase.co', port=5432, database='postgres')
conn.run(open('/Users/krino/Desktop/Claude/Palantir/supabase/migrations/0007_lead_value.sql').read())
print(conn.run(\"select column_name, data_type from information_schema.columns where table_name='sites' and column_name='lead_value_eur'\"))
conn.close()
"
```

Expected output: `[['lead_value_eur', 'numeric']]`

- [ ] **Step 3: Commit**

```bash
cd /Users/krino/Desktop/Claude/Palantir
git add supabase/migrations/0007_lead_value.sql
git commit -m "feat: lead_value_eur-kolom op sites (Waarde-tab, stap 1/6)"
```

---

### Task 2: `Site`-type bijwerken

**Files:**
- Modify: `dashboard/lib/types.ts:1-11`

- [ ] **Step 1: Voeg het veld toe aan het `Site`-type**

In `dashboard/lib/types.ts`, in de bestaande `Site`-type-definitie, voeg toe na
`status`:

```ts
export type Site = {
  id: string
  name: string
  domain: string
  ga4_property_id: string
  ga4_property_display_name: string | null
  gsc_site_url: string | null
  gmb_location_id: string | null
  status: 'active' | 'paused'
  lead_value_eur: number | null
  created_at: string
}
```

- [ ] **Step 2: Typecheck**

```bash
cd /Users/krino/Desktop/Claude/Palantir/dashboard && npx tsc --noEmit
```

Expected: geen output (0 errors).

- [ ] **Step 3: Commit**

```bash
git add lib/types.ts
git commit -m "feat: lead_value_eur op Site-type (Waarde-tab, stap 2/6)"
```

---

### Task 3: Kalendermaand-grenzen

**Files:**
- Create: `dashboard/lib/calendarMonths.ts`

- [ ] **Step 1: Schrijf `lib/calendarMonths.ts`**

```ts
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
```

- [ ] **Step 2: Handmatige verificatie**

Er is geen testrunner (zie plan-header) — verifieer met een tijdelijk, niet-
gecommit script via `npx tsx` (draait TS direct, geen installatie nodig):

```bash
cd /Users/krino/Desktop/Claude/Palantir/dashboard
npx -y tsx -e "
import { getThreeCalendarMonths, getThreeMonthFetchRange } from './lib/calendarMonths'
const months = getThreeCalendarMonths(new Date('2026-08-16T12:00:00Z'))
console.log(months)
console.log(getThreeMonthFetchRange(months))
"
```

Expected: 3 entries met keys `2026-06`, `2026-07`, `2026-08` (in die volgorde),
labels `jun '26`, `jul '26`, `aug '26`, waarbij alleen de laatste (`2026-08`)
`isCurrent: true` heeft en `end: '2026-08-16'` (vandaag, niet de 31e). De eerste
twee hebben `end` op de laatste kalenderdag van die maand. De fetch-range is
`{ currentStart: '2026-06-01', currentEnd: '2026-08-16' }`.

- [ ] **Step 3: Typecheck**

```bash
npx tsc --noEmit
```

Expected: geen output.

- [ ] **Step 4: Commit**

```bash
git add lib/calendarMonths.ts
git commit -m "feat: kalendermaand-grenzen voor Waarde-tab (stap 3/6)"
```

---

### Task 4: Aggregatie — leads per kalendermaand

**Files:**
- Modify: `dashboard/lib/aggregate.ts:1` (import) en einde van bestand (nieuwe export)

- [ ] **Step 1: Voeg de import toe bovenaan `lib/aggregate.ts`**

Regel 1 wordt:

```ts
import type { DailyGa4SiteMetricRow, DailyMetricRow, DailySeoMetricRow } from '@/lib/types'
import type { CalendarMonthRange } from '@/lib/calendarMonths'
```

- [ ] **Step 2: Voeg `bucketByCalendarMonth` toe aan het einde van `lib/aggregate.ts`**

```ts
export type MonthlyValueBucket = {
  key: string
  label: string
  totalLeads: number
  isCurrent: boolean
}

// Somt phone_clicks + whatsapp_clicks + form_leads + gmb_calls per kalender-
// maand (dus inclusief GMB-bel-leads, in tegenstelling tot de `total_leads`-
// kolom zelf, die geen gmb_calls meetelt) voor exact de meegegeven maanden.
// Ontbrekende data wordt 0 in plaats van de maand weg te laten, zodat de
// Waarde-tab altijd precies 3 balken toont, ook voor een net toegevoegde site.
export function bucketByCalendarMonth(
  rows: DailyMetricRow[],
  months: CalendarMonthRange[]
): MonthlyValueBucket[] {
  const totals = new Map<string, number>(months.map((m) => [m.key, 0]))

  for (const row of rows) {
    const key = row.date.slice(0, 7)
    if (!totals.has(key)) continue
    const allLeads = row.phone_clicks + row.whatsapp_clicks + row.form_leads + row.gmb_calls
    totals.set(key, (totals.get(key) ?? 0) + allLeads)
  }

  return months.map((m) => ({
    key: m.key,
    label: m.label,
    totalLeads: totals.get(m.key) ?? 0,
    isCurrent: m.isCurrent,
  }))
}
```

- [ ] **Step 3: Handmatige verificatie**

```bash
cd /Users/krino/Desktop/Claude/Palantir/dashboard
npx -y tsx -e "
import { getThreeCalendarMonths } from './lib/calendarMonths'
import { bucketByCalendarMonth } from './lib/aggregate'
const months = getThreeCalendarMonths(new Date('2026-08-16T12:00:00Z'))
const rows = [
  { site_id: 'x', date: '2026-07-05', phone_clicks: 2, whatsapp_clicks: 1, form_leads: 0, gmb_calls: 1, total_leads: 3 },
  { site_id: 'x', date: '2026-08-01', phone_clicks: 1, whatsapp_clicks: 0, form_leads: 1, gmb_calls: 0, total_leads: 2 },
]
console.log(bucketByCalendarMonth(rows, months))
"
```

Expected: 3 entries — `2026-06` met `totalLeads: 0`, `2026-07` met
`totalLeads: 4` (2+1+0+1), `2026-08` met `totalLeads: 2` (1+0+1+0,
`isCurrent: true`).

- [ ] **Step 4: Typecheck**

```bash
npx tsc --noEmit
```

Expected: geen output.

- [ ] **Step 5: Commit**

```bash
git add lib/aggregate.ts
git commit -m "feat: bucketByCalendarMonth voor Waarde-tab (stap 4/6)"
```

---

### Task 5: Backend — fetch-range verruimen, kleur, server action

**Files:**
- Modify: `dashboard/lib/metrics.ts:51-66` (`getSiteDailyMetrics`)
- Modify: `dashboard/lib/statColors.ts`
- Modify: `dashboard/app/actions/sites.ts`

- [ ] **Step 1: Verruim het parametertype van `getSiteDailyMetrics`**

De Waarde-tab heeft geen periodeselector en dus geen volledig `PeriodRange`
(met `previousStart`/`previousEnd`) — alleen een start/eind. `getSiteDailyMetrics`
gebruikt intern toch al alleen `currentStart`/`currentEnd`, dus versoepel het
type zodat een kleinere range-vorm ook geldig is. In `dashboard/lib/metrics.ts`,
vervang:

```ts
export async function getSiteDailyMetrics(
  supabase: SupabaseClient,
  siteId: string,
  range: PeriodRange
): Promise<DailyMetricRow[]> {
```

door:

```ts
export async function getSiteDailyMetrics(
  supabase: SupabaseClient,
  siteId: string,
  range: Pick<PeriodRange, 'currentStart' | 'currentEnd'>
): Promise<DailyMetricRow[]> {
```

De functiebody blijft ongewijzigd — bestaande aanroepen met een volledig
`PeriodRange`-object blijven werken, want die voldoen ook aan het versoepelde type.

- [ ] **Step 2: Voeg de grafiekkleur toe**

In `dashboard/lib/statColors.ts`, voeg toe aan het `STAT_COLORS`-object (na
`ga4Engagement`):

```ts
  value: '#c9a227', // Waarde-tab — potentiële omzet per maand
```

- [ ] **Step 3: Voeg de server action toe**

In `dashboard/app/actions/sites.ts`, voeg toe aan het einde van het bestand:

```ts
export async function updateLeadValue(siteId: string, leadValueEur: number | null) {
  await requireUser()
  const supabase = createServiceRoleClient()
  const { error } = await supabase.from('sites').update({ lead_value_eur: leadValueEur }).eq('id', siteId)
  if (error) throw error
  revalidatePath(`/sites/${siteId}`)
}
```

- [ ] **Step 4: Typecheck**

```bash
cd /Users/krino/Desktop/Claude/Palantir/dashboard && npx tsc --noEmit
```

Expected: geen output.

- [ ] **Step 5: Commit**

```bash
git add lib/metrics.ts lib/statColors.ts app/actions/sites.ts
git commit -m "feat: fetch-range, kleur en server action voor Waarde-tab (stap 5/6)"
```

---

### Task 6: UI — formulier, grafiek, sectie, tab-integratie

**Files:**
- Create: `dashboard/components/site-detail/LeadValueForm.tsx`
- Create: `dashboard/components/charts/BarChartMonthly.tsx`
- Create: `dashboard/components/site-detail/ValueSection.tsx`
- Modify: `dashboard/app/(protected)/sites/[id]/page.tsx`

- [ ] **Step 1: Schrijf `components/site-detail/LeadValueForm.tsx`**

```tsx
'use client'

import { useState, useTransition } from 'react'
import { updateLeadValue } from '@/app/actions/sites'

export function LeadValueForm({
  siteId,
  initialValue,
}: {
  siteId: string
  initialValue: number | null
}) {
  const [value, setValue] = useState(initialValue !== null ? String(initialValue) : '')
  const [isPending, startTransition] = useTransition()

  const parsed = value.trim() === '' ? null : Number(value)
  const isValid = value.trim() === '' || (Number.isFinite(parsed) && (parsed as number) >= 0)

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="lead-value" className="text-xs text-secondary">
        Gemiddelde waarde per lead (€)
      </label>
      <input
        id="lead-value"
        type="number"
        min="0"
        step="0.01"
        inputMode="decimal"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="w-24 rounded-md border border-border bg-bg px-2 py-1 text-xs text-primary"
      />
      <button
        disabled={!isValid || isPending}
        onClick={() => startTransition(() => updateLeadValue(siteId, parsed))}
        className="rounded-md bg-accent px-2 py-1 text-xs font-medium text-white disabled:opacity-50"
      >
        Opslaan
      </button>
    </div>
  )
}
```

- [ ] **Step 2: Schrijf `components/charts/BarChartMonthly.tsx`**

```tsx
'use client'

import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid, Cell } from 'recharts'
import type { MonthlyValueBucket } from '@/lib/aggregate'
import { STAT_COLORS } from '@/lib/statColors'

function formatEuro(n: number): string {
  return new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(n)
}

type ChartRow = MonthlyValueBucket & { value: number }

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: { payload: ChartRow }[]
  label?: string
}) {
  if (!active || !payload?.length) return null
  const row = payload[0].payload

  return (
    <div className="rounded-lg border border-[#ffffff1a] bg-[#17171b] px-3 py-2 text-xs">
      <div className="mb-1 font-medium text-primary">
        {label}
        {row.isCurrent ? ' (tot nu toe)' : ''}
      </div>
      <div className="flex items-center justify-between gap-6">
        <span className="text-secondary">Potentiële waarde</span>
        <span className="font-semibold text-primary">{formatEuro(row.value)}</span>
      </div>
      <div className="flex items-center justify-between gap-6">
        <span className="text-secondary">Leads</span>
        <span className="text-primary">{row.totalLeads}</span>
      </div>
    </div>
  )
}

export function BarChartMonthly({
  data,
  leadValueEur,
}: {
  data: MonthlyValueBucket[]
  leadValueEur: number
}) {
  const chartData: ChartRow[] = data.map((d) => ({ ...d, value: d.totalLeads * leadValueEur }))

  return (
    <ResponsiveContainer width="100%" height={190}>
      <BarChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff1a" />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#a1a1aa' }} axisLine={false} tickLine={false} />
        <YAxis
          tick={{ fontSize: 11, fill: '#a1a1aa' }}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
          tickFormatter={formatEuro}
        />
        <Tooltip cursor={{ fill: '#ffffff0d' }} content={<CustomTooltip />} />
        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
          {chartData.map((entry) => (
            <Cell key={entry.key} fill={STAT_COLORS.value} fillOpacity={entry.isCurrent ? 0.4 : 1} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
```

- [ ] **Step 3: Schrijf `components/site-detail/ValueSection.tsx`**

```tsx
import type { MonthlyValueBucket } from '@/lib/aggregate'
import { LeadValueForm } from '@/components/site-detail/LeadValueForm'
import { StatCard } from '@/components/site-detail/StatCard'
import { BarChartMonthly } from '@/components/charts/BarChartMonthly'

function formatEuro(n: number): string {
  return new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(n)
}

export function ValueSection({
  siteId,
  leadValueEur,
  months,
}: {
  siteId: string
  leadValueEur: number | null
  months: MonthlyValueBucket[]
}) {
  // months is oudste-eerst: [maand-2, vorige maand, huidige maand]
  const lastMonth = months[1]
  const monthBeforeThat = months[0]

  return (
    <div>
      <div className="mb-4">
        <LeadValueForm siteId={siteId} initialValue={leadValueEur} />
      </div>

      {leadValueEur === null ? (
        <p className="text-sm text-secondary">
          Vul een gemiddelde leadwaarde in om de potentiële omzet te zien.
        </p>
      ) : (
        <>
          <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <StatCard
              label="Potentiële omzet vorige maand"
              value={formatEuro(lastMonth.totalLeads * leadValueEur)}
              current={lastMonth.totalLeads * leadValueEur}
              previous={monthBeforeThat.totalLeads * leadValueEur}
              emphasize
            />
          </div>

          <div className="rounded-xl border border-border bg-surface p-4">
            <div className="mb-2 text-sm font-medium text-secondary">Potentiële omzet per maand</div>
            <BarChartMonthly data={months} leadValueEur={leadValueEur} />
          </div>
        </>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Wire de tab in `app/(protected)/sites/[id]/page.tsx`**

Voeg de imports toe (na de bestaande imports uit `@/lib/aggregate` en
`@/components/site-detail/...`):

```ts
import { getThreeCalendarMonths, getThreeMonthFetchRange } from '@/lib/calendarMonths'
import { ValueSection } from '@/components/site-detail/ValueSection'
```

En wijzig de `bucketByWeek, dailySeoSeries` import naar ook `bucketByCalendarMonth`:

```ts
import { bucketByWeek, bucketByCalendarMonth, dailySeoSeries } from '@/lib/aggregate'
```

Voeg na de bestaande `ga4Totals`/`ga4Daily`-fetch (vlak vóór de `return`) toe:

```ts
  const calendarMonths = getThreeCalendarMonths()
  const valueDaily = await getSiteDailyMetrics(supabase, id, getThreeMonthFetchRange(calendarMonths))
  const monthlyValueBuckets = bucketByCalendarMonth(valueDaily, calendarMonths)
```

En voeg een vierde entry toe aan de `tabs`-array van `<Tabs>`, na de `seo`-tab:

```ts
          {
            id: 'value',
            label: 'Waarde',
            content: (
              <ValueSection
                siteId={id}
                leadValueEur={site.lead_value_eur}
                months={monthlyValueBuckets}
              />
            ),
          },
```

- [ ] **Step 5: Typecheck**

```bash
cd /Users/krino/Desktop/Claude/Palantir/dashboard && npx tsc --noEmit
```

Expected: geen output.

- [ ] **Step 6: Handmatige end-to-end check in de dev server**

```bash
npm run dev
```

Open `http://localhost:3000/sites/<een-site-id>` in de browser, klik op de
"Waarde"-tab. Verwacht:
- Leeg: alleen het invoerveld + de tekst "Vul een gemiddelde leadwaarde in...".
- Vul bv. `50` in, klik Opslaan → pagina toont het grote bedrag ("Potentiële
  omzet vorige maand") + een staafgrafiek met 3 balken, waarvan de rechtse
  (huidige maand) zichtbaar lichter gekleurd is.
- Herlaad de pagina → de ingevulde waarde `50` staat nog in het invoerveld
  (bevestigt dat de server action + revalidatie werken).

Stop de dev server (Ctrl+C) zodra dit klopt.

- [ ] **Step 7: Cloudflare-build-check**

Zelfde reden als bij de eerdere `proxy.ts`-fix deze sessie: `next build` alleen
dekt niet alle Cloudflare-Workers-specifieke compatibiliteitseisen. Bouw en
deploy daadwerkelijk:

```bash
npm run cf:deploy
```

Expected: bouwt en deployt zonder errors, eindigt met een `Uploaded
palantir-dashboard`-regel en de live URL.

- [ ] **Step 8: Commit en push**

```bash
cd /Users/krino/Desktop/Claude/Palantir
git add dashboard/components/site-detail/LeadValueForm.tsx \
        dashboard/components/charts/BarChartMonthly.tsx \
        dashboard/components/site-detail/ValueSection.tsx \
        "dashboard/app/(protected)/sites/[id]/page.tsx"
git commit -m "feat: Waarde-tab op site-detailpagina (stap 6/6)"
git push
```
