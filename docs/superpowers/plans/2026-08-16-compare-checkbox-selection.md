# Vergelijken — checkbox-selectie in tabellen Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Vervang de losse pil-selector (`SiteMultiSelect`) boven de tabjes op
`/compare` door checkboxes rechtstreeks in de Leads- en Waarde-tabel. Beide
tabellen tonen voortaan altijd alle actieve sites, met niet-aangevinkte rijen
gedimd; de grafieken blijven gefilterd op wat aangevinkt is.

**Architecture:** Eén nieuw, gedeeld client-component
(`SiteToggleCheckbox.tsx`) met dezelfde toggle-logica die nu al in
`SiteMultiSelect` zit (schrijft naar de bestaande `sites`-URL-parameter, geen
wijziging aan hoe die parameter zelf werkt). De pagina haalt voortaan data op
voor alle actieve sites i.p.v. alleen geselecteerde, en geeft zowel de volle
rijenlijst als `selectedIds` door aan beide tab-secties — die filteren zelf
hun grafiek-data, terwijl de tabel-rijen ongefilterd blijven (alleen gedimd).

**Tech Stack:** Next.js 16 (App Router), Tailwind.

**Over verificatie:** zelfde aanpak als de vorige features — geen testrunner
in dit project (bestaande, bewuste keuze). Elke stap verifieert met
`npx tsc --noEmit`.

**Spec:** `docs/superpowers/specs/2026-08-16-compare-checkbox-selection-design.md`

---

### Task 1: Gedeeld checkbox-component

**Files:**
- Create: `dashboard/components/sites/SiteToggleCheckbox.tsx`

- [ ] **Step 1: Schrijf `SiteToggleCheckbox.tsx`**

```tsx
'use client'

import { useRouter, useSearchParams } from 'next/navigation'

export function SiteToggleCheckbox({
  siteId,
  selectedIds,
}: {
  siteId: string
  selectedIds: string[]
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const checked = selectedIds.includes(siteId)

  function toggle() {
    const next = checked ? selectedIds.filter((id) => id !== siteId) : [...selectedIds, siteId]
    const params = new URLSearchParams(searchParams)
    params.set('sites', next.join(','))
    router.push(`?${params.toString()}`)
  }

  return (
    <input
      type="checkbox"
      checked={checked}
      onChange={toggle}
      className="h-4 w-4 rounded border-border accent-accent"
    />
  )
}
```

`selectedIds` komt als prop binnen (niet zelf opnieuw uit de URL gelezen) —
de pagina heeft de standaard-fallback (eerste 3 actieve sites wanneer de
`sites`-parameter ontbreekt) al toegepast; dat moet niet dubbel of anders in
dit client-component gebeuren. De toggle-logica is functioneel identiek aan
wat nu al in `components/sites/SiteMultiSelect.tsx` zit.

- [ ] **Step 2: Typecheck**

```bash
cd /Users/krino/Desktop/Claude/Palantir/dashboard && npx tsc --noEmit
```

Verwacht: geen output — dit component wordt nog nergens aangeroepen.

- [ ] **Step 3: Commit**

```bash
cd /Users/krino/Desktop/Claude/Palantir
git add dashboard/components/sites/SiteToggleCheckbox.tsx
git commit -m "feat: gedeeld site-toggle-checkbox component (vergelijken-checkboxes, stap 1/4)"
```

---

### Task 2: Leads-tabel — checkbox, alle sites, dimming

**Files:**
- Modify: `dashboard/components/sites/SitesTable.tsx`
- Modify: `dashboard/components/compare/LeadsCompareSection.tsx`

- [ ] **Step 1: Herschrijf `SitesTable.tsx`**

```tsx
import Link from 'next/link'
import type { PeriodTotals, Site } from '@/lib/types'
import { TrendBadge } from '@/components/sites/TrendBadge'
import { SiteToggleCheckbox } from '@/components/sites/SiteToggleCheckbox'

export function SitesTable({
  rows,
  selectedIds,
}: {
  rows: { site: Site; totals: PeriodTotals }[]
  selectedIds: string[]
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs text-secondary">
            <th className="w-8 px-4 py-2"></th>
            <th className="px-4 py-2 font-medium">Site</th>
            <th className="px-4 py-2 font-medium">Bel (website)</th>
            <th className="px-4 py-2 font-medium">Bel (GMB)</th>
            <th className="px-4 py-2 font-medium">WhatsApp</th>
            <th className="px-4 py-2 font-medium">Formulier</th>
            <th className="px-4 py-2 font-medium">Totaal</th>
            <th className="px-4 py-2 font-medium">Trend</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ site, totals }) => (
            <tr
              key={site.id}
              className={`border-b border-border last:border-0 ${
                selectedIds.includes(site.id) ? '' : 'opacity-40'
              }`}
            >
              <td className="px-4 py-2.5">
                <SiteToggleCheckbox siteId={site.id} selectedIds={selectedIds} />
              </td>
              <td className="px-4 py-2.5">
                <Link href={`/sites/${site.id}`} className="font-medium text-primary hover:text-accent">
                  {site.name}
                </Link>
              </td>
              <td className="px-4 py-2.5 text-secondary">{totals.phone_clicks_cur}</td>
              <td className="px-4 py-2.5 text-secondary">{totals.gmb_calls_cur}</td>
              <td className="px-4 py-2.5 text-secondary">{totals.whatsapp_clicks_cur}</td>
              <td className="px-4 py-2.5 text-secondary">{totals.form_leads_cur}</td>
              <td className="px-4 py-2.5 font-medium text-primary">{totals.total_leads_cur}</td>
              <td className="px-4 py-2.5">
                <TrendBadge current={totals.total_leads_cur} previous={totals.total_leads_prev} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

- [ ] **Step 2: Herschrijf `LeadsCompareSection.tsx`**

```tsx
import type { PeriodTotals, Site } from '@/lib/types'
import type { PeriodKey } from '@/lib/periods'
import { PeriodDropdown } from '@/components/sites/PeriodDropdown'
import { ComparisonBarChart, type ComparisonBarRow } from '@/components/charts/ComparisonBarChart'
import { SitesTable } from '@/components/sites/SitesTable'

export function LeadsCompareSection({
  leadsPeriod,
  rows,
  selectedIds,
}: {
  leadsPeriod: PeriodKey
  rows: { site: Site; totals: PeriodTotals }[]
  selectedIds: string[]
}) {
  const chartData: ComparisonBarRow[] = rows
    .filter(({ site }) => selectedIds.includes(site.id))
    .map(({ site, totals }) => ({
      name: site.name,
      bel: totals.phone_clicks_cur,
      gmb: totals.gmb_calls_cur,
      whatsapp: totals.whatsapp_clicks_cur,
      form: totals.form_leads_cur,
    }))

  return (
    <div>
      <div className="mb-4 flex justify-start">
        <PeriodDropdown paramKey="leadsPeriod" current={leadsPeriod} />
      </div>

      <div className="space-y-4">
        <div className="rounded-xl border border-border bg-surface p-4">
          {chartData.length === 0 ? (
            <p className="py-8 text-center text-sm text-secondary">
              Vink minstens één site aan om te vergelijken.
            </p>
          ) : (
            <ComparisonBarChart data={chartData} />
          )}
        </div>
        <SitesTable rows={rows} selectedIds={selectedIds} />
      </div>
    </div>
  )
}
```

Let op wat hier verandert t.o.v. de vorige versie: de tabel wordt niet meer
overgeslagen als er niets geselecteerd is (die toont nu altijd alle sites, dat
is precies waar je de checkboxes vandaan aanvinkt) — alleen de grafiek krijgt
een lege-staat-tekst als er niets aangevinkt staat.

- [ ] **Step 3: Typecheck**

```bash
cd /Users/krino/Desktop/Claude/Palantir/dashboard && npx tsc --noEmit
```

Verwacht: dit geeft NU een fout — `compare/page.tsx` roept
`LeadsCompareSection` nog aan zonder de nieuwe, verplichte `selectedIds`-prop.
Dat is oké voor deze stap; Task 4 lost 'm op. Bevestig wel dat de fout
specifiek daarover gaat en nergens anders over.

- [ ] **Step 4: Commit**

```bash
cd /Users/krino/Desktop/Claude/Palantir
git add dashboard/components/sites/SitesTable.tsx dashboard/components/compare/LeadsCompareSection.tsx
git commit -m "feat: checkbox + alle sites op Leads-tabel (vergelijken-checkboxes, stap 2/4)"
```

---

### Task 3: Waarde-tabel — checkbox, alle sites, dimming

**Files:**
- Modify: `dashboard/components/compare/WaardeCompareSection.tsx`

- [ ] **Step 1: Herschrijf `WaardeCompareSection.tsx`**

```tsx
import type { Site } from '@/lib/types'
import { formatEuro } from '@/lib/format'
import { ValueComparisonBarChart, type ValueComparisonRow } from '@/components/charts/ValueComparisonBarChart'
import { SiteToggleCheckbox } from '@/components/sites/SiteToggleCheckbox'

export type WaardeCompareRow = {
  site: Site
  lastMonthLeads: number
}

export function WaardeCompareSection({
  rows,
  selectedIds,
}: {
  rows: WaardeCompareRow[]
  selectedIds: string[]
}) {
  const chartData: ValueComparisonRow[] = rows
    .filter((r) => selectedIds.includes(r.site.id) && r.site.lead_value_eur !== null)
    .map((r) => ({
      name: r.site.name,
      value: r.lastMonthLeads * (r.site.lead_value_eur as number),
    }))

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-surface p-4">
        {chartData.length === 0 ? (
          <p className="py-8 text-center text-sm text-secondary">
            Vink minstens één site met een ingestelde leadwaarde aan om te vergelijken.
          </p>
        ) : (
          <ValueComparisonBarChart data={chartData} />
        )}
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-secondary">
              <th className="w-8 px-4 py-2"></th>
              <th className="px-4 py-2 font-medium">Site</th>
              <th className="px-4 py-2 font-medium">Leads vorige maand</th>
              <th className="px-4 py-2 font-medium">Leadwaarde (€/lead)</th>
              <th className="px-4 py-2 font-medium">Potentiële omzet vorige maand</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ site, lastMonthLeads }) => (
              <tr
                key={site.id}
                className={`border-b border-border last:border-0 ${
                  selectedIds.includes(site.id) ? '' : 'opacity-40'
                }`}
              >
                <td className="px-4 py-2.5">
                  <SiteToggleCheckbox siteId={site.id} selectedIds={selectedIds} />
                </td>
                <td className="px-4 py-2.5 font-medium text-primary">{site.name}</td>
                <td className="px-4 py-2.5 text-secondary">{lastMonthLeads}</td>
                <td className="px-4 py-2.5 text-secondary">
                  {site.lead_value_eur !== null ? formatEuro(site.lead_value_eur) : 'niet ingesteld'}
                </td>
                <td className="px-4 py-2.5 font-medium text-primary">
                  {site.lead_value_eur !== null
                    ? formatEuro(lastMonthLeads * site.lead_value_eur)
                    : 'niet ingesteld'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Typecheck**

```bash
cd /Users/krino/Desktop/Claude/Palantir/dashboard && npx tsc --noEmit
```

Verwacht: dezelfde ene fout als na Task 2 (over `LeadsCompareSection`'s
ontbrekende `selectedIds`-prop in `compare/page.tsx`), plus nu ook een gelijke
fout voor `WaardeCompareSection`. Beide lost Task 4 op.

- [ ] **Step 3: Commit**

```bash
cd /Users/krino/Desktop/Claude/Palantir
git add dashboard/components/compare/WaardeCompareSection.tsx
git commit -m "feat: checkbox + alle sites op Waarde-tabel (vergelijken-checkboxes, stap 3/4)"
```

---

### Task 4: Pagina-verdrading, `SiteMultiSelect` verwijderen

**Files:**
- Modify: `dashboard/app/(protected)/compare/page.tsx`
- Delete: `dashboard/components/sites/SiteMultiSelect.tsx`

- [ ] **Step 1: Herschrijf `app/(protected)/compare/page.tsx`**

Vervang de volledige inhoud van het bestand door:

```tsx
import { createClient } from '@/lib/supabase/server'
import { getActiveSites, getSitePeriodTotals, getSiteDailyMetrics } from '@/lib/metrics'
import { getPeriodRange, type PeriodKey } from '@/lib/periods'
import { getThreeCalendarMonths, getThreeMonthFetchRange } from '@/lib/calendarMonths'
import { bucketByCalendarMonth } from '@/lib/aggregate'
import { Tabs } from '@/components/site-detail/Tabs'
import { LeadsCompareSection } from '@/components/compare/LeadsCompareSection'
import { WaardeCompareSection } from '@/components/compare/WaardeCompareSection'

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ leadsPeriod?: string; sites?: string }>
}) {
  const params = await searchParams
  const leadsPeriod = (params.leadsPeriod as PeriodKey) ?? 'month'
  const leadsRange = getPeriodRange(leadsPeriod)

  const supabase = await createClient()
  const allSites = await getActiveSites(supabase)

  const selectedIds = params.sites
    ? params.sites.split(',').filter(Boolean)
    : allSites.slice(0, Math.min(3, allSites.length)).map((s) => s.id)

  const calendarMonths = getThreeCalendarMonths()

  const [rows, waardeRows] = await Promise.all([
    Promise.all(
      allSites.map(async (site) => ({
        site,
        totals: await getSitePeriodTotals(supabase, site.id, leadsRange),
      }))
    ),
    Promise.all(
      allSites.map(async (site) => {
        const daily = await getSiteDailyMetrics(supabase, site.id, getThreeMonthFetchRange(calendarMonths))
        const buckets = bucketByCalendarMonth(daily, calendarMonths)
        return { site, lastMonthLeads: buckets[1].totalLeads }
      })
    ),
  ])

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-lg font-semibold text-primary">Sites vergelijken</h1>
      </div>

      <Tabs
        tabs={[
          {
            id: 'leads',
            label: 'Leads',
            content: <LeadsCompareSection leadsPeriod={leadsPeriod} rows={rows} selectedIds={selectedIds} />,
          },
          {
            id: 'waarde',
            label: 'Waarde',
            content: <WaardeCompareSection rows={waardeRows} selectedIds={selectedIds} />,
          },
        ]}
      />
    </div>
  )
}
```

Kernverschillen t.o.v. de vorige versie: geen `SiteMultiSelect`-import/gebruik
meer, geen losse `selectedSites`-variabele meer (beide fetches lopen nu over
`allSites`), en `selectedIds` gaat als prop mee naar beide sectie-componenten.

- [ ] **Step 2: Verwijder `SiteMultiSelect.tsx`**

```bash
cd /Users/krino/Desktop/Claude/Palantir
git rm dashboard/components/sites/SiteMultiSelect.tsx
```

Geverifieerd bij het schrijven van dit plan dat dit component nergens anders
gebruikt wordt dan in `compare/page.tsx` (nu verwijderd) — veilig om te
verwijderen, geen dode referenties elders.

- [ ] **Step 3: Typecheck**

```bash
cd /Users/krino/Desktop/Claude/Palantir/dashboard && npx tsc --noEmit
```

Verwacht: geen output — dit lost de tijdelijke fouten van Task 2/3 op.

- [ ] **Step 4: Verificatie tegen echte data — alle sites worden opgehaald**

```bash
cd /Users/krino/Desktop/Claude/Palantir/dashboard
export SUPABASE_SERVICE_ROLE_KEY=$(grep SUPABASE_SERVICE_ROLE_KEY .env.local | cut -d= -f2)
npx -y tsx -e "
import { createClient } from '@supabase/supabase-js'
import { getActiveSites } from './lib/metrics'
const supabase = createClient('https://jnevwlayotiltscmhpme.supabase.co', process.env.SUPABASE_SERVICE_ROLE_KEY!)
async function main() {
  const sites = await getActiveSites(supabase)
  console.log('actieve sites:', sites.map(s => s.name))
}
main()
"
```

Verwacht: alle actieve sites in de lijst (nu 3) — dit is precies de lijst
waarvoor `rows`/`waardeRows` straks data ophalen, ongeacht welke er
aangevinkt staan.

- [ ] **Step 5: Handmatige controle in de dev server**

```bash
npm run dev
```

Open `http://localhost:3000/compare`. Verwacht:
- Geen pil-selector meer boven de tabjes.
- "Leads"-tab: tabel toont alle sites, elk met een checkbox links. Sites die
  standaard geselecteerd zijn (eerste 3) staan aangevinkt en normaal
  gekleurd; de rest (indien meer dan 3 sites bestaan) staat uitgevinkt en
  gedimd.
- Een checkbox uitvinken: de bijbehorende balk verdwijnt uit de grafiek, de
  rij blijft zichtbaar maar wordt gedimd. Checkbox weer aanvinken: balk komt
  terug, rij normaal gekleurd.
- Alle sites uitvinken: grafiek toont de tekst "Vink minstens één site aan om
  te vergelijken", tabel blijft gewoon staan (met alle rijen gedimd).
- "Waarde"-tab: zelfde gedrag, plus "niet ingesteld" blijft correct werken
  voor sites zonder leadwaarde.
- De aan/uit-status blijft behouden als je van tabblad wisselt (zelfde
  `sites`-parameter, gedeeld tussen beide tabs).

Stop de dev server (Ctrl+C) zodra dit klopt.

- [ ] **Step 6: Cloudflare-build-check**

```bash
npm run cf:deploy
```

Verwacht: bouwt en deployt zonder errors.

- [ ] **Step 7: Commit en push**

```bash
cd /Users/krino/Desktop/Claude/Palantir
git add "dashboard/app/(protected)/compare/page.tsx" dashboard/components/sites/SiteMultiSelect.tsx
git commit -m "feat: checkbox-selectie i.p.v. pil-selector op vergelijken-pagina (stap 4/4)"
git push
```
