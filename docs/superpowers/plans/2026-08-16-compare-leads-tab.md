# Vergelijken — Leads-tab (fase 1/3) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `/compare` krijgt een tab-structuur (te beginnen met één "Leads"-tab,
klaar voor fase 2/3 om ernaast te schuiven) met een gestapelde, gekleurde
staafdiagram per site (bel-website/bel-GMB/WhatsApp/formulier, elk een eigen
kleur) en een tabel met hetzelfde onderscheid.

**Architecture:** Zuiver een UI-laag-wijziging — alle benodigde data
(`phone_clicks_cur`, `gmb_calls_cur`, `whatsapp_clicks_cur`, `form_leads_cur`,
`total_leads_cur`/`_prev`) bestaat al in `PeriodTotals` via de bestaande
`getSitePeriodTotals`. Hergebruikt de generieke `Tabs`-component en de
bestaande `STAT_COLORS` (dezelfde kleuren als op de site-detailpagina).

**Tech Stack:** Next.js 16 (App Router), Recharts, Tailwind.

**Over verificatie:** zelfde aanpak als bij de Waarde-tab — geen testrunner in
dit project (bestaande, bewuste keuze). Elke stap verifieert met
`npx tsc --noEmit`; waar zinvol ook een read-only check tegen echte Supabase-
data om te bevestigen dat de weergegeven getallen kloppen.

**Spec:** `docs/superpowers/specs/2026-08-16-compare-leads-tab-design.md`

---

### Task 1: Gestapelde, gekleurde vergelijkingsgrafiek

**Files:**
- Modify: `dashboard/components/charts/ComparisonBarChart.tsx`

- [ ] **Step 1: Herschrijf `ComparisonBarChart.tsx`**

Vervang de volledige inhoud van het bestand door:

```tsx
'use client'

import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from 'recharts'
import { STAT_COLORS } from '@/lib/statColors'

export type ComparisonBarRow = {
  name: string
  bel: number
  gmb: number
  whatsapp: number
  form: number
}

const LEGEND_ITEMS = [
  { key: 'bel', label: 'Bel (website)', color: STAT_COLORS.bel },
  { key: 'gmb', label: 'Bel (GMB)', color: STAT_COLORS.gmb },
  { key: 'whatsapp', label: 'WhatsApp', color: STAT_COLORS.whatsapp },
  { key: 'form', label: 'Formulier', color: STAT_COLORS.form },
]

export function ComparisonBarChart({ data }: { data: ComparisonBarRow[] }) {
  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-4">
        {LEGEND_ITEMS.map((item) => (
          <div key={item.key} className="flex items-center gap-1.5 text-xs text-secondary">
            <span className="h-2 w-2 rounded-full" style={{ background: item.color }} />
            {item.label}
          </div>
        ))}
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff1a" />
          <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#a1a1aa' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: '#a1a1aa' }} axisLine={false} tickLine={false} allowDecimals={false} />
          <Tooltip
            cursor={{ fill: '#ffffff0d' }}
            contentStyle={{ background: '#17171b', border: '1px solid #ffffff1a', borderRadius: 8, fontSize: 12 }}
            labelStyle={{ color: '#f4f4f5' }}
          />
          <Bar dataKey="form" name="Formulier" stackId="leads" fill={STAT_COLORS.form} radius={[0, 0, 0, 0]} />
          <Bar dataKey="whatsapp" name="WhatsApp" stackId="leads" fill={STAT_COLORS.whatsapp} radius={[0, 0, 0, 0]} />
          <Bar dataKey="gmb" name="Bel (GMB)" stackId="leads" fill={STAT_COLORS.gmb} radius={[0, 0, 0, 0]} />
          <Bar dataKey="bel" name="Bel (website)" stackId="leads" fill={STAT_COLORS.bel} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
```

Let op: dit vervangt volledig de oude, ééndelige versie (die alleen
`{ name: string; total_leads: number }` als data-vorm had, en één kleur). De
stack-volgorde (form → whatsapp → gmb → bel, met `bel` als laatste/bovenste
laag met afgeronde hoek) volgt exact hetzelfde patroon als het bestaande
`BarChartWeekly.tsx` op de site-detailpagina.

- [ ] **Step 2: Typecheck**

```bash
cd /Users/krino/Desktop/Claude/Palantir/dashboard && npx tsc --noEmit
```

Verwacht: dit geeft NU juist wél een fout — `ComparisonPage`'s aanroep van
`ComparisonBarChart` gebruikt nog de oude databorm (`{ name, total_leads }`)
totdat Task 3 dat bijwerkt. Dat is oké voor deze stap; noteer de foutmelding
en ga door (Task 3 lost 'm op). Bevestig wel dat de fout specifiek over de
`data`-prop van `ComparisonBarChart` gaat en nergens anders over.

- [ ] **Step 3: Commit**

```bash
cd /Users/krino/Desktop/Claude/Palantir
git add dashboard/components/charts/ComparisonBarChart.tsx
git commit -m "feat: gestapelde/gekleurde vergelijkingsgrafiek (vergelijken-Leads-tab, stap 1/3)"
```

---

### Task 2: Tabel — Bel-kolom splitsen in website/GMB

**Files:**
- Modify: `dashboard/components/sites/SitesTable.tsx`

- [ ] **Step 1: Splits de "Bel"-kolom**

Vervang de `<thead>`-rij en de bijbehorende `<td>`'s. Volledige nieuwe inhoud
van `SitesTable.tsx`:

```tsx
import Link from 'next/link'
import type { PeriodTotals, Site } from '@/lib/types'
import { TrendBadge } from '@/components/sites/TrendBadge'

export function SitesTable({
  rows,
}: {
  rows: { site: Site; totals: PeriodTotals }[]
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs text-secondary">
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
            <tr key={site.id} className="border-b border-border last:border-0">
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

- [ ] **Step 2: Typecheck**

```bash
cd /Users/krino/Desktop/Claude/Palantir/dashboard && npx tsc --noEmit
```

Verwacht: dezelfde ene fout als na Task 1 (over `ComparisonBarChart`'s
`data`-prop in `compare/page.tsx`), niets nieuws — `SitesTable` zelf gebruikt
alleen bestaande velden van `PeriodTotals` (`gmb_calls_cur` bestaat al op dat
type), dus introduceert geen eigen typefout.

- [ ] **Step 3: Commit**

```bash
cd /Users/krino/Desktop/Claude/Palantir
git add dashboard/components/sites/SitesTable.tsx
git commit -m "feat: Bel-kolom gesplitst in website/GMB (vergelijken-Leads-tab, stap 2/3)"
```

---

### Task 3: Tab-structuur, nieuwe sectie, pagina-verdrading

**Files:**
- Create: `dashboard/components/compare/LeadsCompareSection.tsx`
- Modify: `dashboard/app/(protected)/compare/page.tsx`

- [ ] **Step 1: Schrijf `components/compare/LeadsCompareSection.tsx`**

```tsx
import type { PeriodTotals, Site } from '@/lib/types'
import type { PeriodKey } from '@/lib/periods'
import { PeriodDropdown } from '@/components/sites/PeriodDropdown'
import { ComparisonBarChart, type ComparisonBarRow } from '@/components/charts/ComparisonBarChart'
import { SitesTable } from '@/components/sites/SitesTable'

export function LeadsCompareSection({
  leadsPeriod,
  rows,
}: {
  leadsPeriod: PeriodKey
  rows: { site: Site; totals: PeriodTotals }[]
}) {
  const chartData: ComparisonBarRow[] = rows.map(({ site, totals }) => ({
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

      {rows.length === 0 ? (
        <p className="rounded-lg border border-border bg-surface px-4 py-8 text-center text-sm text-secondary">
          Selecteer minstens één site om te vergelijken.
        </p>
      ) : (
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-surface p-4">
            <ComparisonBarChart data={chartData} />
          </div>
          <SitesTable rows={rows} />
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Herschrijf `app/(protected)/compare/page.tsx`**

Vervang de volledige inhoud van het bestand door:

```tsx
import { createClient } from '@/lib/supabase/server'
import { getActiveSites, getSitePeriodTotals } from '@/lib/metrics'
import { getPeriodRange, type PeriodKey } from '@/lib/periods'
import { SiteMultiSelect } from '@/components/sites/SiteMultiSelect'
import { Tabs } from '@/components/site-detail/Tabs'
import { LeadsCompareSection } from '@/components/compare/LeadsCompareSection'

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

  const selectedSites = allSites.filter((s) => selectedIds.includes(s.id))

  const rows = await Promise.all(
    selectedSites.map(async (site) => ({
      site,
      totals: await getSitePeriodTotals(supabase, site.id, leadsRange),
    }))
  )

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-lg font-semibold text-primary">Sites vergelijken</h1>
      </div>

      <div className="mb-5">
        <SiteMultiSelect sites={allSites} selectedIds={selectedIds} />
      </div>

      <Tabs
        tabs={[
          {
            id: 'leads',
            label: 'Leads',
            content: <LeadsCompareSection leadsPeriod={leadsPeriod} rows={rows} />,
          },
        ]}
      />
    </div>
  )
}
```

Let op wat hier verdwijnt t.o.v. de oude versie: de losse `period`-param
(vervangen door `leadsPeriod`, nu binnen `LeadsCompareSection`), de losse
`PeriodDropdown`/`ComparisonBarChart`/`SitesTable`/lege-staat-tekst op
paginaniveau (verplaatst naar `LeadsCompareSection`), en de nu ongebruikte
imports (`PeriodDropdown`, `ComparisonBarChart`, `SitesTable`,
`getPeriodRange`'s oude aanroep-vorm blijft, alleen de param-naam wijzigt).

- [ ] **Step 3: Typecheck**

```bash
cd /Users/krino/Desktop/Claude/Palantir/dashboard && npx tsc --noEmit
```

Verwacht: geen output — dit lost de tijdelijke fout van Task 1/2 op, want
`compare/page.tsx` roept `ComparisonBarChart` nu aan via `LeadsCompareSection`
met de juiste, nieuwe databorm.

- [ ] **Step 4: Verificatie tegen echte data**

Geen testrunner (bewuste, bestaande keuze). Verifieer met een `npx tsx`-script
tegen de live database dat de berekende rij-data voor de grafiek/tabel klopt
voor een bestaande site:

```bash
cd /Users/krino/Desktop/Claude/Palantir/dashboard
export SUPABASE_SERVICE_ROLE_KEY=$(grep SUPABASE_SERVICE_ROLE_KEY .env.local | cut -d= -f2)
npx -y tsx -e "
import { createClient } from '@supabase/supabase-js'
import { getSitePeriodTotals } from './lib/metrics'
import { getPeriodRange } from './lib/periods'

const supabase = createClient('https://jnevwlayotiltscmhpme.supabase.co', process.env.SUPABASE_SERVICE_ROLE_KEY!)

async function main() {
  const range = getPeriodRange('month', new Date('2026-08-16T12:00:00Z'))
  const totals = await getSitePeriodTotals(supabase, '930da748-72b0-4c3b-aa4b-8dcc4aed0266', range)
  console.log('phone_clicks_cur (bel-website):', totals.phone_clicks_cur)
  console.log('gmb_calls_cur (bel-GMB):', totals.gmb_calls_cur)
  console.log('whatsapp_clicks_cur:', totals.whatsapp_clicks_cur)
  console.log('form_leads_cur:', totals.form_leads_cur)
  console.log('total_leads_cur:', totals.total_leads_cur)
  console.log('som van de 4 losse velden === total_leads_cur:',
    totals.phone_clicks_cur + totals.gmb_calls_cur + totals.whatsapp_clicks_cur + totals.form_leads_cur === totals.total_leads_cur)
}
main()
"
```

Verwacht: het laatste regel logt `true` — de som van de 4 losse velden die de
grafiek als gestapelde segmenten toont, moet exact gelijk zijn aan
`total_leads_cur` (dit is triviaal waar gegeven hoe `total_leads` als
generated column is gedefinieerd, maar bevestig het toch expliciet, want dit
is precies het getal dat straks visueel als 4 gekleurde stukjes naast elkaar
komt te staan — als de som niet klopt, is er iets mis met welke velden
gebruikt worden).

- [ ] **Step 5: Handmatige controle in de dev server**

```bash
npm run dev
```

Open `http://localhost:3000/compare` in de browser. Verwacht:
- Eén tabblad "Leads" (voorbereid op fase 2/3 die er later een tabblad naast zetten).
- Site-multiselect en periodeselector werken zoals voorheen.
- De staafdiagram toont per geselecteerde site een gestapelde balk met (van
  onder naar boven) formulier/WhatsApp/GMB-bel/website-bel, met een legenda
  erboven die de 4 kleuren benoemt.
- De tabel toont losse kolommen "Bel (website)" en "Bel (GMB)".

Stop de dev server (Ctrl+C) zodra dit klopt.

- [ ] **Step 6: Cloudflare-build-check**

```bash
npm run cf:deploy
```

Verwacht: bouwt en deployt zonder errors, eindigt met een `Uploaded
palantir-dashboard`-regel en de live URL.

- [ ] **Step 7: Commit en push**

```bash
cd /Users/krino/Desktop/Claude/Palantir
git add dashboard/components/compare/LeadsCompareSection.tsx \
        "dashboard/app/(protected)/compare/page.tsx"
git commit -m "feat: tab-structuur + Leads-tab op vergelijken-pagina (fase 1/3, stap 3/3)"
git push
```
