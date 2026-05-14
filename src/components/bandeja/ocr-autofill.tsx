"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  extraerCamposConClaude,
  aplicarCamposExtraidos,
} from "@/app/actions/inbox";
import type { CamposFactura } from "@/lib/ocr/claude-extract";
import { cn } from "@/lib/utils";

type Status =
  | { kind: "idle" }
  | { kind: "extracting" }
  | { kind: "review"; campos: CamposFactura; rawText: string; pages: number; elapsed: number }
  | { kind: "applying" }
  | { kind: "error"; message: string };

const FIELDS: Array<{ key: keyof CamposFactura; label: string; type?: "number" | "date" | "text" }> = [
  { key: "tipo_comprobante", label: "Tipo de comprobante" },
  { key: "cuit_emisor", label: "CUIT emisor" },
  { key: "razon_social_emisor", label: "Razón social emisor" },
  { key: "punto_venta", label: "Punto de venta" },
  { key: "numero_comprobante", label: "N° de comprobante" },
  { key: "fecha_emision", label: "Fecha de emisión", type: "date" },
  { key: "importe_total", label: "Importe total", type: "number" },
  { key: "moneda", label: "Moneda" },
  { key: "concepto", label: "Concepto" },
];

export function OcrAutofillButton({ solicitudId }: { solicitudId: string }) {
  const router = useRouter();
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [isPending, startTransition] = useTransition();

  async function runExtract() {
    setStatus({ kind: "extracting" });
    try {
      const res = await extraerCamposConClaude(solicitudId);
      if (!res.ok) {
        setStatus({ kind: "error", message: res.error });
        return;
      }
      setStatus({
        kind: "review",
        campos: res.campos,
        rawText: res.rawText,
        pages: res.pages,
        elapsed: res.elapsed,
      });
    } catch (err) {
      setStatus({
        kind: "error",
        message: err instanceof Error ? err.message : String(err),
      });
    }
  }

  async function applyFields(campos: CamposFactura) {
    setStatus({ kind: "applying" });
    const res = await aplicarCamposExtraidos(solicitudId, campos);
    if (!res.ok) {
      setStatus({ kind: "error", message: res.error });
      return;
    }
    startTransition(() => {
      router.refresh();
      setStatus({ kind: "idle" });
    });
  }

  const busy =
    status.kind === "extracting" || status.kind === "applying";

  return (
    <>
      <button
        onClick={runExtract}
        disabled={busy}
        className={cn(
          "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium border transition-all",
          "border-primary/30 bg-primary/5 text-primary hover:bg-primary/10",
          "disabled:opacity-60 disabled:cursor-not-allowed",
        )}
      >
        <svg
          className={cn(
            "w-3.5 h-3.5",
            status.kind === "extracting" && "animate-spin",
          )}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
        </svg>
        {status.kind === "extracting" ? "Leyendo PDF con IA…" : "Autocompletar con IA"}
      </button>

      {status.kind === "error" && (
        <span className="ml-3 text-[11.5px] text-red-600">{status.message}</span>
      )}

      {status.kind === "review" && (
        <ReviewModal
          campos={status.campos}
          rawText={status.rawText}
          pages={status.pages}
          elapsed={status.elapsed}
          onCancel={() => setStatus({ kind: "idle" })}
          onApply={applyFields}
          applying={isPending}
        />
      )}
      {status.kind === "applying" && <span className="ml-3 text-[11.5px] text-muted-foreground">Aplicando…</span>}
    </>
  );
}

function ReviewModal({
  campos,
  rawText,
  pages,
  elapsed,
  onCancel,
  onApply,
  applying,
}: {
  campos: CamposFactura;
  rawText: string;
  pages: number;
  elapsed: number;
  onCancel: () => void;
  onApply: (campos: CamposFactura) => void;
  applying: boolean;
}) {
  const [draft, setDraft] = useState<CamposFactura>(campos);

  function setField<K extends keyof CamposFactura>(k: K, v: CamposFactura[K]) {
    setDraft((d) => ({ ...d, [k]: v }));
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-6"
      onClick={onCancel}
    >
      <div
        className="bg-card rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="text-[15px] font-semibold text-foreground">
              Revisá los datos extraídos
            </h2>
            <p className="text-[11.5px] text-muted-foreground mt-0.5">
              OCR sobre {pages} pág en {elapsed}s. Corregí lo que veas mal y aplicá.
            </p>
          </div>
          <button
            onClick={onCancel}
            className="text-muted-foreground hover:text-foreground text-[18px]"
            title="Cancelar"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-auto px-6 py-5 grid grid-cols-2 gap-x-6 gap-y-4">
          {FIELDS.map((f) => {
            const raw = draft[f.key];
            const value = raw == null ? "" : String(raw);
            return (
              <label key={f.key} className="block">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide block mb-1.5">
                  {f.label}
                </span>
                <input
                  type={f.type ?? "text"}
                  value={value}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (f.type === "number") {
                      setField(f.key, (v === "" ? null : Number(v)) as CamposFactura[typeof f.key]);
                    } else {
                      setField(f.key, (v === "" ? null : v) as CamposFactura[typeof f.key]);
                    }
                  }}
                  step={f.type === "number" ? "0.01" : undefined}
                  className="w-full px-3 py-2 text-[13px] border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring/40"
                  placeholder="(vacío)"
                />
              </label>
            );
          })}

          <details className="col-span-2 mt-2 border-t border-border pt-4">
            <summary className="text-[11.5px] text-muted-foreground cursor-pointer hover:text-foreground">
              Ver texto OCR completo
            </summary>
            <pre className="mt-3 max-h-72 overflow-auto bg-muted/40 p-3 rounded-lg text-[11px] whitespace-pre-wrap font-mono text-foreground/80">
              {rawText || "(sin texto)"}
            </pre>
          </details>
        </div>

        <div className="px-6 py-4 border-t border-border flex items-center justify-end gap-2">
          <button
            onClick={onCancel}
            disabled={applying}
            className="px-4 py-2 text-[13px] font-medium text-muted-foreground hover:text-foreground rounded-lg"
          >
            Cancelar
          </button>
          <button
            onClick={() => onApply(draft)}
            disabled={applying}
            className="px-4 py-2 text-[13px] font-medium rounded-lg bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-60"
          >
            {applying ? "Aplicando…" : "✓ Aplicar a la solicitud"}
          </button>
        </div>
      </div>
    </div>
  );
}
