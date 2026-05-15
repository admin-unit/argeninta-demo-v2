"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckIcon } from "lucide-react";

import { crearSolicitudExterna } from "@/app/actions/solicitudes";

type Tipo = { slug: string; name: string; description: string | null };
type Convenio = {
  odoo_id: number;
  code: string | null;
  name: string;
  fuente: string | null;
};

const MONEDAS = ["ARS", "USD", "EUR"];

export function NuevaSolicitudExternaForm({
  tipos,
  convenios,
}: {
  tipos: Tipo[];
  convenios: Convenio[];
}) {
  const router = useRouter();
  const [tipoSlug, setTipoSlug] = useState(tipos[0]?.slug ?? "");
  const [concepto, setConcepto] = useState("");
  const [importe, setImporte] = useState("");
  const [moneda, setMoneda] = useState("ARS");
  const [cuentaId, setCuentaId] = useState<number | "">(
    convenios[0]?.odoo_id ?? ""
  );
  const [urgency, setUrgency] = useState<"normal" | "urgente">("normal");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!tipoSlug) return setError("Elegí un tipo de gestión.");
    if (cuentaId === "" || !Number.isFinite(Number(cuentaId)))
      return setError("Elegí un convenio.");
    const importeNum = Number(importe);
    if (!Number.isFinite(importeNum) || importeNum <= 0)
      return setError("El importe debe ser mayor a 0.");

    setSubmitting(true);
    try {
      const res = await crearSolicitudExterna({
        tipoSlug,
        concepto,
        importe: importeNum,
        moneda,
        cuentaAnaliticaOdooId: Number(cuentaId),
        urgency,
        notes,
      });
      if (!res.ok) {
        setError(res.error);
        setSubmitting(false);
        return;
      }
      router.push(`/mi-organismo/solicitudes`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
      setSubmitting(false);
    }
  }

  const tipoSel = tipos.find((t) => t.slug === tipoSlug);

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-card rounded-xl border border-border divide-y divide-border/60"
    >
      {error && (
        <div className="px-5 py-3 bg-destructive/5 border-b border-destructive/30 text-[13px] text-destructive">
          {error}
        </div>
      )}

      {/* Tipo */}
      <div className="p-5 space-y-4">
        <Field label="Tipo de gestión" required>
          <select
            value={tipoSlug}
            onChange={(e) => setTipoSlug(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {tipos.map((t) => (
              <option key={t.slug} value={t.slug}>
                {t.name}
              </option>
            ))}
          </select>
          {tipoSel?.description && (
            <p className="text-[11.5px] text-muted-foreground mt-1">
              {tipoSel.description}
            </p>
          )}
        </Field>

        <Field label="Convenio / Cuenta analítica" required>
          {convenios.length === 0 ? (
            <p className="text-[12.5px] text-muted-foreground">
              Tu organismo aún no tiene convenios visibles configurados.
            </p>
          ) : (
            <select
              value={cuentaId}
              onChange={(e) => setCuentaId(Number(e.target.value))}
              className="w-full px-3 py-2 text-sm border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {convenios.map((c) => (
                <option key={c.odoo_id} value={c.odoo_id}>
                  {c.code ? `${c.code} — ` : ""}
                  {c.name}
                  {c.fuente ? ` (${c.fuente})` : ""}
                </option>
              ))}
            </select>
          )}
        </Field>

        <Field label="Concepto / Descripción" required>
          <input
            type="text"
            value={concepto}
            onChange={(e) => setConcepto(e.target.value)}
            placeholder="Ej: Análisis de suelos — LabSuelos S.A."
            className="w-full px-3 py-2 text-sm border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </Field>
      </div>

      {/* Importe + Urgencia */}
      <div className="p-5 space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2">
            <Field label="Importe" required>
              <input
                type="number"
                step="0.01"
                min="0"
                value={importe}
                onChange={(e) => setImporte(e.target.value)}
                placeholder="0,00"
                className="w-full px-3 py-2 text-sm border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring tabular-nums"
              />
            </Field>
          </div>
          <Field label="Moneda">
            <select
              value={moneda}
              onChange={(e) => setMoneda(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-input rounded-lg bg-background"
            >
              {MONEDAS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="Carácter">
          <div className="flex gap-3">
            <label className="flex items-center gap-2 text-[13px]">
              <input
                type="radio"
                name="urgency"
                value="normal"
                checked={urgency === "normal"}
                onChange={() => setUrgency("normal")}
              />
              Normal
            </label>
            <label className="flex items-center gap-2 text-[13px]">
              <input
                type="radio"
                name="urgency"
                value="urgente"
                checked={urgency === "urgente"}
                onChange={() => setUrgency("urgente")}
              />
              Urgente
            </label>
          </div>
        </Field>
      </div>

      {/* Notas */}
      <div className="p-5">
        <Field label="Información adicional (opcional)">
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Contexto, urgencias, o cualquier detalle relevante…"
            className="w-full px-3 py-2 text-sm border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-none"
          />
        </Field>
      </div>

      {/* Acciones */}
      <div className="px-5 py-4 bg-muted/30 flex items-center justify-end gap-2 rounded-b-xl">
        <button
          type="submit"
          disabled={submitting || convenios.length === 0}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity font-medium disabled:opacity-50"
        >
          <CheckIcon className="w-3.5 h-3.5" />
          {submitting ? "Enviando…" : "Enviar solicitud"}
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-[11.5px] font-medium text-muted-foreground mb-1.5 uppercase tracking-wider">
        {label} {required && <span className="text-destructive">*</span>}
      </label>
      {children}
    </div>
  );
}
