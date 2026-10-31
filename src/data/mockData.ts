import { BriefingItem, WatchItem, ProcessedFile, AgentMessage, FleetKPIs } from '../types';

export const BRIEFING_ITEMS: BriefingItem[] = [
  {
    id: 'P8',
    title: 'Duplicate fuel receipt uploaded across shifts',
    amount: 1250.43,
    amountFormatted: '$1,250.43',
    summary: 'Submitted twice across Monday and Thursday settlement batches.',
    agent: 'watchdog',
    truckId: 'Truck 104',
    driver: 'Marcus Vance',
    evidenceUrl: '/evidence/fuel_receipt_p8.svg',
    evidenceType: 'image',
    evidenceTitle: 'Pilot Travel Center #391 — Receipt Match',
    confidence: 99,
    fields: [
      { label: 'Store Location', value: 'Pilot Flying J #391, Hebron OH' },
      { label: 'Card Swiped', value: 'Comdata ****4412' },
      { label: 'Auth Code', value: 'AUTH-994821', isProblem: true },
      { label: 'Gallons / Price', value: '215.82 gal @ $5.794/gal' },
      { label: 'Duplicate Check', value: 'Exact match with upload Mon 10/26 08:30', isProblem: true }
    ],
    problemFields: ['Auth Code', 'Duplicate Check'],
    suggestedAction: 'Reject duplicate settlement entry to prevent double contractor deduction',
    notes: 'Transaction ID and pump timestamp are 100% identical. Duplicate would deduct $1,250 twice from carrier escrow.'
  },
  {
    id: 'P7',
    title: 'Fuel card used in Kansas City then Amarillo 3 hrs later',
    amount: 800.73,
    amountFormatted: '$800.73',
    summary: 'Card swiped in Amarillo at 14:15 while GPS placed truck in Kansas City.',
    agent: 'watchdog',
    truckId: 'Truck 102',
    driver: 'Ben Miller',
    evidenceUrl: '/evidence/fuel_card_p7.svg',
    evidenceType: 'telematics',
    evidenceTitle: 'Telematics vs Card Geo-Velocity Anomaly',
    confidence: 96,
    fields: [
      { label: 'Card Location', value: 'Love\'s #411, Amarillo TX (14:15 CST)', isProblem: true },
      { label: 'GPS Telematics', value: 'I-35 Milepost 18, Kansas City MO (14:15 CST)', isProblem: true },
      { label: 'Physical Distance', value: '580 miles between swipes', isProblem: true },
      { label: 'Required Velocity', value: '193.3 mph (Physically impossible)', isProblem: true },
      { label: 'Gallons / Pump', value: '138.2 gal @ Pump 4' }
    ],
    problemFields: ['Card Location', 'GPS Telematics', 'Physical Distance', 'Required Velocity'],
    suggestedAction: 'Freeze Comdata Card #4412 immediately and file automated fleet dispute',
    notes: 'Samsara telematics proves vehicle was traveling 62 mph near KC. Card data was cloned at unauthorized pump skimmer.'
  },
  {
    id: 'P3',
    title: 'Invoice used first quote ($1,380) instead of signed rate con ($1,680)',
    amount: 300.00,
    amountFormatted: '$300.00',
    summary: 'Draft used $1,380 quote instead of $1,680 executed contract.',
    agent: 'reconciler',
    loadId: 'LD-4088',
    truckId: 'Truck 101',
    driver: 'Dave Kowalski',
    evidenceUrl: '/evidence/rate_con_p3.svg',
    evidenceType: 'comparison',
    evidenceTitle: 'CH Robinson Signed Contract vs Draft Invoice',
    confidence: 98,
    fields: [
      { label: 'Draft Invoice #INV-1088', value: '$1,380.00 (Initial quote rate)', isProblem: true },
      { label: 'Signed Rate Con', value: '$1,680.00 ($300 driver assist included)' },
      { label: 'Broker / MC', value: 'CH Robinson (MC-109482)' },
      { label: 'Net Discrepancy', value: '-$300.00 underbilling', isProblem: true }
    ],
    problemFields: ['Draft Invoice #INV-1088', 'Net Discrepancy'],
    suggestedAction: 'Update invoice total to $1,680.00 before transmitting to factoring partner',
    notes: 'Broker signed the addendum. Submitting at $1,380 would cause carrier to forfeit $300 permanently once factored.'
  },
  {
    id: 'P6',
    title: '$175 lumper receipt not on any invoice',
    amount: 175.00,
    amountFormatted: '$175.00',
    summary: 'Out-of-pocket unload fee missing from broker billing.',
    agent: 'extractor',
    loadId: 'LD-4093',
    truckId: 'Truck 103',
    driver: 'Elena Rostova',
    evidenceUrl: '/evidence/lumper_p6.svg',
    evidenceType: 'image',
    evidenceTitle: 'Capstone Logistics Thermal Lumper Receipt',
    confidence: 94,
    fields: [
      { label: 'Vendor Facility', value: 'Capstone Logistics Cold Storage, Dallas TX' },
      { label: 'Lumper Fee Paid', value: '$175.00 (22 pallets unstack)', isProblem: true },
      { label: 'Invoice Status', value: 'Not found on Broker Invoice LD-4093', isProblem: true },
      { label: 'Contract Rule', value: 'Clause 8: Lumper 100% reimbursable with receipt' }
    ],
    problemFields: ['Lumper Fee Paid', 'Invoice Status'],
    suggestedAction: 'Append $175.00 pass-through line-item with receipt proof to broker invoice',
    notes: 'Broker agreement explicitly guarantees 100% reimbursement when receipt is attached.'
  },
  {
    id: 'P1',
    title: 'Unbilled detention (in 07:40, out 12:10, 2 hrs free at $65/hr)',
    amount: 162.50,
    amountFormatted: '$162.50',
    summary: '4.5 hrs on dock minus 2 free hrs = 2.5 billable hours ($162.50).',
    agent: 'reconciler',
    loadId: 'LD-4091',
    truckId: 'Truck 104',
    driver: 'Marcus Vance',
    evidenceUrl: '/evidence/bol_p1.svg',
    evidenceType: 'comparison',
    evidenceTitle: 'Signed Shipper BOL Stamp vs Rate Con Clause 4',
    confidence: 97,
    fields: [
      { label: 'BOL Arrival Stamp', value: '07:40 AM (Verified signature)', isProblem: true },
      { label: 'BOL Departure Stamp', value: '12:10 PM (Verified signature)', isProblem: true },
      { label: 'Total Elapsed Dwell', value: '4.5 Hours', isProblem: true },
      { label: 'Contract Terms', value: '2.0 hrs free, $65.00/hr thereafter' },
      { label: 'Unbilled Amount', value: '2.5 hrs × $65 = $162.50', isProblem: true }
    ],
    problemFields: ['BOL Arrival Stamp', 'BOL Departure Stamp', 'Total Elapsed Dwell', 'Unbilled Amount'],
    suggestedAction: 'Generate supplemental detention invoice for $162.50 with signed BOL stamp',
    notes: 'Both arrival and departure stamps are signed by receiver supervisor. Clean audit proof.'
  }
];

export const WATCH_ITEMS: WatchItem[] = [
  {
    id: 'W1',
    title: '4 delivered loads with signed POD not yet invoiced',
    amountFormatted: '$14,192.68 float',
    summary: 'Proof on file; unbatched factoring float.',
    badge: 'Cash Flow',
    category: 'cash'
  },
  {
    id: 'W2',
    title: 'Past-due invoice: Summit Lane Brokerage at 41 days',
    amountFormatted: '$4,850.00 overdue',
    summary: '11 days past Net 30 agreement.',
    badge: 'Aging Alert',
    category: 'billing'
  },
  {
    id: 'W3',
    title: 'Ben Miller DOT medical card expires in 12 days',
    summary: 'DOT physical expires Nov 12. Truck blocks on expiration.',
    badge: 'Compliance',
    category: 'compliance'
  }
];

export const DEMO_FILES_SAMPLE: ProcessedFile[] = [
  {
    id: 'FILE-1',
    name: 'Apex_RateConfirmation_LD4091.pdf',
    size: '284 KB',
    type: 'PDF',
    uploadedAt: 'Just now',
    stage: 'done',
    docType: 'Rate Con',
    confidence: 99,
    loadId: 'LD-4091',
    keyFields: {
      'Agreed Rate': '$2,450.00',
      'Broker': 'Apex Freight Logistics',
      'Detention Clause': '2 hrs free, $65/hr',
      'Lane': 'Columbus, OH → Atlanta, GA'
    }
  },
  {
    id: 'FILE-2',
    name: 'Signed_BOL_PhonePhoto_4091.jpg',
    size: '1.8 MB',
    type: 'JPG',
    uploadedAt: 'Just now',
    stage: 'done',
    docType: 'BOL Photo',
    confidence: 96,
    loadId: 'LD-4091',
    keyFields: {
      'Check-In': '07:40 AM',
      'Check-Out': '12:10 PM',
      'Total Dwell': '4.5 hrs',
      'Detention Flag': '2.5 hrs unbilled ($162.50)'
    }
  },
  {
    id: 'FILE-3',
    name: 'Pilot_Diesel_Receipt_1026.png',
    size: '920 KB',
    type: 'PNG',
    uploadedAt: 'Just now',
    stage: 'needs_review',
    docType: 'Fuel Receipt',
    confidence: 72,
    keyFields: {
      'Vendor': 'Pilot Flying J #391',
      'Total': '$1,250.43',
      'Watchdog Alert': 'Duplicate of Mon upload'
    }
  },
  {
    id: 'FILE-4',
    name: 'Driver_Elena_Text_Lumper.jpg',
    size: '640 KB',
    type: 'JPG',
    uploadedAt: 'Just now',
    stage: 'done',
    docType: 'Lumper Receipt',
    confidence: 94,
    loadId: 'LD-4093',
    keyFields: {
      'Facility': 'Capstone Dallas Cold',
      'Fee': '$175.00',
      'Billing': 'Missing from Invoice'
    }
  }
];

export const AGENT_RELAY_MESSAGES: AgentMessage[] = [
  {
    id: 'RELAY-1',
    timestamp: '12:31:02',
    from: 'extractor',
    to: 'reconciler',
    loadId: 'LD-4091',
    text: 'Extracted timestamps from driver BOL photo: In 07:40, Out 12:10. Total dwell: 4.5 hours.',
    priority: 'normal'
  },
  {
    id: 'RELAY-2',
    timestamp: '12:31:06',
    from: 'reconciler',
    to: 'watchdog',
    loadId: 'LD-4091',
    text: 'Cross-checked Apex Rate Con. 2 hrs free allowed at $65/hr. DETENTION FLAG: 2.5 hrs = $162.50 unbilled. Preparing supplemental claim directly for broker.',
    priority: 'alert'
  },
  {
    id: 'RELAY-3',
    timestamp: '12:32:15',
    from: 'watchdog',
    to: 'all',
    text: 'GEO-VELOCITY ALERT: Card #4412 charged in Amarillo, TX 3 hrs after Kansas City swipe (580 miles). Speed: 193 mph. Flagging $800.73.',
    priority: 'urgent'
  },
  {
    id: 'RELAY-4',
    timestamp: '12:33:04',
    from: 'reconciler',
    to: 'briefer',
    loadId: 'LD-4088',
    text: 'Rate mismatch: Invoice draft INV-1088 has $1,380 quote. Signed rate con is $1,680. Underbilled by $300.00. Dispatch agent updating broker invoice.',
    priority: 'alert'
  },
  {
    id: 'RELAY-5',
    timestamp: '12:33:48',
    from: 'extractor',
    to: 'reconciler',
    loadId: 'LD-4093',
    text: 'Driver SMS to Dispatch parsed: $175 lumper fee at Capstone Dallas. Reconciler: dispatch agent filing reimbursement addendum with broker.',
    priority: 'normal'
  },
  {
    id: 'RELAY-6',
    timestamp: '12:34:10',
    from: 'watchdog',
    to: 'briefer',
    text: 'DUPLICATE EXPENSE: Pilot Flying J receipt for $1,250.43 (Auth #994821) already ingested Monday. Blocking deduction.',
    priority: 'alert'
  },
  {
    id: 'RELAY-7',
    timestamp: '12:34:55',
    from: 'briefer',
    to: 'all',
    text: 'BRIEFING READY: 5 items compiled for owner review. Total money flagged: $2,688.66. Driver-Broker Air-Gap active: Carrier represents all claims.',
    priority: 'urgent'
  }
];

export const FLEET_KPIS: FleetKPIs = {
  revenuePerMile: 2.74,
  fuelCostPerMile: 0.88,
  openReceivablesTotal: 42890.00,
  overdueReceivablesCount: 3,
  unbilledDetentionLoss: 1420.00,
  monthlyIftaMiles: 28450
};
