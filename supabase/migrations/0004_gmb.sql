-- Google Business Profile connector.
-- GMB call_clicks is treated as a lead source on par with phone/WhatsApp/form
-- (the user explicitly grouped "bellen via Google My Business" with the other
-- lead channels from the start), so it lives in daily_metrics and folds into
-- total_leads. Profile views / website clicks / direction requests are
-- visibility signals (closer in spirit to Search Console impressions/clicks
-- than to a lead), so those get their own daily_gmb_metrics table.

-- Statements below are written to be safely re-runnable (e.g. if a previous
-- attempt at this migration partially applied before erroring).
alter table daily_metrics add column if not exists gmb_calls int not null default 0;

-- total_leads is a generated column; Postgres doesn't support altering a
-- generated expression in place, so drop and recreate it with gmb_calls included.
alter table daily_metrics drop column if exists total_leads;
alter table daily_metrics add column total_leads int
  generated always as (phone_clicks + whatsapp_clicks + form_leads + gmb_calls) stored;

create table if not exists daily_gmb_metrics (
  site_id uuid not null references sites(id) on delete cascade,
  date date not null,
  profile_views int not null default 0,      -- sum of BUSINESS_IMPRESSIONS_* (maps/search, desktop/mobile)
  website_clicks int not null default 0,
  direction_requests int not null default 0,
  synced_at timestamptz not null default now(),
  primary key (site_id, date)
);

alter table daily_gmb_metrics enable row level security;
drop policy if exists "authenticated read daily_gmb_metrics" on daily_gmb_metrics;
create policy "authenticated read daily_gmb_metrics" on daily_gmb_metrics for select using (auth.role() = 'authenticated');

-- Postgres won't let CREATE OR REPLACE change a function's return row type
-- (we're adding gmb_calls_cur/prev columns), so drop it first.
drop function if exists get_site_period_totals(uuid, date, date, date, date);

create or replace function get_site_period_totals(
  p_site_id uuid, p_cur_start date, p_cur_end date, p_prev_start date, p_prev_end date
) returns table(
  phone_clicks_cur int, whatsapp_clicks_cur int, form_leads_cur int, gmb_calls_cur int, total_leads_cur int,
  phone_clicks_prev int, whatsapp_clicks_prev int, form_leads_prev int, gmb_calls_prev int, total_leads_prev int
) language sql stable as $$
  select
    coalesce(sum(phone_clicks) filter (where date between p_cur_start and p_cur_end), 0)::int,
    coalesce(sum(whatsapp_clicks) filter (where date between p_cur_start and p_cur_end), 0)::int,
    coalesce(sum(form_leads) filter (where date between p_cur_start and p_cur_end), 0)::int,
    coalesce(sum(gmb_calls) filter (where date between p_cur_start and p_cur_end), 0)::int,
    coalesce(sum(total_leads) filter (where date between p_cur_start and p_cur_end), 0)::int,
    coalesce(sum(phone_clicks) filter (where date between p_prev_start and p_prev_end), 0)::int,
    coalesce(sum(whatsapp_clicks) filter (where date between p_prev_start and p_prev_end), 0)::int,
    coalesce(sum(form_leads) filter (where date between p_prev_start and p_prev_end), 0)::int,
    coalesce(sum(gmb_calls) filter (where date between p_prev_start and p_prev_end), 0)::int,
    coalesce(sum(total_leads) filter (where date between p_prev_start and p_prev_end), 0)::int
  from daily_metrics
  where site_id = p_site_id and date between p_prev_start and p_cur_end;
$$;

create or replace function get_site_gmb_period_totals(
  p_site_id uuid, p_cur_start date, p_cur_end date, p_prev_start date, p_prev_end date
) returns table(
  profile_views_cur int, website_clicks_cur int, direction_requests_cur int,
  profile_views_prev int, website_clicks_prev int, direction_requests_prev int
) language sql stable as $$
  select
    coalesce(sum(profile_views) filter (where date between p_cur_start and p_cur_end), 0)::int,
    coalesce(sum(website_clicks) filter (where date between p_cur_start and p_cur_end), 0)::int,
    coalesce(sum(direction_requests) filter (where date between p_cur_start and p_cur_end), 0)::int,
    coalesce(sum(profile_views) filter (where date between p_prev_start and p_prev_end), 0)::int,
    coalesce(sum(website_clicks) filter (where date between p_prev_start and p_prev_end), 0)::int,
    coalesce(sum(direction_requests) filter (where date between p_prev_start and p_prev_end), 0)::int
  from daily_gmb_metrics
  where site_id = p_site_id and date between p_prev_start and p_cur_end;
$$;

grant execute on function get_site_period_totals(uuid, date, date, date, date) to authenticated;
grant execute on function get_site_gmb_period_totals(uuid, date, date, date, date) to authenticated;
