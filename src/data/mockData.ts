import { BriefingItem, WatchItem, ProcessedFile, AgentMessage, FleetKPIs, DriverSession } from '../types';

export const BRIEFING_ITEMS: BriefingItem[] = [
  {
    id: 'P8',
    title: 'Duplicate fuel receipt submitted twice',
    amount: 1250.43,
    amountFormatted: '$1,250.43',
    summary: 'Same $1,250 gas receipt was submitted in Monday dispatch and re-uploaded Thursday.',
    agent: 'watchdog',
    truckId: 'Truck 104',
    driver: 'Marcus Vance',
    evidenceUrl: '/evidence/fuel_receipt_p8.svg',
    evidenceType: 'image',
    evidenceTitle: 'Pilot Travel Center #391 — Receipt Duplicate',
    confidence: 99,
    fields: [
      { label: 'Store Location', value: 'Pilot Flying J #391, Hebron OH' },
      { label: 'Card Swiped', value: 'Fleet Card ****4412' },
      { label: 'Receipt Auth ID', value: 'AUTH-994821', isProblem: true },
      { label: 'Gallons / Price', value: '215.82 gal @ $5.794/gal' },
      { label: 'Duplicate Check', value: '100% identical to upload on Mon 10/26', isProblem: true }
    ],
    problemFields: ['Receipt Auth ID', 'Duplicate Check'],
    suggestedAction: 'Remove duplicate expense before payroll deduction runs',
    notes: 'Receipt numbers match exactly. Approving this would charge the carrier twice for one fill-up.'
  },
  {
    id: 'P7',
    title: 'Stolen card: swiped in Texas while truck was in Missouri',
    amount: 800.73,
    amountFormatted: '$800.73',
    summary: 'Card charged in Amarillo at 2:15 PM, but truck GPS proves it was 580 miles away in Kansas City.',
    agent: 'watchdog',
    truckId: 'Truck 102',
    driver: 'Ben Miller',
    evidenceUrl: '/evidence/fuel_card_p7.svg',
    evidenceType: 'telematics',
    evidenceTitle: 'GPS Tracker vs Fuel Card Swipe Anomaly',
    confidence: 96,
    fields: [
      { label: 'Card Swipe Location', value: 'Love\'s #411, Amarillo TX (14:15 CST)', isProblem: true },
      { label: 'Truck GPS Location', value: 'I-35 Milepost 18, Kansas City MO (14:15 CST)', isProblem: true },
      { label: 'Distance Between Swipes', value: '580 miles in 3 hours', isProblem: true },
      { label: 'Required Speed', value: '193.3 mph (Physically impossible)', isProblem: true },
      { label: 'Diesel Pumped', value: '138.2 gal @ Pump 4' }
    ],
    problemFields: ['Card Swipe Location', 'Truck GPS Location', 'Distance Between Swipes', 'Required Speed'],
    suggestedAction: 'Freeze fuel card immediately and submit automatic fraud dispute',
    notes: 'GPS shows the truck driving 62 mph in Kansas City. The card was cloned at an unauthorized pump.'
  },
  {
    id: 'P3',
    title: 'Billed initial $1,380 quote instead of signed $1,680 contract',
    amount: 300.00,
    amountFormatted: '$300.00',
    summary: 'Customer agreed to $1,680 with driver assist, but draft invoice only billed the original $1,380 quote.',
    agent: 'reconciler',
    loadId: 'LD-4088',
    truckId: 'Truck 101',
    driver: 'Dave Kowalski',
    evidenceUrl: '/evidence/rate_con_p3.svg',
    evidenceType: 'comparison',
    evidenceTitle: 'Signed Broker Contract vs Draft Customer Invoice',
    confidence: 98,
    fields: [
      { label: 'Draft Customer Invoice', value: '$1,380.00 (Original quote rate)', isProblem: true },
      { label: 'Final Signed Contract', value: '$1,680.00 (Includes $300 driver assist)' },
      { label: 'Customer / Broker', value: 'CH Robinson Logistics' },
      { label: 'Underbilled Amount', value: '-$300.00 lost revenue', isProblem: true }
    ],
    problemFields: ['Draft Customer Invoice', 'Underbilled Amount'],
    suggestedAction: 'Update invoice total to $1,680.00 before sending to customer',
    notes: 'Customer signed the rate increase. Sending at $1,380 forfeits $300 permanently.'
  },
  {
    id: 'P6',
    title: 'Missing $175 warehouse unloading fee on customer bill',
    amount: 175.00,
    amountFormatted: '$175.00',
    summary: 'Driver paid $175 cash to unload pallets at warehouse, but fee was never added to customer invoice.',
    agent: 'extractor',
    loadId: 'LD-4093',
    truckId: 'Truck 103',
    driver: 'Elena Rostova',
    evidenceUrl: '/evidence/lumper_p6.svg',
    evidenceType: 'image',
    evidenceTitle: 'Cold Storage Warehouse Unloading Receipt',
    confidence: 94,
    fields: [
      { label: 'Warehouse Facility', value: 'Capstone Logistics Cold Storage, Dallas TX' },
      { label: 'Unloading Fee Paid', value: '$175.00 (22 pallets unstacked)', isProblem: true },
      { label: 'Customer Bill Status', value: 'Missing from invoice LD-4093', isProblem: true },
      { label: 'Contract Rule', value: 'Clause 8: Unload fees 100% reimbursable with receipt' }
    ],
    problemFields: ['Unloading Fee Paid', 'Customer Bill Status'],
    suggestedAction: 'Add $175 pass-through charge with receipt photo to customer invoice',
    notes: 'Contract guarantees 100% reimbursement when receipt is attached.'
  },
  {
    id: 'P1',
    title: 'Unbilled warehouse waiting time (4.5 hrs on dock, 2.5 billable)',
    amount: 162.50,
    amountFormatted: '$162.50',
    summary: 'Driver was stuck at warehouse dock for 4.5 hours. Contract allows 2 free hours, then $65/hr.',
    agent: 'reconciler',
    loadId: 'LD-4091',
    truckId: 'Truck 104',
    driver: 'Marcus Vance',
    evidenceUrl: '/evidence/bol_p1.svg',
    evidenceType: 'comparison',
    evidenceTitle: 'Signed Delivery Stamp vs Contract Free-Time Clause',
    confidence: 97,
    fields: [
      { label: 'Dock Check-In Stamp', value: '07:40 AM (Verified signature)', isProblem: true },
      { label: 'Dock Check-Out Stamp', value: '12:10 PM (Verified signature)', isProblem: true },
      { label: 'Total Dock Delay', value: '4.5 Hours on-site', isProblem: true },
      { label: 'Contract Rule', value: '2.0 hrs free, $65.00/hr thereafter' },
      { label: 'Unbilled Delay Charge', value: '2.5 hrs × $65 = $162.50', isProblem: true }
    ],
    problemFields: ['Dock Check-In Stamp', 'Dock Check-Out Stamp', 'Total Dock Delay', 'Unbilled Delay Charge'],
    suggestedAction: 'Bill customer $162.50 for warehouse delay with stamped proof',
    notes: 'Both arrival and departure stamps are signed by warehouse manager. Clean proof.'
  }
];

export const WATCH_ITEMS: WatchItem[] = [
  {
    id: 'W1',
    title: '4 completed deliveries not yet billed ($14,192.68 unpaid float)',
    amountFormatted: '$14,192.68 float',
    summary: 'Deliveries confirmed with signed receipts, but bills haven\'t been submitted.',
    badge: 'Unbilled Cash',
    category: 'cash'
  },
  {
    id: 'W2',
    title: 'Customer payment 11 days overdue: Summit Lane ($4,850.00)',
    amountFormatted: '$4,850.00 overdue',
    summary: 'Invoice is 41 days old on a Net 30 agreement without payment.',
    badge: 'Overdue Bill',
    category: 'billing'
  },
  {
    id: 'W3',
    title: 'Ben Miller mandatory driver health exam expires in 12 days',
    summary: 'Federal DOT medical card expires Nov 12. Truck cannot legally drive until renewed.',
    badge: 'Safety Alert',
    category: 'compliance'
  }
];

export const DEMO_FILES_SAMPLE: ProcessedFile[] = [
  {
    id: 'FILE-1',
    name: 'Apex_Rate_Contract_LD4091.pdf',
    size: '284 KB',
    type: 'PDF',
    uploadedAt: 'Just now',
    stage: 'done',
    docType: 'Rate Contract',
    confidence: 99,
    loadId: 'LD-4091',
    keyFields: {
      'Agreed Rate': '$2,450.00',
      'Customer / Broker': 'Apex Freight Logistics',
      'Dock Delay Terms': '2 hrs free, $65/hr after',
      'Lane Route': 'Columbus, OH → Atlanta, GA'
    }
  },
  {
    id: 'FILE-2',
    name: 'Signed_Delivery_Receipt_Photo.jpg',
    size: '1.8 MB',
    type: 'JPG',
    uploadedAt: 'Just now',
    stage: 'done',
    docType: 'Delivery Receipt',
    confidence: 96,
    loadId: 'LD-4091',
    keyFields: {
      'Warehouse Arrival': '07:40 AM',
      'Warehouse Departure': '12:10 PM',
      'Total Wait Time': '4.5 hrs on dock',
      'Billable Extra Time': '2.5 hrs unbilled ($162.50)'
    }
  },
  {
    id: 'FILE-3',
    name: 'Pilot_Diesel_Gas_Receipt.png',
    size: '920 KB',
    type: 'PNG',
    uploadedAt: 'Just now',
    stage: 'needs_review',
    docType: 'Fuel Receipt',
    confidence: 72,
    keyFields: {
      'Gas Station': 'Pilot Flying J #391',
      'Total Charged': '$1,250.43',
      'Fraud Warning': 'Duplicate: identical upload on Monday'
    }
  },
  {
    id: 'FILE-4',
    name: 'Driver_Text_Warehouse_Unload_Fee.jpg',
    size: '640 KB',
    type: 'JPG',
    uploadedAt: 'Just now',
    stage: 'done',
    docType: 'Unload Slip',
    confidence: 94,
    loadId: 'LD-4093',
    keyFields: {
      'Warehouse': 'Capstone Cold Storage, Dallas',
      'Unload Fee Paid': '$175.00 cash',
      'Billing Status': 'Missing from customer invoice'
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
    text: 'Extracted dock timestamps from delivery photo: In 07:40, Out 12:10 (4.5 hours on-site).',
    priority: 'normal'
  },
  {
    id: 'RELAY-2',
    timestamp: '12:31:06',
    from: 'reconciler',
    to: 'watchdog',
    loadId: 'LD-4091',
    text: 'Matched customer contract: 2 hours free allowed, $65/hr after. FLAG: 2.5 extra hours = $162.50 owed by customer.',
    priority: 'alert'
  },
  {
    id: 'RELAY-3',
    timestamp: '12:32:15',
    from: 'watchdog',
    to: 'all',
    text: 'FRAUD ALERT: Card swiped in Texas just 3 hrs after Missouri swipe (580 miles apart, 193 mph). Flagging $800.73.',
    priority: 'urgent'
  },
  {
    id: 'RELAY-4',
    timestamp: '12:33:04',
    from: 'reconciler',
    to: 'briefer',
    loadId: 'LD-4088',
    text: 'Underbilled contract: Draft invoice used $1,380 quote, but signed contract is $1,680. Recovering $300.00.',
    priority: 'alert'
  },
  {
    id: 'RELAY-5',
    timestamp: '12:33:48',
    from: 'extractor',
    to: 'reconciler',
    loadId: 'LD-4093',
    text: 'Driver text photo parsed: $175 cash unloading fee at warehouse. Adding reimbursable charge to customer bill.',
    priority: 'normal'
  },
  {
    id: 'RELAY-6',
    timestamp: '12:34:10',
    from: 'watchdog',
    to: 'briefer',
    text: 'DUPLICATE EXPENSE: Gas receipt for $1,250.43 was already submitted Monday. Blocking double deduction.',
    priority: 'alert'
  },
  {
    id: 'RELAY-7',
    timestamp: '12:34:55',
    from: 'briefer',
    to: 'all',
    text: 'NIGHTLY AUDIT READY: 5 items found. Total money saved / recovered: $2,689.',
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

export const DEMO_DRIVERS: DriverSession[] = [
  {
    id: 'DRV-101',
    name: 'Dave Kowalski',
    truckId: 'Truck 101',
    currentLoadId: 'LD-4088',
    route: 'Chicago, IL → Dallas, TX',
    cardLast4: '4412'
  },
  {
    id: 'DRV-104',
    name: 'Marcus Vance',
    truckId: 'Truck 104',
    currentLoadId: 'LD-4091',
    route: 'Columbus, OH → Atlanta, GA',
    cardLast4: '9921'
  },
  {
    id: 'DRV-103',
    name: 'Elena Rostova',
    truckId: 'Truck 103',
    currentLoadId: 'LD-4093',
    route: 'Indianapolis, IN → Dallas, TX',
    cardLast4: '5510'
  }
];
