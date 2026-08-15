# Lead-waarde tab — design

## Context

Palantir's site-detail pagina heeft drie tabs: Leads, Google Business Profile, SEO.
Het hele dashboard bestaat om groei per rank-and-rent site aantoonbaar te maken bij
verhuur-/verkoopgesprekken. Een leadaantal alleen zegt weinig in zo'n gesprek — een
geschatte omzetwaarde is overtuigender. Deze feature voegt een vierde tab toe die
leadaantallen omzet naar een geschatte potentiële maandomzet, op basis van een
handmatig ingevulde gemiddelde leadwaarde per site.

## Scope

Alleen de site-detail pagina (`app/(protected)/sites/[id]/page.tsx`) krijgt een
nieuwe tab. Geen wijzigingen aan `/sites`, `/compare`, of de Instellingen-pagina.

## Niet-doelen (expliciet buiten scope)

- Geen onderscheid tussen leadtypes (bel, WhatsApp, formulier, GMB-bel) — allemaal
  evenveel waard.
- Geen periodeselector op deze tab (in tegenstelling tot de andere drie tabs).
- Geen historische "rate-locking": als de leadwaarde wordt aangepast, herberekenen
  *alle* getoonde maanden (ook al eerder getoonde) met de nieuwe waarde. Er wordt
  nergens een oude waarde per maand bewaard.
- Geen validatie/onderzoek naar branche-gemiddelden — de gebruiker vult zelf een
  bedrag in.

## 1. Datamodel

Nieuwe migratie `supabase/migrations/0007_lead_value.sql`:

```sql
alter table sites add column lead_value_eur numeric(10,2);
```

Nullable, geen default. `null` betekent "nog niet ingesteld" (zie lege-staat
hieronder) — expliciet niet `0`, want `0` is een geldige (zij het onwaarschijnlijke)
waarde die niet verward mag worden met "nog niet ingevuld".

## 2. Rekenregel

Voor een gegeven kalendermaand:

```
maandwaarde = (phone_clicks + whatsapp_clicks + form_leads + gmb_calls in die maand) × lead_value_eur
```

Alle vier leadbronnen tellen even zwaar mee, inclusief `gmb_calls` zodra een site
ooit een Business Profile koppelt (vandaag heeft geen van de drie sites dat, dus nu
nog altijd 0 — de query hoeft daar geen onderscheid in te maken).

Er worden altijd precies 3 kalendermaanden getoond: de maand van 2 maanden terug,
vorige maand, en de huidige (lopende) maand — geen configureerbare periode.

## 3. Data ophalen

Nieuw: `lib/calendarMonths.ts` met een functie die, gegeven "vandaag", de start/eind-
datums van de 3 kalendermaanden teruggeeft (niet de bestaande rolling-day `PERIODS`
uit `lib/periods.ts` — dat zijn geen kalendermaand-grenzen), plus een label per maand
("jun 2026", "jul 2026", "aug 2026").

In `lib/metrics.ts`: een functie die `daily_metrics` (incl. `gmb_calls`) ophaalt voor
de volledige 3-maands-range (zelfde query-vorm als `getSiteDailyMetrics`, alleen een
andere range), en in `lib/aggregate.ts` een `bucketByCalendarMonth`-functie die die
dagelijkse rijen groepeert tot 3 totalen — naar het patroon van de bestaande
`bucketByWeek`.

De vermenigvuldiging met `lead_value_eur` gebeurt in het component, niet in SQL —
zo hoeft er geen aparte RPC bij, en blijft de "geen rate-locking"-regel triviaal
waar (er wordt nergens een waarde weggeschreven per maand, alleen live berekend).

## 4. UI

Nieuw component `components/site-detail/ValueSection.tsx`, zelfde patroon als
`LeadsSection`/`GmbSection`/`SeoSection`:

- **Invoerveld** bovenaan: "Gemiddelde waarde per lead (€)" + opslaanknop. Client
  component met een server action (`updateLeadValue(siteId, value)`, nieuw in
  `app/actions/sites.ts`), die `revalidatePath` aanroept op de site-detail-URL.
- **Lege staat**: zolang `lead_value_eur` `null` is, geen grote getallen of grafiek —
  alleen het invoerveld met de tekst "Vul een gemiddelde leadwaarde in om de
  potentiële omzet te zien."
- **Groot koptekst-getal**: de waarde van **vorige maand** (niet de lopende maand —
  anders zou een dashboard op bv. de 3e van de maand een misleidend laag getal tonen).
  Geformatteerd met `Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' })`.
- **Staafgrafiek** (nieuw `components/charts/BarChartMonthly.tsx`, analoog aan het
  bestaande `BarChartWeekly`): 3 balken, de 3 kalendermaanden. De balk van de huidige,
  nog niet afgeronde maand krijgt een lichtere/gestreepte stijl zodat 'ie visueel niet
  verward wordt met een volledige maand.

## 5. Tab-integratie

In `app/(protected)/sites/[id]/page.tsx`: vierde entry in de `tabs`-array van
`<Tabs>`, label **"Waarde"**, na SEO. Volgt exact het bestaande patroon van de
andere drie (data ophalen boven de `return`, doorgeven als props aan de sectie).
