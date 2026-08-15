import type { PeriodTotals } from '@/lib/types'
import type { WeeklyLeadsBucket } from '@/lib/aggregate'
import type { PeriodKey } from '@/lib/periods'
import { PeriodDropdown } from '@/components/sites/PeriodDropdown'
import { StatCard } from '@/components/site-detail/StatCard'
import { CombinedCallsCard } from '@/components/site-detail/CombinedCallsCard'
import { BarChartWeekly } from '@/components/charts/BarChartWeekly'
import { DonutSourceChart } from '@/components/charts/DonutSourceChart'
import { STAT_COLORS } from '@/lib/statColors'

export function LeadsSection({
  leadsPeriod,
  totals,
  weekly,
}: {
  leadsPeriod: PeriodKey
  totals: PeriodTotals
  weekly: WeeklyLeadsBucket[]
}) {
  return (
    <div>
      <div className="mb-4 flex justify-start">
        <PeriodDropdown paramKey="leadsPeriod" current={leadsPeriod} />
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <CombinedCallsCard
          websiteCallsCur={totals.phone_clicks_cur}
          websiteCallsPrev={totals.phone_clicks_prev}
          gmbCallsCur={totals.gmb_calls_cur}
          gmbCallsPrev={totals.gmb_calls_prev}
        />
        <StatCard
          label="WhatsApp-clicks"
          value={totals.whatsapp_clicks_cur}
          current={totals.whatsapp_clicks_cur}
          previous={totals.whatsapp_clicks_prev}
          accentColor={STAT_COLORS.whatsapp}
        />
        <StatCard
          label="Formulieren"
          value={totals.form_leads_cur}
          current={totals.form_leads_cur}
          previous={totals.form_leads_prev}
          accentColor={STAT_COLORS.form}
        />
        <StatCard
          label="Totaal leads"
          value={totals.total_leads_cur}
          current={totals.total_leads_cur}
          previous={totals.total_leads_prev}
          emphasize
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-surface p-4 lg:col-span-2">
          <div className="mb-2 text-sm font-medium text-secondary">Leads per week</div>
          <BarChartWeekly key={leadsPeriod} data={weekly} />
        </div>
        <div className="rounded-xl border border-border bg-surface p-4">
          <div className="mb-2 text-sm font-medium text-secondary">Verdeling per bron</div>
          <DonutSourceChart
            phoneClicks={totals.phone_clicks_cur}
            whatsappClicks={totals.whatsapp_clicks_cur}
            formLeads={totals.form_leads_cur}
            gmbCalls={totals.gmb_calls_cur}
          />
        </div>
      </div>
    </div>
  )
}
