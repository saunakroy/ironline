export type AgentType = 'extractor' | 'reconciler' | 'watchdog' | 'briefer';
export type ActiveTab = 'home' | 'dashboard' | 'agents';
export type UserRole = 'owner' | 'trucker';
export type ThemeMode = 'light' | 'dark';

export interface DriverSession {
  id: string;
  name: string;
  truckId: string;
  currentLoadId: string;
  route: string;
  cardLast4: string;
}

export interface BriefingField {
  label: string;
  value: string;
  isProblem?: boolean;
}

export interface BriefingItem {
  id: string; // P1, P3, P6, P7, P8
  title: string;
  amount: number;
  amountFormatted: string;
  summary: string;
  agent: AgentType;
  loadId?: string;
  truckId?: string;
  driver?: string;
  evidenceUrl: string;
  evidenceType: 'image' | 'comparison' | 'telematics';
  evidenceTitle: string;
  confidence: number; // 0 - 100
  fields: BriefingField[];
  problemFields: string[]; // keys of fields that are problematic
  suggestedAction: string;
  notes: string;
}

export interface WatchItem {
  id: string;
  title: string;
  amountFormatted?: string;
  summary: string;
  badge: string;
  category: 'cash' | 'compliance' | 'billing';
}

export interface ProcessedFile {
  id: string;
  name: string;
  size: string;
  type: string;
  uploadedAt: string;
  stage: 'uploaded' | 'classifying' | 'extracting' | 'done' | 'needs_review';
  docType?: string;
  confidence?: number;
  loadId?: string;
  keyFields?: Record<string, string>;
  isExpanded?: boolean;
}

export interface AgentMessage {
  id: string;
  timestamp: string;
  from: AgentType;
  to: AgentType | 'all';
  loadId?: string;
  text: string;
  priority: 'normal' | 'alert' | 'urgent';
}

export interface FleetKPIs {
  revenuePerMile: number;
  fuelCostPerMile: number;
  openReceivablesTotal: number;
  overdueReceivablesCount: number;
  unbilledDetentionLoss: number;
  monthlyIftaMiles: number;
}
