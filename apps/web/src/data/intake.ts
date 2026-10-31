import type { ExtractedField } from './types'

export type DocKind = 'PDF' | 'DOCX' | 'JPG' | 'EML' | 'TXT'
export type DocStage = 'uploaded' | 'classifying' | 'extracting' | 'done' | 'needs review'

export interface DemoFile {
  id: string
  name: string
  kind: DocKind
  docType: string
  confidence: number
  evidenceUrl: string
  fields: ExtractedField[]
  finalStage: 'done' | 'needs review'
  loadId: string
}

export const demoFiles: DemoFile[] = [
  {
    id: 'demo-ratecon',
    name: 'ratecon_summitlane_P3.pdf',
    kind: 'PDF',
    docType: 'Rate Confirmation',
    confidence: 0.99,
    evidenceUrl: '/evidence/p3-rate-con.svg',
    loadId: 'P3',
    finalStage: 'done',
    fields: [
      { label: 'Broker', value: 'Summit Lane Logistics', status: 'ok' },
      { label: 'Rate', value: '$1,680.00', status: 'ok' },
      { label: 'Lane', value: 'Dallas TX → Memphis TN', status: 'ok' },
    ],
  },
  {
    id: 'demo-bol',
    name: 'bol_p1_dock_photo.jpg',
    kind: 'JPG',
    docType: 'Bill of Lading',
    confidence: 0.86,
    evidenceUrl: '/evidence/p1-detention-log.svg',
    loadId: 'P1',
    finalStage: 'needs review',
    fields: [
      { label: 'Check-in', value: '07:40', status: 'ok' },
      { label: 'Check-out', value: '12:10', status: 'flagged' },
      { label: 'Receiver', value: 'Dock 14', status: 'ok' },
    ],
  },
  {
    id: 'demo-fuel',
    name: 'fuel_receipt_p8.jpg',
    kind: 'JPG',
    docType: 'Fuel Receipt',
    confidence: 0.97,
    evidenceUrl: '/evidence/p8-fuel-receipt.svg',
    loadId: 'P8',
    finalStage: 'done',
    fields: [
      { label: 'Station', value: 'Pilot #412, Joplin MO', status: 'ok' },
      { label: 'Amount', value: '$1,250.43', status: 'ok' },
      { label: 'Receipt #', value: '00441-A', status: 'flagged' },
    ],
  },
  {
    id: 'demo-text',
    name: 'driver_text_detention_p1.txt',
    kind: 'TXT',
    docType: 'Driver Text',
    confidence: 0.91,
    evidenceUrl: '/evidence/p1-driver-text.svg',
    loadId: 'P1',
    finalStage: 'done',
    fields: [
      { label: 'Driver', value: 'Jake Ramirez', status: 'ok' },
      { label: 'Mentions', value: 'Waited at dock, no reason given', status: 'ok' },
      { label: 'Load', value: 'P1', status: 'ok' },
    ],
  },
]

export function guessDocKind(name: string): DocKind {
  const ext = name.split('.').pop()?.toLowerCase()
  if (ext === 'pdf') return 'PDF'
  if (ext === 'docx' || ext === 'doc') return 'DOCX'
  if (ext === 'eml') return 'EML'
  if (ext === 'txt') return 'TXT'
  return 'JPG'
}

const GENERIC_DOC_TYPES = ['Fuel Receipt', 'Rate Confirmation', 'Lumper Receipt', 'Bill of Lading']

export function buildGenericExtraction(name: string): {
  docType: string
  confidence: number
  fields: ExtractedField[]
  finalStage: 'done' | 'needs review'
} {
  const docType = GENERIC_DOC_TYPES[name.length % GENERIC_DOC_TYPES.length]
  const confidence = 0.62 + ((name.length * 7) % 30) / 100
  const finalStage: 'done' | 'needs review' = confidence >= 0.85 ? 'done' : 'needs review'
  return {
    docType,
    confidence,
    finalStage,
    fields: [
      { label: 'Detected type', value: docType, status: 'ok' },
      { label: 'Readable text', value: confidence >= 0.85 ? 'Clear' : 'Partially obscured', status: finalStage === 'needs review' ? 'flagged' : 'ok' },
    ],
  }
}
