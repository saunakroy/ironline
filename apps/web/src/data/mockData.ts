import { PlantedProblem, ExtractedDocument, LoadItem, AgentRelayMessage, FleetKPIs, DriverProfile } from '../types';

export const DRIVERS: DriverProfile[] = [
  {
    id: 'DRV-104',
    name: 'Marcus Vance',
    truckId: 'Truck 104',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
    status: 'Loading / Dock',
    currentLoadId: 'LD-4091',
    todayMiles: 342,
    phone: '(614) 555-0192',
    fuelCardNumber: 'Card #9948',
    recentUploadsCount: 3,
    detentionTimer: {
      location: 'Great Lakes Cold Storage, Columbus OH',
      arrivedAt: '07:40 AM',
      elapsedHours: 4.5,
      isBillable: true
    }
  },
  {
    id: 'DRV-101',
    name: 'Dave Kowalski',
    truckId: 'Truck 101',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80',
    status: 'Driving',
    currentLoadId: 'LD-4088',
    todayMiles: 489,
    phone: '(614) 555-0144',
    fuelCardNumber: 'Card #1019',
    recentUploadsCount: 2
  },
  {
    id: 'DRV-103',
    name: 'Elena Rostova',
    truckId: 'Truck 103',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=256&q=80',
    status: 'Driving',
    currentLoadId: 'LD-4093',
    todayMiles: 295,
    phone: '(614) 555-0188',
    fuelCardNumber: 'Card #3011',
    recentUploadsCount: 4
  },
  {
    id: 'DRV-102',
    name: 'Ben Miller',
    truckId: 'Truck 102',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&q=80',
    status: 'Resting',
    currentLoadId: 'LD-4085',
    todayMiles: 512,
    phone: '(614) 555-0177',
    fuelCardNumber: 'Card #4412',
    recentUploadsCount: 1
  }
];

export const PLANTED_PROBLEMS: PlantedProblem[] = [
  {
    id: 'P1',
    title: 'Unbilled Detention: 2.5 Billable Hours Missed',
    category: 'detention',
    impactAmount: 162.50,
    impactFormatted: '+$162.50 Recoverable',
    isTonightBriefing: true,
    severity: 'critical',
    loadId: 'LD-4091',
    truckId: 'Truck 104',
    driver: 'Marcus Vance',
    description: 'Shipper BOL stamped 07:40 IN, 12:10 OUT (4.5 hrs on-site). Signed Rate Con gives 2 free hours, then $65/hr.',
    agentResponsible: 'reconciler',
    suggestedAction: 'Append $162.50 detention to Broker Invoice #INV-4091 with signed BOL timestamp',
    evidence: {
      type: 'comparison',
      docA: {
        title: 'Signed Shipper BOL Stamp',
        source: 'IMG_20261028_1214.jpg',
        extractedTime: 'Check-In: 07:40 | Check-Out: 12:10',
        highlightText: 'IN: 07:40 / OUT: 12:10 (Total 4.5 hrs)',
        badge: 'BOL Photo OCR'
      },
      docB: {
        title: 'Broker Rate Con #RC-9921',
        source: 'RateConfirmation_Apex.pdf',
        highlightText: 'Detention: $65/hr after 2 hrs free with signed in/out stamps',
        badge: 'Rate Con Terms'
      },
      notes: 'Shipper signature confirms 4.5 hours elapsed. Net billable detention: 2.5 hrs × $65/hr = $162.50.'
    }
  },
  {
    id: 'P3',
    title: 'Invoice Draft Uses Quote ($1,380) Instead of Signed Rate Con ($1,680)',
    category: 'billing',
    impactAmount: 300.00,
    impactFormatted: '+$300.00 Underbilled',
    isTonightBriefing: true,
    severity: 'critical',
    loadId: 'LD-4088',
    truckId: 'Truck 101',
    driver: 'Dave Kowalski',
    description: 'Owner invoice draft was generated from initial quote ($1,380), but final signed rate confirmation was negotiated up to $1,680.',
    agentResponsible: 'reconciler',
    suggestedAction: 'Update invoice line total to $1,680.00 before factoring transmission',
    evidence: {
      type: 'comparison',
      docA: {
        title: 'Draft Invoice #INV-1088',
        source: 'Drafts/INV-1088.docx',
        highlightText: 'Line 1: Linehaul Chicago to Atlanta — $1,380.00',
        badge: 'Draft Invoice'
      },
      docB: {
        title: 'Final Signed Rate Confirmation',
        source: 'CH_Robinson_Signed_RateCon.pdf',
        highlightText: 'Agreed Rate: $1,680.00 USD (Includes $300 driver assist bump)',
        badge: 'Signed Rate Con'
      },
      notes: 'Broker agreed to signed rate revision. Underbilling would result in a permanent $300 loss.'
    }
  },
  {
    id: 'P6',
    title: 'Unreimbursed $175 Lumper Receipt Found on Driver Phone',
    category: 'lumper',
    impactAmount: 175.00,
    impactFormatted: '+$175.00 Unreimbursed',
    isTonightBriefing: true,
    severity: 'critical',
    loadId: 'LD-4093',
    truckId: 'Truck 103',
    driver: 'Elena Rostova',
    description: 'Driver paid $175 out-of-pocket lumper fee at cold storage in Dallas. Text receipt was never attached to broker invoice.',
    agentResponsible: 'extractor',
    suggestedAction: 'Add $175.00 accessorial pass-through to broker invoice with Capstone receipt proof',
    evidence: {
      type: 'document',
      docA: {
        title: 'Capstone Logistics Lumper Receipt',
        source: 'IMG_Lumper_Dallas.jpg',
        highlightText: 'Amount: $175.00 | Paid: Cash/FleetCard | PO: Capstone-982',
        badge: 'Thermal Receipt Photo'
      },
      notes: 'Rate confirmation explicitly specifies "Lumper reimbursed at 100% with original receipt".'
    }
  },
  {
    id: 'P7',
    title: 'Impossible Fuel Card Geo-Velocity (Amarillo vs. Kansas City)',
    category: 'fuel',
    impactAmount: 800.73,
    impactFormatted: '$800.73 Fraud Alert',
    isTonightBriefing: true,
    severity: 'critical',
    truckId: 'Truck 102',
    driver: 'Ben Miller',
    description: 'Truck 102 fuel card was swiped in Amarillo, TX at 14:15, only 3 hours after swiping in Kansas City, MO (580 miles apart). Telematics confirms Truck 102 was in Kansas City.',
    agentResponsible: 'watchdog',
    suggestedAction: 'Freeze Comdata Card #4412 immediately and submit card cloning fraud dispute',
    evidence: {
      type: 'telematics',
      docA: {
        title: 'Comdata Fuel Card Transaction #88391',
        source: 'Comdata Daily Feed',
        extractedTime: '14:15 CST — Love\'s Travel Stop #411, Amarillo TX',
        highlightText: 'Gallons: 138.2 gal | Total: $800.73 | Pump #4',
        badge: 'Fuel Card Record'
      },
      docB: {
        title: 'Samsara Truck 102 GPS Telematics',
        source: 'Samsara API',
        extractedTime: '14:15 CST — I-35 Milepost 18, Kansas City MO',
        highlightText: 'Vehicle Location: Kansas City, MO (Speed: 62 mph)',
        badge: 'GPS Telematics'
      },
      notes: 'Physical distance: 580 miles in 3 hours requires 193 mph. Cloned card suspected.'
    }
  },
  {
    id: 'P8',
    title: 'Duplicate Fuel Receipt Uploaded Across Shifts',
    category: 'fuel',
    impactAmount: 1250.43,
    impactFormatted: '$1,250.43 Duplicate',
    isTonightBriefing: true,
    severity: 'critical',
    truckId: 'Truck 104',
    driver: 'Marcus Vance',
    description: 'Same Pilot Flying J receipt for $1,250.43 was uploaded Monday morning and re-submitted in Thursday settlement batch.',
    agentResponsible: 'watchdog',
    suggestedAction: 'Reject duplicate entry from weekly settlement reconciliation to avoid double accounting deduction',
    evidence: {
      type: 'comparison',
      docA: {
        title: 'Original Receipt (Mon 10/26 08:30)',
        source: 'receipt_1026_01.jpg',
        highlightText: 'Pilot #391 | Auth #994821 | Total: $1,250.43',
        badge: 'Receipt #1'
      },
      docB: {
        title: 'Duplicate Submission (Thu 10/29 17:10)',
        source: 'batch_upload_scan.pdf',
        highlightText: 'Pilot #391 | Auth #994821 | Total: $1,250.43',
        badge: 'Receipt #2 (Exact Match)'
      },
      notes: 'Exact match on Transaction ID, Auth Code, Timestamp and Gallonage.'
    }
  },
  {
    id: 'P4',
    title: 'Delivered Load Missing POD — $2,279.65 Blocked',
    category: 'pod',
    impactAmount: 2279.65,
    impactFormatted: '$2,279.65 Blocked',
    isTonightBriefing: false,
    severity: 'warning',
    loadId: 'LD-4085',
    truckId: 'Truck 103',
    driver: 'Elena Rostova',
    description: 'Load marked delivered 48 hrs ago, but no signed POD image uploaded. Broker Net 30 clock cannot start without it.',
    agentResponsible: 'briefer',
    suggestedAction: 'Send automated SMS prompt to driver Elena Rostova to snap POD photo',
    evidence: {
      type: 'document',
      notes: 'Broker requires signed proof of delivery before factoring submission.'
    }
  },
  {
    id: 'P2',
    title: 'Legal Entity Name Mismatch on Broker Invoice',
    category: 'billing',
    impactFormatted: 'Payment Risk',
    isTonightBriefing: false,
    severity: 'warning',
    loadId: 'LD-4090',
    description: 'Invoice drafted to "Ridgeline Freight" instead of legal entity name "Ridgeline Freight Logistics LLC".',
    agentResponsible: 'reconciler',
    suggestedAction: 'Update broker billing entity name in EDI profile',
    evidence: {
      type: 'document',
      notes: 'Broker auto-rejects invoices when remit entity does not match MC lookup exactly.'
    }
  },
  {
    id: 'P5',
    title: 'POD Annotated "SHORT 1 PLT" With Intact Seal Notice',
    category: 'claim',
    impactFormatted: '$3,500 Claim Risk',
    isTonightBriefing: false,
    severity: 'warning',
    loadId: 'LD-4087',
    driver: 'Dave Kowalski',
    description: 'Receiver scribbled "SHORT 1 PLT", but BOL photos prove shipper seal #98421 was intact upon arrival.',
    agentResponsible: 'watchdog',
    suggestedAction: 'Issue pre-emptive seal integrity notice to broker to protect carrier',
    evidence: {
      type: 'document',
      notes: 'Shipper load and count clause applies; seal match relieves carrier liability.'
    }
  },
  {
    id: 'P10',
    title: 'Aged Receivable Alert: Summit Lane Invoice at 41 Days',
    category: 'receivables',
    impactAmount: 4850.00,
    impactFormatted: '$4,850.00 Overdue',
    isTonightBriefing: false,
    severity: 'critical',
    loadId: 'LD-3990',
    description: 'Invoice #INV-3990 for $4,850.00 to Summit Lane Brokerage has reached 41 days on Net 30 terms.',
    agentResponsible: 'briefer',
    suggestedAction: 'Send automated past-due notice to ap@summitlane.com',
    evidence: {
      type: 'document',
      notes: 'Credit limit warning: Hold further loads until past-due balance cleared.'
    }
  },
  {
    id: 'P11',
    title: 'Driver DOT Medical Certificate Expires in 12 Days',
    category: 'compliance',
    impactFormatted: 'Compliance Risk',
    isTonightBriefing: false,
    severity: 'warning',
    driver: 'Ben Miller',
    description: 'Ben Miller\'s FMCSA medical examiner certificate will expire on Nov 12, 2026.',
    agentResponsible: 'watchdog',
    suggestedAction: 'Alert safety coordinator and remind driver to upload new medical card',
    evidence: {
      type: 'document',
      notes: 'FMCSA compliance alert.'
    }
  },
  {
    id: 'P9',
    title: 'DVIR Defects Not Certified Repaired Before Re-Dispatch',
    category: 'compliance',
    impactFormatted: 'Audit Warning',
    isTonightBriefing: false,
    severity: 'warning',
    truckId: 'Truck 101',
    description: 'Driver inspection logged brake slack adjuster warning on Oct 27, but maintenance signoff is missing.',
    agentResponsible: 'watchdog',
    suggestedAction: 'Flag Truck 101 maintenance file for shop mechanic signature',
    evidence: {
      type: 'document',
      notes: '49 CFR 396.11 requires mechanic certification prior to dispatch.'
    }
  },
  {
    id: 'P12',
    title: '4 Delivered Loads Awaiting Invoicing ($14,192.68 Cash Float)',
    category: 'billing',
    impactAmount: 14192.68,
    impactFormatted: '$14,192.68 Float',
    isTonightBriefing: false,
    severity: 'info',
    description: '4 loads are marked completed with verified signed PODs but invoices have not been queued.',
    agentResponsible: 'briefer',
    suggestedAction: 'One-click batch invoices to factoring partner',
    evidence: {
      type: 'document',
      notes: 'Faster billing cuts DSO from 33 days to 24 hours.'
    }
  }
];

export const MOCK_EXTRACTED_DOCS: ExtractedDocument[] = [
  {
    id: 'DOC-891',
    filename: 'BOL_Photo_Load4091.jpg',
    fileType: 'jpg',
    docClassification: 'BOL',
    confidenceScore: 96,
    needsReview: false,
    uploadedAt: '10m ago',
    loadRef: 'LD-4091',
    driverName: 'Marcus Vance',
    extractedFields: {
      'BOL Number': 'BOL-8849102',
      'Shipper': 'Great Lakes Cold Storage',
      'Check-In': '07:40 AM',
      'Check-Out': '12:10 PM',
      'Seal': '#44910 (Intact)',
      'Total Time': '4.5 Hours'
    }
  },
  {
    id: 'DOC-890',
    filename: 'Apex_RateConfirmation_4091.pdf',
    fileType: 'pdf',
    docClassification: 'Rate Con',
    confidenceScore: 99,
    needsReview: false,
    uploadedAt: '25m ago',
    loadRef: 'LD-4091',
    extractedFields: {
      'Rate Con #': 'RC-9921',
      'Broker': 'Apex Freight Logistics LLC',
      'Agreed Rate': '$2,450.00',
      'Detention': '$65/hr after 2 hrs free'
    }
  },
  {
    id: 'DOC-889',
    filename: 'Lumper_Dallas_Cold_Receipt.jpg',
    fileType: 'jpg',
    docClassification: 'Lumper',
    confidenceScore: 92,
    needsReview: false,
    uploadedAt: '1h ago',
    loadRef: 'LD-4093',
    driverName: 'Elena Rostova',
    extractedFields: {
      'Vendor': 'Capstone Logistics',
      'Amount': '$175.00',
      'Payment': 'Driver Fleet Card'
    }
  },
  {
    id: 'DOC-888',
    filename: 'Comdata_Fuel_Amarillo_Pump4.png',
    fileType: 'png',
    docClassification: 'Fuel Receipt',
    confidenceScore: 94,
    needsReview: false,
    uploadedAt: '2h ago',
    driverName: 'Ben Miller',
    extractedFields: {
      'Card': 'Card #4412 (Truck 102)',
      'Location': 'Loves #411, Amarillo TX',
      'Gallons': '138.2 gal @ $5.79/gal',
      'Total': '$800.73',
      'Status': 'Flagged: Velocity Anomaly'
    }
  },
  {
    id: 'DOC-887',
    filename: 'Handwritten_POD_Stamford.jpg',
    fileType: 'jpg',
    docClassification: 'POD',
    confidenceScore: 68,
    needsReview: true,
    uploadedAt: '3h ago',
    loadRef: 'LD-4087',
    driverName: 'Dave Kowalski',
    extractedFields: {
      'Delivered': '16:45 EST',
      'Receiver Note': 'SHORT 1 PLT (Seal Verified)',
      'Condition': 'Needs Human Review'
    }
  }
];

export const MOCK_LOADS: LoadItem[] = [
  {
    id: 'LD-4091',
    broker: 'Apex Freight Logistics',
    origin: 'Columbus, OH',
    destination: 'Atlanta, GA',
    truck: 'Truck 104',
    driver: 'Marcus Vance',
    status: 'Delivered',
    agreedRate: 2450.00,
    invoicedRate: 2612.50,
    documentsCount: 4,
    hasDiscrepancy: true,
    durableActorState: {
      state: 'Reconciling',
      lastHeartbeat: '30s ago',
      scheduledReconcile: '18:00 EST'
    }
  },
  {
    id: 'LD-4088',
    broker: 'CH Robinson',
    origin: 'Chicago, IL',
    destination: 'Atlanta, GA',
    truck: 'Truck 101',
    driver: 'Dave Kowalski',
    status: 'Delivered',
    agreedRate: 1680.00,
    invoicedRate: 1380.00,
    documentsCount: 3,
    hasDiscrepancy: true,
    durableActorState: {
      state: 'Active',
      lastHeartbeat: '1m ago',
      scheduledReconcile: '18:00 EST'
    }
  },
  {
    id: 'LD-4093',
    broker: 'Echo Global Logistics',
    origin: 'Dallas, TX',
    destination: 'Little Rock, AR',
    truck: 'Truck 103',
    driver: 'Elena Rostova',
    status: 'In Transit',
    agreedRate: 1950.00,
    documentsCount: 2,
    hasDiscrepancy: true,
    durableActorState: {
      state: 'Active',
      lastHeartbeat: '45s ago',
      scheduledReconcile: '18:00 EST'
    }
  },
  {
    id: 'LD-4085',
    broker: 'TQL Logistics',
    origin: 'Cincinnati, OH',
    destination: 'Detroit, MI',
    truck: 'Truck 102',
    driver: 'Ben Miller',
    status: 'Missing Docs',
    agreedRate: 2279.65,
    documentsCount: 1,
    hasDiscrepancy: true,
    durableActorState: {
      state: 'Waiting_POD',
      lastHeartbeat: '2m ago',
      scheduledReconcile: '18:00 EST'
    }
  },
  {
    id: 'LD-4082',
    broker: 'Coyote Logistics',
    origin: 'Indianapolis, IN',
    destination: 'Nashville, TN',
    truck: 'Truck 104',
    driver: 'Marcus Vance',
    status: 'Paid',
    agreedRate: 2100.00,
    invoicedRate: 2100.00,
    documentsCount: 5,
    hasDiscrepancy: false,
    durableActorState: {
      state: 'Ready_Invoice',
      lastHeartbeat: '5m ago',
      scheduledReconcile: 'Completed'
    }
  }
];

export const MOCK_AGENT_MESSAGES: AgentRelayMessage[] = [
  {
    id: 'MSG-101',
    timestamp: '12:31 PM',
    fromAgent: 'extractor',
    toAgent: 'reconciler',
    loadRef: 'LD-4091',
    message: 'Extracted BOL timestamps: Arrived 07:40, Departed 12:10 (4.5 hrs total dwell time). Passing to Reconciler.',
    humanSummary: 'Read BOL photo for Load 4091: 4.5 hours spent at receiver dock.',
    priority: 'normal'
  },
  {
    id: 'MSG-102',
    timestamp: '12:31 PM',
    fromAgent: 'reconciler',
    toAgent: 'briefer',
    loadRef: 'LD-4091',
    message: 'DISCREPANCY: Rate con gives 2 hrs free at $65/hr. Unbilled detention detected: 2.5 hrs = $162.50.',
    humanSummary: 'Found $162.50 in unbilled detention pay to claim from Apex Freight.',
    priority: 'alert'
  },
  {
    id: 'MSG-103',
    timestamp: '12:32 PM',
    fromAgent: 'watchdog',
    toAgent: 'all',
    message: 'FRAUD ALERT: Card #4412 swiped in Amarillo, TX at 14:15. Samsara GPS verifies Truck 102 in Kansas City, MO at 14:15. Flagging $800.73 charge.',
    humanSummary: 'Flagged $800.73 fuel card charge: Truck 102 was 580 miles away at the time.',
    priority: 'urgent'
  },
  {
    id: 'MSG-104',
    timestamp: '12:33 PM',
    fromAgent: 'reconciler',
    toAgent: 'briefer',
    loadRef: 'LD-4088',
    message: 'RATE MISMATCH: Invoice draft #INV-1088 has $1,380.00 but signed rate confirmation is $1,680.00. Underbilled by $300.00.',
    humanSummary: 'Corrected invoice underbilling: Raised Load 4088 from $1,380 to $1,680 ($300 saved).',
    priority: 'alert'
  },
  {
    id: 'MSG-105',
    timestamp: '12:33 PM',
    fromAgent: 'extractor',
    toAgent: 'reconciler',
    loadRef: 'LD-4093',
    message: 'Driver text receipt parsed: Capstone Logistics $175.00 lumper fee. No corresponding invoice line exists.',
    humanSummary: 'Recovered $175 out-of-pocket lumper fee from Elena\'s text message.',
    priority: 'normal'
  },
  {
    id: 'MSG-106',
    timestamp: '12:34 PM',
    fromAgent: 'watchdog',
    toAgent: 'briefer',
    message: 'DUPLICATE EXPENSE: Pilot Flying J receipt for $1,250.43 matches previous upload on Monday.',
    humanSummary: 'Blocked $1,250.43 duplicate fuel receipt submitted twice.',
    priority: 'alert'
  },
  {
    id: 'MSG-107',
    timestamp: '12:34 PM',
    fromAgent: 'briefer',
    toAgent: 'all',
    message: 'NIGHTLY BRIEFING COMPILED: 5 critical items ready for owner sign-off. Total flagged leakage: $2,688.66.',
    humanSummary: 'Compiled tonight\'s owner briefing: 5 actionable items totaling $2,688.66.',
    priority: 'urgent'
  }
];

export const MOCK_KPIS: FleetKPIs = {
  revenuePerMile: 2.74,
  fuelCostPerMile: 0.88,
  openReceivablesTotal: 42890.00,
  overdueReceivablesCount: 3,
  unbilledDetentionLoss: 1420.00,
  monthlyIftaMiles: 28450
};
