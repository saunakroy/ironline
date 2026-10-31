export interface KpiCard {
  id: string
  label: string
  value: string
  sub: string
  trend?: 'up' | 'down' | 'flat'
}

export const kpiCards: KpiCard[] = [
  {
    id: 'revenue-per-mile',
    label: 'Revenue per mile',
    value: '$2.41',
    sub: '+$0.08 vs last week',
    trend: 'up',
  },
  {
    id: 'fuel-cost-per-mile',
    label: 'Fuel cost per mile',
    value: '$0.68',
    sub: '+$0.03 vs last week',
    trend: 'down',
  },
  {
    id: 'open-receivables',
    label: 'Open receivables',
    value: '$48,310',
    sub: '$9,440 over 30 days',
    trend: 'flat',
  },
  {
    id: 'detention',
    label: 'Detention billed vs incurred',
    value: '$890 / $1,310',
    sub: '$420 left on the table',
    trend: 'down',
  },
  {
    id: 'miles-by-state',
    label: 'Miles by state (IFTA preview)',
    value: 'TX 4,120 · OK 2,040 · MO 1,780',
    sub: 'KS 1,210 · AR 940 · +6 more',
    trend: 'flat',
  },
]
