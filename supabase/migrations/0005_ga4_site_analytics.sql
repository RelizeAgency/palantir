-- Adds full-site Google Analytics data to the SEO tab, alongside Search
-- Console. Site-wide daily totals (visitors, engagement) and per-page daily
-- metrics are stored separately from bounceRate/avg-engagement directly,
-- since those are ratios that can't be validly summed/averaged across days —
-- we store the raw countable components (sessions, engagedSessions,
-- engagement duration) and recompute the ratio from the summed totals,
-- same approach as ctr/avg_position in daily_seo_metrics.

alter table sync_log drop constraint if exists sync_log_source_check;
alter table sync_log add constraint sync_log_source_check check (source in ('ga4','gsc','gmb','ga4_site'));

create table daily_ga4_site_metrics (
  site_id uuid not null references sites(id) on delete cascade,
  date date not null,
  total_users int not null default 0,
  sessions int not null default 0,
  engagement_seconds numeric not null default 0, -- userEngagementDuration, summed
  synced_at timestamptz not null default now(),
  primary key (site_id, date)
);

create table daily_ga4_page_metrics (
  site_id uuid not null references sites(id) on delete cascade,
  date date not null,
  page_path text not null,
  views int not null default 0,
  active_users int not null default 0,
  event_count int not null default 0,
  sessions int not null default 0,
  engaged_sessions int not null default 0,
  synced_at timestamptz not null default now(),
  primary key (site_id, date, page_path)
);

alter table daily_ga4_site_metrics enable row level security;
alter table daily_ga4_page_metrics enable row level security;
create policy "authenticated read daily_ga4_site_metrics" on daily_ga4_site_metrics for select using (auth.role() = 'authenticated');
create policy "authenticated read daily_ga4_page_metrics" on daily_ga4_page_metrics for select using (auth.role() = 'authenticated');

create or replace function get_site_ga4_totals(
  p_site_id uuid, p_cur_start date, p_cur_end date, p_prev_start date, p_prev_end date
) returns table(
  total_users_cur int, avg_engagement_seconds_cur numeric,
  total_users_prev int, avg_engagement_seconds_prev numeric
) language sql stable as $$
  select
    coalesce(sum(total_users) filter (where date between p_cur_start and p_cur_end), 0)::int,
    case when sum(sessions) filter (where date between p_cur_start and p_cur_end) > 0
      then round(sum(engagement_seconds) filter (where date between p_cur_start and p_cur_end)
        / sum(sessions) filter (where date between p_cur_start and p_cur_end), 1)
      else 0 end,
    coalesce(sum(total_users) filter (where date between p_prev_start and p_prev_end), 0)::int,
    case when sum(sessions) filter (where date between p_prev_start and p_prev_end) > 0
      then round(sum(engagement_seconds) filter (where date between p_prev_start and p_prev_end)
        / sum(sessions) filter (where date between p_prev_start and p_prev_end), 1)
      else 0 end
  from daily_ga4_site_metrics
  where site_id = p_site_id and date between p_prev_start and p_cur_end;
$$;

grant execute on function get_site_ga4_totals(uuid, date, date, date, date) to authenticated;

create or replace function get_top_pages(
  p_site_id uuid, p_start date, p_end date, p_limit int default 7
) returns table(
  page_path text, views bigint, active_users bigint, event_count bigint, bounce_rate numeric
) language sql stable as $$
  select
    page_path,
    sum(views)::bigint,
    sum(active_users)::bigint,
    sum(event_count)::bigint,
    case when sum(sessions) > 0
      then round(100.0 * (1 - (sum(engaged_sessions)::numeric / sum(sessions))), 1)
      else 0 end
  from daily_ga4_page_metrics
  where site_id = p_site_id and date between p_start and p_end
  group by page_path
  order by sum(views) desc
  limit p_limit;
$$;

grant execute on function get_top_pages(uuid, date, date, int) to authenticated;
