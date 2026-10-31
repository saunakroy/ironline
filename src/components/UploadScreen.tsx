import { useState } from 'react'
import EvidenceDrawer, { type EvidenceDrawerProps } from './EvidenceDrawer'
import IntakeSection from './IntakeSection'

export default function UploadScreen() {
  const [drawer, setDrawer] = useState<Omit<EvidenceDrawerProps, 'onClose'> | null>(null)

  return (
    <div className="px-4 pb-10 pt-6 sm:px-6">
      <header>
        <p className="text-[13px] font-medium text-text-muted">Paperwork intake</p>
        <h1 className="mt-1 text-[26px] font-bold text-text sm:text-3xl">Upload</h1>
        <p className="mt-2 text-sm text-text-muted">
          Rate cons, BOL photos, receipts, texts — drop them here and the agents take it from there.
        </p>
      </header>

      <div className="mt-5">
        <IntakeSection onOpenEvidence={setDrawer} />
      </div>

      {drawer && <EvidenceDrawer {...drawer} onClose={() => setDrawer(null)} />}
    </div>
  )
}
