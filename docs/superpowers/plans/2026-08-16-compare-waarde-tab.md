# Vergelijken — Waarde-tab (fase 2/3) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tweede tab "Waarde" op `/compare`, naast de bestaande "Leads"-tab:
potentiële omzet van vorige maand per geselecteerde site, hergebruikt exact
dezelfde rekenregel als de Waarde-tab op de individuele site-pagina.

**Architecture:** Hergebruikt bestaande bouwstenen zonder ze te wijzigen
(`getThreeCalendarMonths`, `getThreeMonthFetchRange`, `bucketByCalendarMonth`,
`getSiteDailyMetrics`, `site.lead_value_eur`) — puur nieuwe UI-laag plus één
kleine opruiming (een gedeelde `formatEuro`-helper, eerder al gesignaleerd als
duplicatie en nu opgelost omdat er een derde gebruiker bijkomt).

**Tech Stack:** Next.js 16 (App Router), Recharts, Tailwind.

**Over verificatie:** zelfde aanpak als de vorige twee features — geen
testrunner in dit project (bestaande, bewuste keuze). Elke stap verifieert
met `npx tsc --noEmit`; waar zinvol ook een read-only check tegen echte
Supabase-data.

**Spec:** `docs/superpowers/specs/2026-08-16-compare-waarde-tab-design.md`

---

### Task 1: Gedeelde `formatEuro`-helper

**Files:**
- Create: `dashboard/lib/format.ts`
- Modify: `dashboard/components/charts/BarChartMonthly.tsx`
- Modify: `dashboard/components/site-detail/ValueSection.tsx`

- [ ] **Step 1: Schrijf `lib/format.ts`**

```ts
export function formatEuro(n: number): string {
  return new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(n)
}
```

- [ ] **Step 2: `BarChartMonthly.tsx` — vervang de lokale kopie door de import**

Verwijder de lokale `formatEuro`-functie (regels 6-12, direct na de imports):

```tsx
function formatEuro(n: number): string {
  return new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(n)
}
```

En voeg toe aan de imports bovenaan het bestand:

```ts
import { formatEuro } from '@/lib/format'
```

De rest van het bestand (gebruik van `formatEuro(...)` verderop) blijft
ongewijzigd — het is dezelfde functienaam, nu geïmporteerd i.p.v. lokaal
gedefinieerd.

- [ ] **Step 3: `ValueSection.tsx` — zelfde behandeling**

Verwijder de identieke lokale `formatEuro`-functie bovenaan het bestand, voeg
`import { formatEuro } from '@/lib/format'` toe aan de imports. Rest van het
bestand ongewijzigd.

- [ ] **Step 4: Typecheck**

```bash
cd /Users/krino/Desktop/Claude/Palantir/dashboard && npx tsc --noEmit
```

Verwacht: geen output.

- [ ] **Step 5: Commit**

```bash
cd /Users/krino/Desktop/Claude/Palantir
git add dashboard/lib/format.ts dashboard/components/charts/BarChartMonthly.tsx dashboard/components/site-detail/ValueSection.tsx
git commit -m "refactor: gedeelde formatEuro-helper (vergelijken-Waarde-tab, stap 1/3)"
```

---

### Task 2: Eenvoudige waarde-vergelijkingsgrafiek

**Files:**
- Create: `dashboard/components/charts/ValueComparisonBarChart.tsx`

- [ ] **Step 1: Schrijf `ValueComparisonBarChart.tsx`**

```tsx
'use client'

import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from 'recharts'
import { formatEuro } from '@/lib/format'

export type ValueComparisonRow = {
  name: string
  value: number
}

export function ValueComparisonBarChart({ data }: { data: ValueComparisonRow[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff1a" />
        <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#a1a1aa' }} axisLine={false} tickLine={false} />
        <YAxis
          tick={{ fontSize: 11, fill: '#a1a1aa' }}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
          tickFormatter={formatEuro}
        />
        <Tooltip
          cursor={{ fill: '#ffffff0d' }}
          contentStyle={{ background: '#17171b', border: '1px solid #ffffff1a', borderRadius: 8, fontSize: 12 }}
          labelStyle={{ color: '#f4f4f5' }}
          formatter={(value: number) => formatEuro(value)}
        />
        <Bar dataKey="value" fill="#814bc8" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
```

`#814bc8` is dezelfde accentkleur (`--color-accent` in `globals.css`) die de
oorspronkelijke, inmiddels door fase 1 vervangen `ComparisonBarChart` ook al
gebruikte voor een enkele-waarde-per-site-balk — bewust geen `STAT_COLORS`
hier, want er is geen bronnen-onderscheid zoals bij de Leads-tab, dit is één
bedrag per site.

- [ ] **Step 2: Typecheck**

```bash
cd /Users/krino/Desktop/Claude/Palantir/dashboard && npx tsc --noEmit
```

Verwacht: geen output — dit component wordt nog nergens aangeroepen, dus kan
geen nieuwe fout introduceren buiten zichzelf.

- [ ] **Step 3: Commit**

```bash
cd /Users/krino/Desktop/Claude/Palantir
git add dashboard/components/charts/ValueComparisonBarChart.tsx
git commit -m "feat: eenvoudige waarde-vergelijkingsgrafiek (vergelijken-Waarde-tab, stap 2/3)"
```

---

### Task 3: Sectie, data-fetch, tab-integratie

**Files:**
- Create: `dashboard/components/compare/WaardeCompareSection.tsx`
- Modify: `dashboard/app/(protected)/compare/page.tsx`

- [ ] **Step 1: Schrijf `components/compare/WaardeCompareSection.tsx`**

```tsx
import type { Site } from '@/lib/types'
import { formatEuro } from '@/lib/format'
import { ValueComparisonBarChart, type ValueComparisonRow } from '@/components/charts/ValueComparisonBarChart'

export type WaardeCompareRow = {
  site: Site
  lastMonthLeads: number
}

export function WaardeCompareSection({ rows }: { rows: WaardeCompareRow[] }) {
  if (rows.length === 0) {
    return (
      <p className="rounded-lg border border-border bg-surface px-4 py-8 text-center text-sm text-secondary">
        Selecteer minstens één site om te vergelijken.
      </p>
    )
  }

  const chartData: ValueComparisonRow[] = rows
    .filter((r) => r.site.lead_value_eur !== null)
    .map((r) => ({
      name: r.site.name,
      value: r.lastMonthLeads * (r.site.lead_value_eur as number),
    }))

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-surface p-4">
        <ValueComparisonBarChart data={chartData} />
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-secondary">
              <th className="px-4 py-2 font-medium">Site</th>
              <th className="px-4 py-2 font-medium">Leads vorige maand</th>
              <th className="px-4 py-2 font-medium">Leadwaarde (€/lead)</th>
              <th className="px-4 py-2 font-medium">Potentiële omzet vorige maand</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ site, lastMonthLeads }) => (
              <tr key={site.id} className="border-b border-border last:border-0">
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

- [ ] **Step 2: Wijzig `app/(protected)/compare/page.tsx`**

Wijzig de import van `@/lib/metrics` (voeg `getSiteDailyMetrics` toe aan de
bestaande named imports):

```ts
import { getActiveSites, getSitePeriodTotals, getSiteDailyMetrics } from '@/lib/metrics'
```

Voeg twee nieuwe imports toe:

```ts
import { getThreeCalendarMonths, getThreeMonthFetchRange } from '@/lib/calendarMonths'
import { bucketByCalendarMonth } from '@/lib/aggregate'
import { WaardeCompareSection } from '@/components/compare/WaardeCompareSection'
```

Voeg na de bestaande `rows`-berekening (vlak vóór de `return`) toe:

```ts
  const calendarMonths = getThreeCalendarMonths()
  const waardeRows = await Promise.all(
    selectedSites.map(async (site) => {
      const daily = await getSiteDailyMetrics(supabase, site.id, getThreeMonthFetchRange(calendarMonths))
      const buckets = bucketByCalendarMonth(daily, calendarMonths)
      return { site, lastMonthLeads: buckets[1].totalLeads }
    })
  )
```

En voeg een tweede entry toe aan de `tabs`-array van `<Tabs>`, na "leads":

```tsx
          {
            id: 'waarde',
            label: 'Waarde',
            content: <WaardeCompareSection rows={waardeRows} />,
          },
```

- [ ] **Step 3: Typecheck**

```bash
cd /Users/krino/Desktop/Claude/Palantir/dashboard && npx tsc --noEmit
```

Verwacht: geen output.

- [ ] **Step 4: Verificatie tegen echte data**

```bash
cd /Users/krino/Desktop/Claude/Palantir/dashboard
export SUPABASE_SERVICE_ROLE_KEY=$(grep SUPABASE_SERVICE_ROLE_KEY .env.local | cut -d= -f2)
npx -y tsx -e "
import { createClient } from '@supabase/supabase-js'
import { getSiteDailyMetrics } from './lib/metrics'
import { getThreeCalendarMonths, getThreeMonthFetchRange } from './lib/calendarMonths'
import { bucketByCalendarMonth } from './lib/aggregate'

const supabase = createClient('https://jnevwlayotiltscmhpme.supabase.co', process.env.SUPABASE_SERVICE_ROLE_KEY!)

async function main() {
  const months = getThreeCalendarMonths(new Date('2026-08-16T12:00:00Z'))
  const daily = await getSiteDailyMetrics(supabase, '930da748-72b0-4c3b-aa4b-8dcc4aed0266', getThreeMonthFetchRange(months))
  const buckets = bucketByCalendarMonth(daily, months)
  console.log('maanden:', buckets.map(b => \`\${b.label}: \${b.totalLeads}\`))
  console.log('vorige maand (buckets[1]):', buckets[1].label, buckets[1].totalLeads)
}
main()
"
```

Verwacht: 3 maanden gelogd, en de "vorige maand"-regel toont dezelfde waarde
die je zou zien als je de individuele Waarde-tab van deze site opent (dat is
namelijk exact dezelfde berekening, hergebruikt).

- [ ] **Step 5: Handmatige controle in de dev server**

```bash
npm run dev
```

Open `http://localhost:3000/compare`, klik op de nieuwe "Waarde"-tab. Verwacht:
- Voor sites mét ingevulde leadwaarde: een balk in de grafiek + bedragen in de tabel.
- Voor sites zonder ingevulde leadwaarde: geen balk in de grafiek, "niet ingesteld" in de laatste twee tabelkolommen.
- "Leads"-tab blijft ongewijzigd werken.

Stop de dev server (Ctrl+C) zodra dit klopt.

- [ ] **Step 6: Cloudflare-build-check**

```bash
npm run cf:deploy
```

Verwacht: bouwt en deployt zonder errors.

- [ ] **Step 7: Commit en push**

```bash
cd /Users/krino/Desktop/Claude/Palantir
git add dashboard/components/compare/WaardeCompareSection.tsx \
        "dashboard/app/(protected)/compare/page.tsx"
git commit -m "feat: Waarde-tab op vergelijken-pagina (fase 2/3, stap 3/3)"
git push
```
