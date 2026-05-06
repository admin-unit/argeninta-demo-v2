"use client";

import { useState } from "react";
import { ExpedientesTable } from "@/components/expedientes/expedientes-table";
import { NuevoExpedienteModal } from "@/components/expedientes/nuevo-expediente-modal";

export default function ExpedientesPage() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="flex flex-col h-full">
      <header className="px-8 py-5 border-b border-border bg-card shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[17px] font-semibold text-foreground tracking-tight">
              Expedientes
            </h1>
            <p className="text-[13px] text-muted-foreground mt-0.5">
              Gestioná y seguí el estado de tus trámites
            </p>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="h-9 px-4 rounded-lg bg-primary text-primary-foreground text-[13px] font-medium hover:bg-primary/90 transition-colors flex items-center gap-2"
          >
            <PlusIcon size={14} />
            Nuevo expediente
          </button>
        </div>
      </header>

      <div className="flex-1 px-8 py-6 overflow-auto">
        <ExpedientesTable />
      </div>

      <NuevoExpedienteModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
}

function PlusIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}
