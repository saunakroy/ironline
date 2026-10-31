export interface KpiCard {
  id: string
  label: string
  value: string
  sub: string
  trend?: 'up' | 'down' | 'flat'
  sparkline: number[]
}

export const kpiCards: KpiCard[] = [
  {
    id: 'revenue-per-mile',
    label: 'Revenue per mile',
    value: '$2.41',
    sub: '+$0.08 vs last week',
    trend: 'up',
    sparkline: [2.1, 2.18, 2.2, 2.3, 2.25, 2.35, 2.41],
  },
  {
    id: 'fuel-cost-per-mile',
    label: 'Fuel cost per mile',
    value: '$0.68',
    sub: '+$0.03 vs last week',
    trend: 'down',
    sparkline: [0.6, 0.61, 0.63, 0.62, 0.65, 0.66, 0.68],
  },
  {
    id: 'open-receivables',
    label: 'Open receivables',
    value: '$48,310',
    sub: '$9,440 over 30 days',
    trend: 'flat',
    sparkline: [41200, 43500, 45800, 44900, 46700, 47500, 48310],
  },
  {
    id: 'detention',
    label: 'Detention billed vs incurred',
    value: '$890 / $1,310',
    sub: '$420 left on the table',
    trend: 'down',
    sparkline: [1100, 1050, 1150, 1020, 1240, 1180, 1310],
  },
  {
    id: 'miles-by-state',
    label: 'Miles by state (IFTA preview)',
    value: 'TX 4,120 · OK 2,040 · MO 1,780',
    sub: 'KS 1,210 · AR 940 · +6 more',
    trend: 'flat',
    sparkline: [8200, 8650, 9100, 9400, 9800, 10050, 10090],
  },
]

export interface AgingBucket {
  label: string
  amount: number
  color: string
}

export const agingBuckets: AgingBucket[] = [
  { label: '0–30 days', amount: 29870, color: 'bg-emerald-400/70' },
  { label: '31–60 days', amount: 9440, color: 'bg-amber-300/70' },
  { label: '61–90 days', amount: 6200, color: 'bg-orange-400/70' },
  { label: '90+ days', amount: 2800, color: 'bg-rose-400/70' },
]
