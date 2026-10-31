export type UploadStatus = 'extracting' | 'done' | 'needs review'

export interface UploadFile {
  id: string
  name: string
  kind: 'PDF' | 'DOCX' | 'JPG' | 'EML' | 'TXT'
  size: string
  status: UploadStatus
}

export const seedUploads: UploadFile[] = [
  { id: 'u1', name: 'ratecon_summitlane_P3.pdf', kind: 'PDF', size: '214 KB', status: 'done' },
  { id: 'u2', name: 'bol_p1_dock_photo.jpg', kind: 'JPG', size: '1.8 MB', status: 'needs review' },
  { id: 'u3', name: 'fuel_receipt_p8.jpg', kind: 'JPG', size: '960 KB', status: 'extracting' },
  { id: 'u4', name: 'driver_text_detention_p1.txt', kind: 'TXT', size: '2 KB', status: 'done' },
]
