-- Adds engaged_sessions to the site-wide GA4 metrics (needed to derive daily
-- bounce rate: 1 - engagedSessions/sessions), and removes the per-page GA4
-- table/RPC — the "populairste pagina's" table was dropped from the SEO tab,
-- so there's no more reason to sync or store per-page data.

alter table daily_ga4_site_metrics add column engaged_sessions int not null default 0;

drop function if exists get_top_pages(uuid, date, date, int);
drop table if exists daily_ga4_page_metrics;
