"use client";

import { useState, useEffect } from "react";

const ESTADOS_PASOS = [
  {
    key: "draft",
    label: "Borrador",
    color: "bg-slate-100 text-slate-700 border-slate-200",
    dot: "bg-slate-400",
    desc: "Estás armando la solicitud. Todavía no la envió a Argeninta — podés editar libremente.",
  },
  {
    key: "submitted",
    label: "Pendiente",
    color: "bg-amber-50 text-amber-700 border-amber-200",
    dot: "bg-amber-500",
    desc: "Mesa de Entrada de Argeninta recibió la solicitud y la va a tomar para revisar.",
  },
  {
    key: "in_review",
    label: "En revisión",
    color: "bg-blue-50 text-blue-700 border-blue-200",
    dot: "bg-blue-500",
    desc: "El área responsable está chequeando los datos, documentación y disponibilidad de fondos.",
  },
  {
    key: "in_progress",
    label: "En gestión",
    color: "bg-indigo-50 text-indigo-700 border-indigo-200",
    dot: "bg-indigo-500",
    desc: "Administración está cargando la operación (factura, OC, asiento) en el sistema interno.",
  },
  {
    key: "posted_to_odoo",
    label: "En Odoo",
    color: "bg-violet-50 text-violet-700 border-violet-200",
    dot: "bg-violet-500",
    desc: "La operación quedó asentada en Odoo y se envió a Tesorería para programar el pago.",
  },
  {
    key: "in_payment",
    label: "En tesorería",
    color: "bg-cyan-50 text-cyan-700 border-cyan-200",
    dot: "bg-cyan-500",
    desc: "Tesorería está ejecutando el pago al proveedor. Falta poco.",
  },
  {
    key: "closed",
    label: "Pagado",
    color: "bg-emerald-50 text-emerald-700 border-emerald-200",
    dot: "bg-emerald-500",
    desc: "Listo, el pago se ejecutó. La solicitud queda cerrada y archivada.",
  },
];

const ESTADOS_ALT = [
  {
    key: "cancelled",
    label: "Cancelado",
    color: "bg-slate-100 text-slate-600 border-slate-200",
    desc: "Se llega con el botón \"Cancelar expediente\" desde cualquier estado activo. Queda la razón registrada en la trazabilidad.",
  },
  {
    key: "error",
    label: "Error",
    color: "bg-rose-50 text-rose-700 border-rose-200",
    desc: "Hubo un problema bloqueante. Mirá la trazabilidad para ver qué pasó y reabrir si corresponde.",
  },
];

const ACCIONES_ESCAPE = [
  {
    label: "Deshacer último paso",
    icon: "↶",
    desc: "Si avanzaste el estado sin querer, te volvés al estado y área anteriores. Aparece solo si ya hubo al menos un cambio de estado en este expediente.",
  },
  {
    label: "Derivar manualmente a otra área",
    icon: "→",
    desc: "El expediente cambia de área sin cambiar de estado. Sirve para mandarlo a Jurídicos, Capital Humano u otra área fuera del flujo normal. Podés agregar un motivo.",
  },
  {
    label: "Cancelar expediente",
    icon: "✕",
    desc: "Manda el expediente al estado \"Cancelado\" desde cualquier punto del flujo. Requiere indicar una razón.",
  },
];

export function EstadosHelpButton({ titulo = "Progreso de estados" }: { titulo?: string }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Ayuda sobre estados"
        className="inline-flex items-center justify-center w-5 h-5 rounded-full border border-border text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors text-[11px] font-semibold"
      >
        ?
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-in fade-in"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-border/60 sticky top-0 bg-card">
              <div>
                <h2 className="text-[16px] font-semibold text-foreground tracking-tight">
                  {titulo}
                </h2>
                <p className="text-[12.5px] text-muted-foreground mt-0.5">
                  Una solicitud avanza por estos estados desde que se envía hasta que se paga.
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-muted-foreground hover:text-foreground -mr-1 -mt-1 p-1"
                aria-label="Cerrar"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="px-6 py-5">
              <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-3">
                Flujo normal
              </h3>
              <div className="relative">
                <div className="absolute left-[7px] top-3 bottom-3 w-px bg-border" />
                <div className="space-y-3">
                  {ESTADOS_PASOS.map((e, i) => (
                    <div key={e.key} className="flex items-start gap-3 relative">
                      <div
                        className={`w-[15px] h-[15px] rounded-full ${e.dot} ring-2 ring-card relative z-10 mt-1 flex-shrink-0`}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2 flex-wrap">
                          <span className={`text-[11.5px] font-semibold px-2 py-0.5 rounded-full border ${e.color}`}>
                            {i + 1}. {e.label}
                          </span>
                        </div>
                        <p className="text-[12.5px] text-muted-foreground mt-1 leading-relaxed">
                          {e.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mt-6 mb-3">
                Estados alternativos
              </h3>
              <div className="space-y-2">
                {ESTADOS_ALT.map((e) => (
                  <div key={e.key} className="flex items-start gap-3 p-3 rounded-lg border border-border bg-muted/30">
                    <span className={`text-[11.5px] font-semibold px-2 py-0.5 rounded-full border ${e.color} flex-shrink-0`}>
                      {e.label}
                    </span>
                    <p className="text-[12.5px] text-muted-foreground leading-relaxed">
                      {e.desc}
                    </p>
                  </div>
                ))}
              </div>

              <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mt-6 mb-3">
                Acciones de escape
              </h3>
              <p className="text-[12px] text-muted-foreground mb-3 leading-relaxed">
                Dentro de cada expediente, además del botón principal para avanzar, tenés estas opciones para corregir o desviar el flujo:
              </p>
              <div className="space-y-2">
                {ACCIONES_ESCAPE.map((a) => (
                  <div key={a.label} className="flex items-start gap-3 p-3 rounded-lg border border-border bg-card">
                    <span className="w-6 h-6 flex items-center justify-center rounded-full bg-muted border border-border text-foreground text-[13px] flex-shrink-0 font-semibold">
                      {a.icon}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12.5px] font-semibold text-foreground">{a.label}</p>
                      <p className="text-[12px] text-muted-foreground leading-relaxed mt-0.5">
                        {a.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
