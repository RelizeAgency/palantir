# Vergelijken — SEO-tab (fase 3/3) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Derde en laatste tab "SEO" op `/compare`: vertoningen, organische
kliks, totaal bezoekers en gemiddelde engagement per site naast elkaar,
dezelfde vier metrics als de individuele site-pagina's SEO-tab.

**Architecture:** Hergebruikt bestaande data-functies zonder ze te wijzigen
(`getSiteSeoPeriodTotals`, `getSiteGa4Totals`) — puur nieuwe UI-laag, zelfde
patroon als de Leads/Waarde-tabs: eigen periodeselector, één grafiek
(organische kliks) als visuele blikvanger, een tabel met alle vier metrics
plus checkbox-selectie (consistent met de andere twee tabjes).

**Tech Stack:** Next.js 16 (App Router), Recharts, Tailwind.

**Over verificatie:** zelfde aanpak als de vorige features — geen testrunner
in dit project (bestaande, bewuste keuze). Elke stap verifieert met
`npx tsc --noEmit`.

**Spec:** `docs/superpowers/specs/2026-08-16-compare-seo-tab-design.md`

---

### Task 1: Eenvoudige SEO-vergelijkingsgrafiek

**Files:**
- Create: `dashboard/components/charts/SeoComparisonBarChart.tsx`

- [ ] **Step 1: Schrijf `SeoComparisonBarChart.tsx`**

```tsx
'use client'

import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from 'recharts'
import { STAT_COLORS } from '@/lib/statColors'

export type SeoComparisonRow = {
  name: string
  value: number
}

export function SeoComparisonBarChart({ data }: { data: SeoComparisonRow[] }) {
  return (
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
        <Bar dataKey="value" fill={STAT_COLORS.seoClicks} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
```

`STAT_COLORS.seoClicks` is dezelfde kleur die de "Kliks"-kaart op de
individuele site-pagina al gebruikt — bewust hergebruikt voor visuele
consistentie, in plaats van een nieuwe kleur te verzinnen zoals bij de
Waarde-grafiek (waar geen bestaande kleurassociatie was).

- [ ] **Step 2: Typecheck**

```bash
cd /Users/krino/Desktop/Claude/Palantir/dashboard && npx tsc --noEmit
```

Verwacht: geen output — dit component wordt nog nergens aangeroepen.

- [ ] **Step 3: Commit**

```bash
cd /Users/krino/Desktop/Claude/Palantir
git add dashboard/components/charts/SeoComparisonBarChart.tsx
git commit -m "feat: eenvoudige SEO-vergelijkingsgrafiek (vergelijken-SEO-tab, stap 1/3)"
```

---

### Task 2: SEO-vergelijkingssectie

**Files:**
- Create: `dashboard/components/compare/SeoCompareSection.tsx`

- [ ] **Step 1: Schrijf `SeoCompareSection.tsx`**

```tsx
import type { Ga4SiteTotals, SeoPeriodTotals, Site } from '@/lib/types'
import type { PeriodKey } from '@/lib/periods'
import { formatDuration } from '@/lib/format'
import { PeriodDropdown } from '@/components/sites/PeriodDropdown'
import { SeoComparisonBarChart, type SeoComparisonRow } from '@/components/charts/SeoComparisonBarChart'
import { SiteToggleCheckbox } from '@/components/sites/SiteToggleCheckbox'

export type SeoCompareRow = {
  site: Site
  seoTotals: SeoPeriodTotals | null
  ga4Totals: Ga4SiteTotals
}

export function SeoCompareSection({
  seoPeriod,
  rows,
  selectedIds,
}: {
  seoPeriod: PeriodKey
  rows: SeoCompareRow[]
  selectedIds: string[]
}) {
  const chartData: SeoComparisonRow[] = rows
    .filter((r) => selectedIds.includes(r.site.id) && r.seoTotals !== null)
    .map((r) => ({
      name: r.site.name,
      value: (r.seoTotals as SeoPeriodTotals).clicks_cur,
    }))

  return (
    <div>
      <div className="mb-4 flex justify-start">
        <PeriodDropdown paramKey="seoPeriod" current={seoPeriod} />
      </div>

      <div className="space-y-4">
        <div className="rounded-xl border border-border bg-surface p-4">
          {chartData.length === 0 ? (
            <p className="py-8 text-center text-sm text-secondary">
              Vink minstens één site met een Search Console-koppeling aan om te vergelijken.
            </p>
          ) : (
            <SeoComparisonBarChart data={chartData} />
          )}
        </div>

        <div className="overflow-hidden rounded-xl border border-border bg-surface">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-secondary">
                <th className="w-8 px-4 py-2"></th>
                <th className="px-4 py-2 font-medium">Site</th>
                <th className="px-4 py-2 font-medium">Vertoningen</th>
                <th className="px-4 py-2 font-medium">Organische kliks</th>
                <th className="px-4 py-2 font-medium">Totaal bezoekers</th>
                <th className="px-4 py-2 font-medium">Gem. engagement</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ site, seoTotals, ga4Totals }) => (
                <tr
                  key={site.id}
                  className={`border-b border-border last:border-0 ${
                    selectedIds.includes(site.id) ? '' : 'opacity-40'
                  }`}
                >
                  <td className="px-4 py-2.5">
                    <SiteToggleCheckbox siteId={site.id} siteName={site.name} selectedIds={selectedIds} />
                  </td>
                  <td className="px-4 py-2.5 font-medium text-primary">{site.name}</td>
                  <td className="px-4 py-2.5 text-secondary">
                    {seoTotals !== null ? seoTotals.impressions_cur : 'niet gekoppeld'}
                  </td>
                  <td className="px-4 py-2.5 text-secondary">
                    {seoTotals !== null ? seoTotals.clicks_cur : 'niet gekoppeld'}
                  </td>
                  <td className="px-4 py-2.5 text-secondary">{ga4Totals.total_users_cur}</td>
                  <td className="px-4 py-2.5 text-secondary">
                    {formatDuration(ga4Totals.avg_engagement_seconds_cur)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
```

`seoTotals` is `null` wanneer een site nog geen Search Console-koppeling
heeft (zelfde bestaande betekenis als op de individuele pagina) — Totaal
bezoekers/Gem. engagement blijven altijd zichtbaar, want GA4 is verplicht
per site (nooit `null`).

- [ ] **Step 2: Typecheck**

```bash
cd /Users/krino/Desktop/Claude/Palantir/dashboard && npx tsc --noEmit
```

Verwacht: geen output — dit component wordt nog nergens aangeroepen.

- [ ] **Step 3: Commit**

```bash
cd /Users/krino/Desktop/Claude/Palantir
git add dashboard/components/compare/SeoCompareSection.tsx
git commit -m "feat: SEO-vergelijkingssectie (vergelijken-SEO-tab, stap 2/3)"
```

---

### Task 3: Pagina-verdrading

**Files:**
- Modify: `dashboard/app/(protected)/compare/page.tsx`

- [ ] **Step 1: Herschrijf `app/(protected)/compare/page.tsx`**

Vervang de volledige inhoud van het bestand door:

```tsx
import { createClient } from '@/lib/supabase/server'
import {
  getActiveSites,
  getSitePeriodTotals,
  getSiteDailyMetrics,
  getSiteSeoPeriodTotals,
  getSiteGa4Totals,
} from '@/lib/metrics'
import { getPeriodRange, type PeriodKey } from '@/lib/periods'
import { getThreeCalendarMonths, getThreeMonthFetchRange, getYearToDateRange } from '@/lib/calendarMonths'
import { bucketByCalendarMonth } from '@/lib/aggregate'
import { Tabs } from '@/components/site-detail/Tabs'
import { LeadsCompareSection } from '@/components/compare/LeadsCompareSection'
import { WaardeCompareSection } from '@/components/compare/WaardeCompareSection'
import { SeoCompareSection } from '@/components/compare/SeoCompareSection'

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ leadsPeriod?: string; seoPeriod?: string; sites?: string }>
}) {
  const params = await searchParams
  const leadsPeriod = (params.leadsPeriod as PeriodKey) ?? 'month'
  const leadsRange = getPeriodRange(leadsPeriod)
  const seoPeriod = (params.seoPeriod as PeriodKey) ?? 'month'
  const seoRange = getPeriodRange(seoPeriod)

  const supabase = await createClient()
  const allSites = await getActiveSites(supabase)

  const selectedIds = params.sites
    ? params.sites.split(',').filter(Boolean)
    : allSites.slice(0, Math.min(3, allSites.length)).map((s) => s.id)

  const calendarMonths = getThreeCalendarMonths()

  const [rows, waardeRows, seoRows] = await Promise.all([
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
        const ytdDaily = await getSiteDailyMetrics(supabase, site.id, getYearToDateRange())
        const ytdLeads = ytdDaily.reduce((sum, row) => sum + row.total_leads, 0)
        return { site, lastMonthLeads: buckets[1].totalLeads, ytdLeads }
      })
    ),
    Promise.all(
      allSites.map(async (site) => ({
        site,
        seoTotals: site.gsc_site_url ? await getSiteSeoPeriodTotals(supabase, site.id, seoRange) : null,
        ga4Totals: await getSiteGa4Totals(supabase, site.id, seoRange),
      }))
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
          {
            id: 'seo',
            label: 'SEO',
            content: <SeoCompareSection seoPeriod={seoPeriod} rows={seoRows} selectedIds={selectedIds} />,
          },
        ]}
      />
    </div>
  )
}
```

Kernverschillen t.o.v. de vorige versie: `getSiteSeoPeriodTotals`/
`getSiteGa4Totals`-imports, een derde `seoPeriod`-param (eigen periode, los
van `leadsPeriod`), een derde parallelle fetch-tak (`seoRows`) in dezelfde
buitenste `Promise.all` als de andere twee (niet na elkaar — zelfde
performance-les als eerder in dit project geleerd), en een derde tab-entry.

- [ ] **Step 2: Typecheck**

```bash
cd /Users/krino/Desktop/Claude/Palantir/dashboard && npx tsc --noEmit
```

Verwacht: geen output.

- [ ] **Step 3: Verificatie tegen echte data**

```bash
cd /Users/krino/Desktop/Claude/Palantir/dashboard
export SUPABASE_SERVICE_ROLE_KEY=$(grep SUPABASE_SERVICE_ROLE_KEY .env.local | cut -d= -f2)
npx -y tsx -e "
import { createClient } from '@supabase/supabase-js'
import { getSiteSeoPeriodTotals, getSiteGa4Totals } from './lib/metrics'
import { getPeriodRange } from './lib/periods'

const supabase = createClient('https://jnevwlayotiltscmhpme.supabase.co', process.env.SUPABASE_SERVICE_ROLE_KEY!)

async function main() {
  const range = getPeriodRange('month', new Date('2026-08-16T12:00:00Z'))
  const seo = await getSiteSeoPeriodTotals(supabase, '930da748-72b0-4c3b-aa4b-8dcc4aed0266', range)
  const ga4 = await getSiteGa4Totals(supabase, '930da748-72b0-4c3b-aa4b-8dcc4aed0266', range)
  console.log('vertoningen:', seo.impressions_cur, '| organische kliks:', seo.clicks_cur)
  console.log('totaal bezoekers:', ga4.total_users_cur, '| gem. engagement (sec):', ga4.avg_engagement_seconds_cur)
}
main()
"
```

Verwacht: zinnige getallen (geen crash, geen `NaN`) — dit zijn dezelfde
functies die de individuele SEO-tab van deze site al gebruikt, dus de
uitkomst moet identiek zijn aan wat daar te zien is.

- [ ] **Step 4: Handmatige controle in de dev server**

```bash
npm run dev
```

Open `http://localhost:3000/compare`, klik op de nieuwe "SEO"-tab. Verwacht:
- Tabel toont alle sites met checkbox, Vertoningen/Organische kliks/Totaal
  bezoekers/Gem. engagement.
- Sites zonder Search Console-koppeling tonen "niet gekoppeld" in de eerste
  twee kolommen, maar wél gewone GA4-cijfers in de laatste twee.
- Grafiek toont organische kliks per aangevinkte site (met SC-koppeling);
  uitvinken verwijdert de balk maar niet de tabelrij (gedimd).
- Periodeselector werkt onafhankelijk van de Leads-tab se eigen selector.
- "Leads"- en "Waarde"-tab blijven ongewijzigd werken.

Stop de dev server (Ctrl+C) zodra dit klopt.

- [ ] **Step 5: Cloudflare-build-check**

```bash
npm run cf:deploy
```

Verwacht: bouwt en deployt zonder errors.

- [ ] **Step 6: Commit en push**

```bash
cd /Users/krino/Desktop/Claude/Palantir
git add "dashboard/app/(protected)/compare/page.tsx"
git commit -m "feat: SEO-tab op vergelijken-pagina (fase 3/3, stap 3/3)"
git push
```
