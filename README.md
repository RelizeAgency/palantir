# Palantir — Lead-machine dashboard

Privé webapp voor het volgen van leads (bel-clicks, WhatsApp-clicks, formulieren) per
rank-and-rent website, historisch opgeslagen zodat groei over tijd getoond kan worden
bij verhuur-/verkoopgesprekken. Zie `docs/` (plan) voor de volledige scope.

## Structuur

- `dashboard/` — Next.js app (inloggen, sites-overzicht, site-detail, vergelijken, instellingen). Gedeployed op Cloudflare via OpenNext.
- `worker/` — Cloudflare Worker die 's nachts data ophaalt bij de GA4 Data API en wegschrijft naar Supabase.
- `supabase/migrations/` — database-schema.

## Lokaal opzetten

1. **Supabase**: nieuw project → `supabase/migrations/*.sql` toepassen (SQL editor of Supabase CLI) → project-URL + anon key + service-role key noteren.
2. **Google Cloud**: project met "Google Analytics Data API" + "Google Analytics Admin API" ingeschakeld, OAuth-consentscherm (External, Testing) + OAuth 2.0 Web-client met redirect-URI `http://localhost:3000/api/google/oauth/callback`.
3. `cd dashboard && cp .env.example .env.local` en vul in.
4. `cd dashboard && npm run dev` → http://localhost:3000

## Cloudflare-deploy (later, als lokaal werkt)

- `dashboard`: `npm run cf:deploy` (na `wrangler login`).
- `worker`: `cd worker && npx wrangler secret put SUPABASE_URL` (en de overige secrets), dan `npm run deploy`.
