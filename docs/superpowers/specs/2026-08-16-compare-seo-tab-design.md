# Vergelijken — SEO-tab (fase 3 van 3) — design

## Context

Laatste van de drie tabjes op `/compare`. Vertoningen, organische kliks,
totaal bezoekers en gemiddelde engagement per site naast elkaar — dezelfde
vier metrics die de individuele site-pagina's SEO-tab al toont (uit
`SeoSection.tsx`/`GoogleAnalyticsSection.tsx`: "Vertoningen"/"Kliks" uit
Search Console, "Totaal bezoekers"/"Gem. engagement" uit Google Analytics).
CTR en gemiddelde positie bestaan ook al, maar zijn hier niet gevraagd —
blijven buiten dit tabje.

## Scope

Alleen `/compare` en zijn directe componenten. Geen wijzigingen aan de
individuele site-detailpagina of het databaseschema — alle benodigde data
(`getSiteSeoPeriodTotals`, `getSiteGa4Totals`) bestaat al.

## Niet-doelen

- Geen CTR/gemiddelde-positie-kolommen (niet gevraagd).
- Geen aparte periodes per metric-groep — één periodeselector voor het hele
  tabje, net als bij Leads.

## 1. Data per site

Voor elke actieve site (net als bij Leads/Waarde: altijd alle sites, niet
alleen geselecteerde):

```
seoTotals = site.gsc_site_url ? await getSiteSeoPeriodTotals(supabase, site.id, seoRange) : null
ga4Totals = await getSiteGa4Totals(supabase, site.id, seoRange)   // altijd aanwezig, GA4 is verplicht per site
```

`seoTotals` is `null` wanneer een site nog geen Search Console-koppeling
heeft (zelfde bestaande patroon als op de individuele pagina) — de
Vertoningen/Kliks-kolommen tonen dan "niet gekoppeld", Totaal bezoekers/Gem.
engagement blijven gewoon zichtbaar (GA4 is nooit optioneel).

## 2. Nieuw component: `components/charts/SeoComparisonBarChart.tsx`

Zelfde opzet als `ValueComparisonBarChart` (één kleur, één balk per site),
maar zonder euro-opmaak — toont ruwe aantallen (organische kliks). Sites
zonder Search Console-koppeling ontbreken in de grafiek (geen waarde om te
tekenen), net zoals sites zonder leadwaarde ontbreken in de Waarde-grafiek.

## 3. Nieuw component: `components/compare/SeoCompareSection.tsx`

Naar het patroon van `LeadsCompareSection`/`WaardeCompareSection`: eigen
periodeselector (`seoPeriod`-param), de nieuwe grafiek (organische kliks),
en een tabel met checkbox links (consistent met de andere twee tabjes) en
kolommen: Site / Vertoningen / Organische kliks / Totaal bezoekers / Gem.
engagement. Tabel toont altijd alle sites, gedimd wanneer uitgevinkt — zelfde
gedrag als de andere twee tabjes.

## 4. Tab-integratie

In `app/(protected)/compare/page.tsx`: derde entry in de `tabs`-array, label
"SEO", na "Waarde".
