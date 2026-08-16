# Vergelijken — site-selectie via checkboxes in de tabellen — design

## Context

`/compare` selecteert welke sites vergeleken worden via `SiteMultiSelect`, een
los blokje pil-knoppen boven de tabjes. De gebruiker wil dit vervangen door
checkboxes rechtstreeks in de tabellen (Leads-tab, Waarde-tab): elke tabel
toont voortaan altijd alle actieve sites, met een checkbox links op elke rij
om die site wel/niet mee te laten tellen in de grafiek erboven.

## Scope

Alleen `/compare` en zijn directe componenten. Geen wijzigingen aan de
individuele site-detailpagina, `/sites`, of het databaseschema.

## Niet-doelen

- Geen fase 3 (SEO-tab) — dat komt hierna, los.
- Geen wijziging aan hoe de `sites`-URL-parameter zelf werkt (nog steeds een
  kommagescheiden lijst site-ID's, nog steeds de eerste 3 actieve sites als
  standaard wanneer de parameter ontbreekt) — alleen de UI om 'm te wijzigen
  verandert.

## 1. `SiteMultiSelect` verwijderen

Nergens anders gebruikt (geverifieerd) — wordt volledig verwijderd, geen
vervangend paginaniveau-component. De titel-rij bovenaan de pagina blijft
gewoon staan zonder de pillen eronder.

## 2. Nieuw, gedeeld component: `components/sites/SiteToggleCheckbox.tsx`

Eén checkbox-cel, herbruikt in beide tabellen. Krijgt `siteId` en de huidige
`selectedIds`-lijst mee (niet zelf opnieuw uit de URL lezen — de pagina heeft
de standaard-fallback al toegepast, dat moet niet dubbel/anders gebeuren in
een client-component). Toggle-logica is functioneel identiek aan wat nu al in
`SiteMultiSelect` zit: voegt of verwijdert het site-ID uit de lijst en
schrijft de nieuwe lijst terug naar de `sites`-parameter.

## 3. `SitesTable` en `WaardeCompareSection`'s tabel: alle sites, checkbox, dimming

Beide tabellen krijgen een extra kolom uiterst links (de checkbox, geen
header-tekst nodig) en tonen voortaan **alle actieve sites**, niet alleen de
geselecteerde. Niet-aangevinkte rijen krijgen een gedimde stijl (lagere
opacity op de hele rij) zodat duidelijk is dat ze niet meetellen, maar
blijven volledig zichtbaar en klikbaar om weer aan te vinken.

## 4. Grafieken blijven gefilterd op selectie

`ComparisonBarChart` (Leads) en `ValueComparisonBarChart` (Waarde) tonen nog
steeds alléén de aangevinkte sites — de sectie-componenten
(`LeadsCompareSection`, `WaardeCompareSection`) filteren de chart-data op
`selectedIds` vóór ze aan de grafiek doorgeven, maar geven de ongefilterde
volledige lijst door aan de tabel.

## 5. Data-ophalen: voortaan voor alle actieve sites

`app/(protected)/compare/page.tsx` haalt `rows`/`waardeRows` voortaan op voor
`allSites` in plaats van alleen `selectedSites` — nodig omdat de tabellen nu
altijd alles tonen. Bij het huidige aantal sites (3) verwaarloosbaar; bij
sterke groei in aantal sites zou dit een aandachtspunt kunnen worden, maar
dat is voor nu geen reden om dit ontwerp anders te doen.
