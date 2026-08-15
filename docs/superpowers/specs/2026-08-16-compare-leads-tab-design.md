# Vergelijken — Leads-tab (fase 1 van 3) — design

## Context

`Sites vergelijken` (`/compare`) toont op dit moment één simpele, ééndelige
staafdiagram (totaal leads per site, één kleur) plus een tabel met kolommen
Bel/WhatsApp/Formulier/Totaal/Trend. De gebruiker wil dit uitbreiden tot drie
tabjes (Leads / Waarde / SEO) — dit document beschrijft alleen **fase 1: de
tab-structuur opzetten en de Leads-tab gekleurd/gestapeld maken**, inclusief
onderscheid tussen bel via de website en bel via Google Business Profile. Fase
2 (Waarde) en fase 3 (SEO) krijgen later hun eigen design/plan-cyclus en voegen
dan gewoon een tab toe aan de structuur die deze fase neerzet.

## Scope

Alleen `/compare` en zijn directe componenten. Geen wijzigingen aan `/sites`,
de individuele site-detailpagina, of databaseschema — alle benodigde data
(`phone_clicks_cur`, `gmb_calls_cur`, `whatsapp_clicks_cur`, `form_leads_cur`,
`total_leads_cur`, plus hun `_prev`-tegenhangers) bestaat al in `PeriodTotals`,
opgehaald via de bestaande `getSitePeriodTotals`. Deze fase is dus zuiver een
UI-laag-wijziging, geen nieuwe queries.

## Niet-doelen (deze fase)

- Geen Waarde- of SEO-tab (fase 2 en 3).
- Geen wijziging aan hoe periodes elders in de app werken.
- Geen wijziging aan welke leadbronnen bestaan — alleen hoe de al bestaande
  4 bronnen (bel-website, bel-GMB, WhatsApp, formulier) getoond worden.

## 1. Tab-structuur

Hergebruik van de bestaande generieke `components/site-detail/Tabs.tsx` (geen
wijziging nodig aan dat component — het is al een generieke `{id, label,
content}[]`-lijst). `/compare` krijgt voorlopig één tab, "Leads"; fase 2 en 3
voegen daar later gewoon een entry aan toe.

De site-multiselect (`SiteMultiSelect`, param `sites`) blijft op paginaniveau,
boven de tabs — dezelfde geselecteerde sites gelden voor alle tabjes. De
periodeselector verhuist ván paginaniveau (huidige param `period`) náár
binnen de Leads-tab zelf (nieuwe param `leadsPeriod`, zelfde patroon als
`leadsPeriod`/`gmbPeriod`/`seoPeriod` op de site-detailpagina) — want de
Waarde-tab uit fase 2 krijgt bewust géén periodeselector (net als bij de
individuele site), dus die hoort niet als gedeeld paginaniveau-ding thuis.

## 2. Data

Geen nieuwe fetch-functies nodig. `app/(protected)/compare/page.tsx` blijft
`getSitePeriodTotals` per geselecteerde site aanroepen (nu met een `leadsRange`
afgeleid van de nieuwe `leadsPeriod`-param i.p.v. de huidige `period`-param),
en geeft de resulterende `rows` door aan een nieuw sectie-component voor de
Leads-tab.

## 3. Nieuw component: `components/compare/LeadsCompareSection.tsx`

Naar het patroon van `components/site-detail/LeadsSection.tsx`: bevat de
periodeselector, de (aangepaste) staafdiagram en de (aangepaste) tabel. Props:
`leadsPeriod: PeriodKey` en `rows: { site: Site; totals: PeriodTotals }[]`.

## 4. `ComparisonBarChart` wordt gestapeld

Van `data: { name: string; total_leads: number }[]` met één kleur naar
`data: { name: string; bel: number; gmb: number; whatsapp: number; form: number }[]`
met 4 gestapelde segmenten per site-balk, zelfde kleuren als al gedefinieerd
in `lib/statColors.ts` (`bel`, `gmb`, `whatsapp`, `form` — dezelfde kleuren als
op de site-detailpagina, dus visueel consistent door de hele app). Voorbeeld
uit de vraag: 5 bel + 5 WhatsApp → de balk is voor de helft blauw (`bel`),
voor de helft groen (`whatsapp`).

Boven de grafiek komt een kleine, statische legenda (kleurpunt + label per
bron) — er staan hier geen losse stat-kaartjes naast zoals op de
site-detailpagina, dus zonder legenda zou niemand weten welke kleur wat
betekent.

## 5. `SitesTable`: Bel-kolom gesplitst

Kolom "Bel" wordt twee kolommen: "Bel (website)" (`phone_clicks_cur`) en "Bel
(GMB)" (`gmb_calls_cur`) — zelfde onderscheid als in de grafiek, tabel en
grafiek blijven zo 1-op-1 consistent. WhatsApp/Formulier/Totaal/Trend-kolommen
ongewijzigd.
