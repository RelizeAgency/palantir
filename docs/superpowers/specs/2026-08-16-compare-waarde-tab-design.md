# Vergelijken — Waarde-tab (fase 2 van 3) — design

## Context

Fase 1 zette de tab-structuur op `/compare` neer (`Tabs`, momenteel alleen
"Leads"). Deze fase voegt een tweede tab "Waarde" toe: de potentiële omzet van
vorige maand per site naast elkaar, met dezelfde rekenregel als de Waarde-tab
op de individuele site-pagina (leads × handmatig ingestelde leadwaarde per
site), maar dan vergelijkend over de geselecteerde sites.

## Scope

Alleen `/compare` en zijn directe componenten. Geen wijzigingen aan de
individuele site-detailpagina, `/sites`, of het databaseschema — alle
benodigde bouwstenen (`getThreeCalendarMonths`, `getThreeMonthFetchRange`,
`bucketByCalendarMonth`, `getSiteDailyMetrics`, `site.lead_value_eur`) bestaan
al, gebouwd voor de individuele Waarde-tab.

## Niet-doelen (deze fase)

- Geen SEO-tab (fase 3).
- Geen periodeselector op dit tabje — altijd "vorige maand" (kalendermaand),
  exact dezelfde definitie als op de individuele site-pagina.
- Geen bewerkbaar leadwaarde-veld hier — die blijft alleen instelbaar op de
  individuele site-pagina; dit tabje toont alleen wat daar al is ingesteld.
- Geen jaartotaal-vergelijking (dat bestaat wel op de individuele pagina,
  maar is hier niet gevraagd).

## 1. Data per geselecteerde site

Voor elke site in de bestaande `selectedSites`-lijst (paginaniveau, ongewijzigd
uit fase 1):

```
calendarMonths = getThreeCalendarMonths()
daily = getSiteDailyMetrics(supabase, site.id, getThreeMonthFetchRange(calendarMonths))
buckets = bucketByCalendarMonth(daily, calendarMonths)
lastMonthLeads = buckets[1].totalLeads   // index 1 = vorige maand, zelfde ordening als op de site-pagina
```

Hergebruikt bewust exact dezelfde functies als de individuele Waarde-tab, dus
gegarandeerd dezelfde definitie van "vorige maand" door de hele app heen.

## 2. Omgaan met een niet-ingestelde leadwaarde

Als `site.lead_value_eur === null`: de site krijgt geen balk in de grafiek
(er is geen bedrag om te tekenen), maar staat wél in de tabel met "niet
ingesteld" in plaats van een bedrag — zo blijft duidelijk dat het om
ontbrekende configuratie gaat, niet om nul omzet.

## 3. Nieuw component: `components/charts/ValueComparisonBarChart.tsx`

Eenvoudige, niet-gestapelde staafdiagram: één accentkleur-balk per site (in
tegenstelling tot de 4-kleuren-gestapelde grafiek op de Leads-tab, want hier
is er maar één getal per site, geen bronnen-onderscheid). Sites zonder
leadwaarde worden uit de chart-data weggelaten (zie boven).

## 4. Nieuw component: `components/compare/WaardeCompareSection.tsx`

Naar het patroon van `LeadsCompareSection.tsx`: geen periodeselector (bewust
afwezig, zie niet-doelen), de nieuwe staafdiagram, en een tabel met kolommen
Site / Leads vorige maand / Leadwaarde (€/lead) / Potentiële omzet vorige
maand — voor sites zonder leadwaarde tonen de laatste twee kolommen "niet
ingesteld" in plaats van een bedrag.

## 5. Kleine opruiming: gedeelde `formatEuro`-helper

`formatEuro` (euro-opmaak via `Intl.NumberFormat('nl-NL', ...)`) staat nu
gedupliceerd in `BarChartMonthly.tsx` en `ValueSection.tsx` (al eerder
gesignaleerd als kleine duplicatie in de eindreview van de Waarde-tab-feature,
toen bewust niet meteen opgelost — "pas de moeite waard bij een derde
gebruiker"). Deze fase is die derde gebruiker: `formatEuro` verhuist naar een
nieuw, klein `lib/format.ts`, en de twee bestaande bestanden importeren 'm
vandaar i.p.v. hun eigen kopie te houden.

## 6. Tab-integratie

In `app/(protected)/compare/page.tsx`: tweede entry in de `tabs`-array,
label "Waarde", na "Leads". Site-multiselect op paginaniveau blijft
ongewijzigd en geldt voor beide tabs.
