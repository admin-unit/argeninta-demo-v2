'use client'

import { useEffect } from 'react'
import { FirmaPad } from './firma-pad'

export function FirmaModal({
  isOpen,
  firmante,
  onSave,
  onClose,
}: {
  isOpen: boolean
  firmante: string | null
  onSave: (dataUrl: string) => void
  onClose: () => void
}) {
  useEffect(() => {
    if (!isOpen) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  if (!isOpen || !firmante) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between px-6 pt-5 pb-3 border-b border-border/60">
          <div>
            <h2 className="text-[15px] font-semibold text-foreground tracking-tight">
              Firma del documento
            </h2>
            <p className="text-[12.5px] text-muted-foreground mt-0.5">
              {firmante}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors -mr-1 -mt-1 p-1"
            aria-label="Cerrar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="p-6">
          <FirmaPad
            width={960}
            height={340}
            onSave={onSave}
            onCancel={onClose}
          />
        </div>
      </div>
    </div>
  )
}
