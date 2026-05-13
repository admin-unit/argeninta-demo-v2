"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { FirmaPad } from "./firma-pad";
import { EstadoBadge } from "./estado-badge";
import { TIPO_LABEL, type EstadoSolicitud, type Solicitud, type TipoGestion } from "@/types";

type Firmante = {
  nombre: string;
  cargo: string;
  estado: "pendiente" | "firmado";
  firma_img?: string;
};

/** Item del audit_log con join — lo que devuelve getAuditLogForSolicitud */
export interface HistorialEvent {
  id: number;
  event_type: string;
  description: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  user: { id: string; full_name: string | null; email: string } | null;
  area: { id: string; name: string } | null;
}

/** Transiciones reales de status — refleja el ciclo de vida en la DB. */
const TRANSITIONS: Partial<
  Record<
    EstadoSolicitud,
    { label: string; next: EstadoSolicitud; accion: string; color: string }
  >
> = {
  submitted: {
    label: "Tomar en revisión",
    next: "in_review",
    accion: "Solicitud tomada en revisión por Mesa de Entrada",
    color: "bg-primary",
  },
  in_review: {
    label: "Derivar a Administración",
    next: "in_progress",
    accion: "Derivada a Administración para gestión",
    color: "bg-primary",
  },
  in_progress: {
    label: "Postear a Odoo",
    next: "posted_to_odoo",
    accion: "Factura/pago cargado en Odoo",
    color: "bg-violet-600",
  },
  posted_to_odoo: {
    label: "Iniciar pago",
    next: "in_payment",
    accion: "Pago iniciado por Tesorería",
    color: "bg-cyan-600",
  },
  in_payment: {
    label: "Confirmar conciliación",
    next: "closed",
    accion: "Pago conciliado — expediente cerrado",
    color: "bg-emerald-600",
  },
};

function formatFechaHora(iso: string) {
  const d = new Date(iso);
  return `${d.toLocaleDateString("es-AR")} ${d.toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

function formatImporte(importe: number | null, moneda: string | null) {
  if (importe == null) return "—";
  const fmt = new Intl.NumberFormat("es-AR", { minimumFractionDigits: 0 });
  return `${moneda === "ARS" || !moneda ? "$" : moneda + " "}${fmt.format(importe)}`;
}

function userInitials(name: string | null | undefined, email: string | null | undefined) {
  const source = (name?.trim() || email || "?").trim();
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return source.slice(0, 2).toUpperCase();
}

function eventoLabel(ev: HistorialEvent): string {
  if (ev.description) return ev.description;
  // Fallback al event_type formateado
  const map: Record<string, string> = {
    solicitud_created: "Solicitud creada",
    solicitud_submitted: "Solicitud enviada",
    solicitud_routed: "Solicitud derivada",
    solicitud_in_review: "Tomada en revisión",
    solicitud_posted_to_odoo: "Cargada en Odoo",
    payment_initiated: "Pago iniciado",
    payment_reconciled: "Pago conciliado",
    assignment_changed: "Asignación cambiada",
  };
  return map[ev.event_type] ?? ev.event_type;
}

export function SolicitudDetalleArgeninta({
  solicitud,
  historial,
  beneficiario,
  firmantesIniciales,
  necesitaFirma,
}: {
  solicitud: Solicitud;
  historial: HistorialEvent[];
  beneficiario: string;
  firmantesIniciales: Firmante[];
  necesitaFirma: boolean;
}) {
  const [estado, setEstado] = useState<EstadoSolicitud>(
    solicitud.status as EstadoSolicitud
  );
  const [historialLocal, setHistorialLocal] = useState<HistorialEvent[]>(historial);
  const [firmantes, setFirmantes] = useState<Firmante[]>(firmantesIniciales);
  const [showFirmaPad, setShowFirmaPad] = useState(false);
  const [firmaTarget, setFirmaTarget] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [nota, setNota] = useState("");
  const [showNota, setShowNota] = useState(false);

  const transition = TRANSITIONS[estado];
  const historialDesc = [...historialLocal].reverse();
  const todasFirmadas =
    firmantes.length > 0 && firmantes.every((f) => f.estado === "firmado");

  const data = (solicitud.data as Record<string, unknown>) ?? {};
  const cuentaAnalitica =
    (data.codigo_proyecto as string) ||
    (data.convenio as string) ||
    "—";
  const tipoLabel =
    solicitud.tipo_slug && solicitud.tipo_slug in TIPO_LABEL
      ? TIPO_LABEL[solicitud.tipo_slug as TipoGestion]
      : solicitud.tipo_name ?? "—";

  function nowIso() {
    return new Date().toISOString();
  }

  function avanzarEstado() {
    if (!transition) return;
    const entry: HistorialEvent = {
      id: -Date.now(),
      event_type: "solicitud_state_change",
      description: transition.accion + " (demo — no persiste)",
      metadata: { from: estado, to: transition.next, demo: true },
      created_at: nowIso(),
      user: { id: "demo", full_name: "Usuario demo", email: "demo@local" },
      area: null,
    };
    setEstado(transition.next);
    setHistorialLocal((prev) => [...prev, entry]);
    setConfirming(false);
  }

  function agregarNota() {
    if (!nota.trim()) return;
    const entry: HistorialEvent = {
      id: -Date.now(),
      event_type: "note",
      description: "Nota interna agregada (demo)",
      metadata: { note: nota.trim() },
      created_at: nowIso(),
      user: { id: "demo", full_name: "Usuario demo", email: "demo@local" },
      area: null,
    };
    setHistorialLocal((prev) => [...prev, entry]);
    setNota("");
    setShowNota(false);
  }

  function firmarDocumento(nombre: string, dataUrl: string) {
    setFirmantes((prev) =>
      prev.map((f) =>
        f.nombre === nombre ? { ...f, estado: "firmado", firma_img: dataUrl } : f
      )
    );
    const entry: HistorialEvent = {
      id: -Date.now(),
      event_type: "document_signed",
      description: `Documento firmado por ${nombre}`,
      metadata: { firmante: nombre },
      created_at: nowIso(),
      user: { id: "demo", full_name: "Usuario demo", email: "demo@local" },
      area: null,
    };
    setHistorialLocal((prev) => [...prev, entry]);
    setShowFirmaPad(false);
    setFirmaTarget(null);
  }

  return (
    <div className="grid grid-cols-3 gap-5">
      {/* Columna principal */}
      <div className="col-span-2 space-y-4">
        {/* Datos */}
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="px-5 py-3.5 border-b border-border/60 bg-muted/20">
            <h2 className="text-[13px] font-semibold text-foreground">
              Datos de la solicitud
            </h2>
          </div>
          <div className="p-5 grid grid-cols-2 gap-x-8 gap-y-5">
            <Field label="Tipo de gestión">{tipoLabel}</Field>
            <Field label="Organismo">{solicitud.organism_name ?? "—"}</Field>
            <Field label="Beneficiario / proveedor">{beneficiario}</Field>
            <Field label="Cuenta analítica">
              {cuentaAnalitica !== "—" ? (
                <span className="font-mono text-[12px] text-foreground bg-muted px-2 py-1 rounded-md inline-block border border-border/60">
                  {cuentaAnalitica}
                </span>
              ) : (
                "—"
              )}
            </Field>
            <Field label="Importe">
              <span className="text-[22px] font-bold text-foreground tabular-nums leading-none">
                {formatImporte(Number(solicitud.importe), solicitud.moneda)}
              </span>
            </Field>
            <Field label="Solicitante">{solicitud.created_by_name ?? "—"}</Field>
            <Field label="Área actual">{solicitud.current_area_name ?? "—"}</Field>
            <Field label="Asignado a">{solicitud.assigned_user_name ?? "—"}</Field>
          </div>
        </div>

        {/* Render genérico del data jsonb cuando hay campos del formulario */}
        {Object.keys(data).length > 0 && (
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="px-5 py-3.5 border-b border-border/60 bg-muted/20">
              <h2 className="text-[13px] font-semibold text-foreground">
                Datos del formulario
              </h2>
            </div>
            <div className="p-5 grid grid-cols-2 gap-x-8 gap-y-3">
              {Object.entries(data).map(([k, v]) => (
                <div key={k}>
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wide font-medium mb-0.5">
                    {k.replace(/_/g, " ")}
                  </p>
                  <p className="text-[13px] text-foreground break-words">
                    {typeof v === "object" && v !== null ? JSON.stringify(v) : String(v)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Trazabilidad */}
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="px-5 py-3.5 border-b border-border/60 bg-muted/20 flex items-center justify-between">
            <h2 className="text-[13px] font-semibold text-foreground">Trazabilidad</h2>
            <div className="flex items-center gap-3">
              <span className="text-[12px] text-muted-foreground">
                {historialLocal.length} eventos
              </span>
              <button
                onClick={() => setShowNota((v) => !v)}
                className="text-[12px] font-medium text-primary hover:text-primary/70 transition-colors"
              >
                + Agregar nota
              </button>
            </div>
          </div>

          {showNota && (
            <div className="px-5 py-3.5 border-b border-border/60 bg-muted/20">
              <textarea
                value={nota}
                onChange={(e) => setNota(e.target.value)}
                placeholder="Escribí una nota interna sobre esta gestión…"
                className="w-full text-[13px] border border-border rounded-lg p-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-ring/50 bg-background"
                rows={2}
              />
              <div className="flex justify-end gap-2 mt-2">
                <button
                  onClick={() => setShowNota(false)}
                  className="text-[12px] text-muted-foreground hover:text-foreground transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={agregarNota}
                  className="text-[12px] font-semibold text-primary hover:text-primary/70 transition-colors"
                >
                  Guardar nota
                </button>
              </div>
            </div>
          )}

          <div className="p-5">
            {historialDesc.length === 0 ? (
              <p className="text-[13px] text-muted-foreground">
                Aún no hay eventos registrados.
              </p>
            ) : (
              <div className="relative">
                <div className="absolute left-3 top-4 bottom-2 w-px bg-border" />
                <div className="space-y-5">
                  {historialDesc.map((ev, idx) => {
                    const userName = ev.user?.full_name || ev.user?.email || "Sistema";
                    return (
                      <div key={ev.id} className="flex gap-4 relative">
                        <div
                          className={cn(
                            "w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 z-10 text-[10px] font-bold ring-2 ring-background",
                            idx === 0
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted border border-border text-muted-foreground"
                          )}
                        >
                          {idx === 0 ? (
                            <svg
                              className="w-3 h-3"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                cx="12"
                                cy="12"
                                r="3"
                                strokeWidth={2.5}
                                fill="currentColor"
                              />
                            </svg>
                          ) : (
                            userInitials(ev.user?.full_name, ev.user?.email)
                          )}
                        </div>
                        <div className="flex-1 pt-0.5 pb-1">
                          <p className="text-[13.5px] font-semibold text-foreground leading-snug">
                            {eventoLabel(ev)}
                          </p>
                          <p className="text-[12px] text-muted-foreground mt-0.5">
                            {userName}
                            {ev.area?.name ? ` · ${ev.area.name}` : ""} ·{" "}
                            {formatFechaHora(ev.created_at)}
                          </p>
                          {typeof ev.metadata?.note === "string" && (
                            <p className="mt-2 text-[12.5px] text-foreground/80 bg-muted rounded-lg px-3 py-2 border border-border/60">
                              {ev.metadata.note as string}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div className="space-y-4">
        {/* Firma digital */}
        {necesitaFirma && (
          <div
            className={cn(
              "rounded-xl border p-4",
              todasFirmadas
                ? "bg-emerald-50 border-emerald-200"
                : "bg-amber-50 border-amber-200"
            )}
          >
            <h3
              className={cn(
                "text-[11px] font-semibold uppercase tracking-widest mb-3 flex items-center gap-1.5",
                todasFirmadas ? "text-emerald-700" : "text-amber-700"
              )}
            >
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.75}
                  d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                />
              </svg>
              {todasFirmadas ? "Autorizado y firmado" : "Requiere autorización"}
            </h3>

            <div className="space-y-3 mb-3">
              {firmantes.map((f) => (
                <div key={f.nombre}>
                  <div className="flex items-start gap-2">
                    <div
                      className={cn(
                        "w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5",
                        f.estado === "firmado" ? "bg-emerald-500" : "bg-amber-400"
                      )}
                    >
                      {f.estado === "firmado" ? (
                        <svg
                          className="w-3 h-3 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2.5}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      ) : (
                        <span className="w-2 h-2 rounded-full bg-white/80" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12.5px] font-semibold text-foreground leading-snug">
                        {f.nombre}
                      </p>
                      <p className="text-[11px] text-muted-foreground">{f.cargo}</p>
                      <p
                        className={cn(
                          "text-[11px] font-medium mt-0.5",
                          f.estado === "firmado" ? "text-emerald-600" : "text-amber-600"
                        )}
                      >
                        {f.estado === "firmado" ? "Firmado" : "Pendiente de firma"}
                      </p>
                    </div>
                    {f.estado === "pendiente" && !showFirmaPad && (
                      <button
                        onClick={() => {
                          setFirmaTarget(f.nombre);
                          setShowFirmaPad(true);
                        }}
                        className="text-[11.5px] font-semibold text-white bg-amber-500 hover:bg-amber-600 transition-colors px-2.5 py-1 rounded-lg flex-shrink-0"
                      >
                        Firmar
                      </button>
                    )}
                  </div>
                  {f.firma_img && (
                    <div className="mt-2 ml-7">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={f.firma_img}
                        alt="Firma"
                        className="h-10 border border-border/60 rounded-lg bg-white px-2 py-0.5"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {showFirmaPad && firmaTarget && (
              <div className="bg-white rounded-xl border border-border p-3 mt-2">
                <p className="text-[12px] font-semibold text-foreground mb-2">
                  Firma — {firmaTarget}
                </p>
                <FirmaPad
                  onSave={(dataUrl) => firmarDocumento(firmaTarget, dataUrl)}
                  onCancel={() => {
                    setShowFirmaPad(false);
                    setFirmaTarget(null);
                  }}
                />
              </div>
            )}
          </div>
        )}

        {/* Avanzar estado */}
        <div className="bg-card rounded-xl border border-border p-4">
          <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-3">
            Estado de la gestión
          </h3>
          <div className="mb-3">
            <EstadoBadge estado={estado} />
          </div>
          {transition ? (
            confirming ? (
              <div>
                <p className="text-[12px] text-muted-foreground mb-2">
                  ¿Confirmar &ldquo;{transition.label}&rdquo;? (Demo — no persiste todavía)
                </p>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => setConfirming(false)}
                    className="flex-1 px-2 py-1.5 text-[12px] border border-border rounded-lg hover:bg-muted transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={avanzarEstado}
                    className={cn(
                      "flex-1 px-2 py-1.5 text-[12px] font-semibold text-white rounded-lg hover:opacity-90 transition-opacity",
                      transition.color
                    )}
                  >
                    Confirmar
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setConfirming(true)}
                className={cn(
                  "w-full px-3 py-2 text-[12.5px] font-semibold text-white rounded-lg hover:opacity-90 transition-opacity",
                  transition.color
                )}
              >
                {transition.label} →
              </button>
            )
          ) : (
            <p className="text-[12px] text-emerald-600 font-medium">
              {estado === "closed"
                ? "Expediente cerrado"
                : estado === "cancelled"
                ? "Cancelada"
                : "Sin transición disponible"}
            </p>
          )}
        </div>

        {/* Fechas */}
        <div className="bg-card rounded-xl border border-border p-4">
          <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-3">
            Fechas
          </h3>
          <div className="space-y-3">
            <DateRow label="Creada" value={solicitud.created_at} />
            {solicitud.submitted_at && (
              <DateRow label="Enviada" value={solicitud.submitted_at} />
            )}
            {solicitud.posted_at && (
              <DateRow label="Posteada a Odoo" value={solicitud.posted_at} />
            )}
            {solicitud.closed_at && (
              <DateRow label="Cerrada" value={solicitud.closed_at} />
            )}
            <DateRow label="Última actualización" value={solicitud.updated_at} />
          </div>
        </div>

        {solicitud.odoo_move_id && (
          <div className="bg-primary/5 rounded-xl border border-primary/20 p-4">
            <h3 className="text-[11px] font-semibold text-primary/70 uppercase tracking-widest mb-2">
              Sincronizado con Odoo
            </h3>
            <p className="text-[14px] text-primary font-mono font-semibold">
              account.move #{solicitud.odoo_move_id}
            </p>
            {solicitud.odoo_payment_id && (
              <p className="text-[12.5px] text-primary/80 mt-1 font-mono">
                payment #{solicitud.odoo_payment_id}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11.5px] text-muted-foreground mb-1 uppercase tracking-wide font-medium">
        {label}
      </p>
      <div className="text-[14px] font-medium text-foreground">{children}</div>
    </div>
  );
}

function DateRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11.5px] text-muted-foreground mb-0.5">{label}</p>
      <p className="text-[13px] font-medium text-foreground">
        {new Date(value).toLocaleDateString("es-AR", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        })}
      </p>
    </div>
  );
}
