import { Clock, FileText, Fuel, Mail, Receipt, ScrollText, Image as ImageIcon } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { ProblemCategory } from '../data/types'
import type { DocKind } from '../data/intake'

export const CATEGORY_ICON: Record<ProblemCategory, LucideIcon> = {
  fuel: Fuel,
  rate: ScrollText,
  lumper: Receipt,
  detention: Clock,
}

export const DOC_KIND_ICON: Record<DocKind, LucideIcon> = {
  PDF: FileText,
  DOCX: FileText,
  JPG: ImageIcon,
  EML: Mail,
  TXT: ScrollText,
}
