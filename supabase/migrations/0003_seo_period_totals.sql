-- SEO equivalent of get_site_period_totals, for the Search Console connector.
-- avg_position is impression-weighted (a straight average would overweight
-- low-traffic days), ctr is recomputed from the summed clicks/impressions
-- rather than averaging the daily ctr values, for the same reason.
create or replace function get_site_seo_period_totals(
  p_site_id uuid, p_cur_start date, p_cur_end date, p_prev_start date, p_prev_end date
) returns table(
  impressions_cur int, clicks_cur int, ctr_cur numeric, avg_position_cur numeric,
  impressions_prev int, clicks_prev int, ctr_prev numeric, avg_position_prev numeric
) language sql stable as $$
  select
    coalesce(sum(impressions) filter (where date between p_cur_start and p_cur_end), 0)::int,
    coalesce(sum(clicks) filter (where date between p_cur_start and p_cur_end), 0)::int,
    case when sum(impressions) filter (where date between p_cur_start and p_cur_end) > 0
      then round(100.0 * sum(clicks) filter (where date between p_cur_start and p_cur_end)
        / sum(impressions) filter (where date between p_cur_start and p_cur_end), 2)
      else 0 end,
    case when sum(impressions) filter (where date between p_cur_start and p_cur_end) > 0
      then round(sum(avg_position * impressions) filter (where date between p_cur_start and p_cur_end)
        / sum(impressions) filter (where date between p_cur_start and p_cur_end), 1)
      else 0 end,
    coalesce(sum(impressions) filter (where date between p_prev_start and p_prev_end), 0)::int,
    coalesce(sum(clicks) filter (where date between p_prev_start and p_prev_end), 0)::int,
    case when sum(impressions) filter (where date between p_prev_start and p_prev_end) > 0
      then round(100.0 * sum(clicks) filter (where date between p_prev_start and p_prev_end)
        / sum(impressions) filter (where date between p_prev_start and p_prev_end), 2)
      else 0 end,
    case when sum(impressions) filter (where date between p_prev_start and p_prev_end) > 0
      then round(sum(avg_position * impressions) filter (where date between p_prev_start and p_prev_end)
        / sum(impressions) filter (where date between p_prev_start and p_prev_end), 1)
      else 0 end
  from daily_seo_metrics
  where site_id = p_site_id and date between p_prev_start and p_cur_end;
$$;

grant execute on function get_site_seo_period_totals(uuid, date, date, date, date) to authenticated;
