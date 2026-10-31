export type UserRole = 'trucker' | 'owner';

export type Severity = 'critical' | 'warning' | 'info';

export interface DriverProfile {
  id: string;
  name: string;
  truckId: string;
  avatar: string;
  status: 'Driving' | 'Loading / Dock' | 'Resting' | 'Off-Duty';
  currentLoadId?: string;
  todayMiles: number;
  phone: string;
  fuelCardNumber: string;
  recentUploadsCount: number;
  detentionTimer?: {
    location: string;
    arrivedAt: string;
    elapsedHours: number;
    isBillable: boolean;
  };
}

export interface PlantedProblem {
  id: string; // P1 - P12
  title: string;
  category: 'detention' | 'billing' | 'pod' | 'claim' | 'lumper' | 'fuel' | 'compliance' | 'receivables';
  impactAmount?: number;
  impactFormatted?: string;
  isTonightBriefing: boolean; // P1, P3, P6, P7, P8
  severity: Severity;
  loadId?: string;
  truckId?: string;
  driver?: string;
  description: string;
  agentResponsible: 'extractor' | 'reconciler' | 'watchdog' | 'briefer';
  suggestedAction: string;
  evidence: {
    type: 'comparison' | 'document' | 'telematics';
    docA?: {
      title: string;
      source: string;
      extractedTime?: string;
      highlightText: string;
      badge: string;
    };
    docB?: {
      title: string;
      source: string;
      extractedTime?: string;
      highlightText: string;
      badge: string;
    };
    notes: string;
  };
}

export interface ExtractedDocument {
  id: string;
  filename: string;
  fileType: 'pdf' | 'jpg' | 'png' | 'docx' | 'eml' | 'txt';
  docClassification: 'Rate Con' | 'BOL' | 'POD' | 'Fuel Receipt' | 'Lumper' | 'DVIR' | 'Invoice';
  confidenceScore: number; // 0 - 100
  needsReview: boolean;
  uploadedAt: string;
  loadRef?: string;
  driverName?: string;
  extractedFields: Record<string, string | number>;
  sourceThumbnail?: string;
}

export interface LoadItem {
  id: string;
  broker: string;
  origin: string;
  destination: string;
  truck: string;
  driver: string;
  status: 'In Transit' | 'Delivered' | 'Invoiced' | 'Paid' | 'Missing Docs';
  agreedRate: number;
  invoicedRate?: number;
  documentsCount: number;
  hasDiscrepancy: boolean;
  durableActorState: {
    state: 'Active' | 'Reconciling' | 'Waiting_POD' | 'Ready_Invoice';
    lastHeartbeat: string;
    scheduledReconcile: string;
  };
}

export interface AgentRelayMessage {
  id: string;
  timestamp: string;
  fromAgent: 'extractor' | 'reconciler' | 'watchdog' | 'briefer' | 'enrichment';
  toAgent: 'extractor' | 'reconciler' | 'watchdog' | 'briefer' | 'enrichment' | 'all';
  loadRef?: string;
  message: string;
  priority: 'normal' | 'alert' | 'urgent';
  humanSummary?: string; // friendly 1-sentence summary
}

export interface FleetKPIs {
  revenuePerMile: number;
  fuelCostPerMile: number;
  openReceivablesTotal: number;
  overdueReceivablesCount: number;
  unbilledDetentionLoss: number;
  monthlyIftaMiles: number;
}
