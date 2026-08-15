-- Single-scan period totals + previous-equal-period totals, used for the
-- "%-t.o.v.-vorige-periode" trend badges throughout the dashboard.
create or replace function get_site_period_totals(
  p_site_id uuid, p_cur_start date, p_cur_end date, p_prev_start date, p_prev_end date
) returns table(
  phone_clicks_cur int, whatsapp_clicks_cur int, form_leads_cur int, total_leads_cur int,
  phone_clicks_prev int, whatsapp_clicks_prev int, form_leads_prev int, total_leads_prev int
) language sql stable as $$
  select
    coalesce(sum(phone_clicks) filter (where date between p_cur_start and p_cur_end), 0)::int,
    coalesce(sum(whatsapp_clicks) filter (where date between p_cur_start and p_cur_end), 0)::int,
    coalesce(sum(form_leads) filter (where date between p_cur_start and p_cur_end), 0)::int,
    coalesce(sum(total_leads) filter (where date between p_cur_start and p_cur_end), 0)::int,
    coalesce(sum(phone_clicks) filter (where date between p_prev_start and p_prev_end), 0)::int,
    coalesce(sum(whatsapp_clicks) filter (where date between p_prev_start and p_prev_end), 0)::int,
    coalesce(sum(form_leads) filter (where date between p_prev_start and p_prev_end), 0)::int,
    coalesce(sum(total_leads) filter (where date between p_prev_start and p_prev_end), 0)::int
  from daily_metrics
  where site_id = p_site_id and date between p_prev_start and p_cur_end;
$$;

grant execute on function get_site_period_totals(uuid, date, date, date, date) to authenticated;
