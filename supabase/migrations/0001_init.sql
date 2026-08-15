-- Palantir MVP schema: sites, daily lead metrics, sync log, Google OAuth token store.
-- form_leads counts GA4 'generate_lead' events (fired after a CONFIRMED Web3Forms
-- submission, see AnalyticsProvider.tsx in the lead-machine site repos), not
-- 'form_submit' (fires on submit attempt, before confirmation).

create extension if not exists pgcrypto;

create table sites (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  domain text not null,
  ga4_property_id text not null,
  ga4_property_display_name text,
  gsc_site_url text,              -- nullable, reserved for the future GSC connector
  gmb_location_id text,           -- nullable, reserved for the future GMB connector
  status text not null default 'active' check (status in ('active','paused')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table daily_metrics (
  site_id uuid not null references sites(id) on delete cascade,
  date date not null,
  phone_clicks int not null default 0,
  whatsapp_clicks int not null default 0,
  form_leads int not null default 0,
  total_leads int generated always as (phone_clicks + whatsapp_clicks + form_leads) stored,
  synced_at timestamptz not null default now(),
  primary key (site_id, date)
);

-- Reserved now so the future Search Console connector needs zero schema changes.
create table daily_seo_metrics (
  site_id uuid not null references sites(id) on delete cascade,
  date date not null,
  impressions int not null default 0,
  clicks int not null default 0,
  ctr numeric(6,4),
  avg_position numeric(6,2),
  synced_at timestamptz not null default now(),
  primary key (site_id, date)
);

create table sync_log (
  id uuid primary key default gen_random_uuid(),
  site_id uuid references sites(id) on delete cascade,  -- null = global failure (e.g. missing token)
  source text not null default 'ga4' check (source in ('ga4','gsc','gmb')),
  run_started_at timestamptz not null,
  run_finished_at timestamptz,
  status text not null check (status in ('running','success','error')),
  rows_upserted int,
  error_message text,
  created_at timestamptz not null default now()
);

-- Service-role-only. No RLS policies granted to anon/authenticated at all,
-- and service_role bypasses RLS regardless -- this is the single-user's
-- Google refresh token and must never reach the browser.
create table google_oauth_tokens (
  id uuid primary key default gen_random_uuid(),
  google_account_email text,
  refresh_token text not null,
  scope text,
  updated_at timestamptz not null default now()
);

alter table sites enable row level security;
alter table daily_metrics enable row level security;
alter table daily_seo_metrics enable row level security;
alter table sync_log enable row level security;
alter table google_oauth_tokens enable row level security;

-- Reads: any logged-in user (there's exactly one) can read everything.
create policy "authenticated read sites" on sites for select using (auth.role() = 'authenticated');
create policy "authenticated read daily_metrics" on daily_metrics for select using (auth.role() = 'authenticated');
create policy "authenticated read daily_seo_metrics" on daily_seo_metrics for select using (auth.role() = 'authenticated');
create policy "authenticated read sync_log" on sync_log for select using (auth.role() = 'authenticated');

-- Writes to sites/daily_metrics/sync_log happen ONLY via the Next.js app's
-- server actions/route handlers and the Worker, using the service-role key
-- (single trust boundary) -- deliberately no insert/update/delete policies
-- for anon/authenticated.
