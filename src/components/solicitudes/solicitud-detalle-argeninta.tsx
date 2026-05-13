"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { FirmaModal } from "./firma-modal";
import { EstadoBadge } from "./estado-badge";
import { TIPO_LABEL, type EstadoSolicitud, type Solicitud, type TipoGestion } from "@/types";
import {
  avanzarSolicitud,
  agregarNotaSolicitud,
  deshacerUltimoPaso,
  derivarManualmente,
  cancelarSolicitud,
} from "@/app/actions/solicitudes";

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
  allAreas,
}: {
  solicitud: Solicitud;
  historial: HistorialEvent[];
  beneficiario: string;
  firmantesIniciales: Firmante[];
  necesitaFirma: boolean;
  allAreas: Array<{ id: string; name: string }>;
}) {
  // Estado de status leído directamente del prop — la persistencia se hace
  // server-side y luego router.refresh() trae el valor nuevo.
  const estado = solicitud.status as EstadoSolicitud;
  // Entries que solo viven local (firmas — todavía no persisten a DB).
  const [pendingLocalEntries, setPendingLocalEntries] = useState<HistorialEvent[]>([]);
  const historialLocal: HistorialEvent[] = [...historial, ...pendingLocalEntries];
  const [firmantes, setFirmantes] = useState<Firmante[]>(firmantesIniciales);
  const [showFirmaPad, setShowFirmaPad] = useState(false);
  const [firmaTarget, setFirmaTarget] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [nota, setNota] = useState("");
  const [showNota, setShowNota] = useState(false);
  const [expandedEventId, setExpandedEventId] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isAvanzando, startAvanzar] = useTransition();
  const [isGuardandoNota, startNota] = useTransition();
  const [isDeshaciendo, startDeshacer] = useTransition();
  const [isDerivando, startDerivar] = useTransition();
  const [isCancelando, startCancelar] = useTransition();
  const [showDerivar, setShowDerivar] = useState(false);
  const [areaDestino, setAreaDestino] = useState<string>("");
  const [motivoDerivar, setMotivoDerivar] = useState("");
  const [showCancelar, setShowCancelar] = useState(false);
  const [motivoCancelar, setMotivoCancelar] = useState("");
  const router = useRouter();

  // El último evento de tipo state_change determina si hay algo para "deshacer"
  const hayCambioPrevio = historial.some((e) => e.event_type === "state_change");
  const puedeCancelar = estado !== "closed" && estado !== "cancelled";

  function buildMailtoForEvent(
    targetEmail: string,
    targetName: string | null,
    evento: HistorialEvent,
  ): string {
    const greeting = `Hola ${targetName?.trim().split(/\s+/)[0] || ""}`.trim();
    const expediente = solicitud.numero_expediente ?? "(sin nro)";
    const concepto = solicitud.concepto ?? "—";
    const accion = eventoLabel(evento);
    const fecha = formatFechaHora(evento.created_at);

    const subject = `Consulta — expediente ${expediente}`;
    const body =
      `${greeting},\n\n` +
      `Te escribo por el expediente ${expediente} ("${concepto}").\n\n` +
      `Veo en la trazabilidad que el ${fecha} intervinieste con: "${accion}".\n\n` +
      `¿Podrías darme más contexto sobre este punto?\n\n` +
      `Gracias.`;

    return `mailto:${targetEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }

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
    setActionError(null);
    startAvanzar(async () => {
      const result = await avanzarSolicitud(solicitud.id);
      if (!result.ok) {
        setActionError(result.error);
        return;
      }
      setConfirming(false);
      router.refresh();
    });
  }

  function agregarNota() {
    const text = nota.trim();
    if (!text) return;
    setActionError(null);
    startNota(async () => {
      const result = await agregarNotaSolicitud(solicitud.id, text);
      if (!result.ok) {
        setActionError(result.error);
        return;
      }
      setNota("");
      setShowNota(false);
      router.refresh();
    });
  }

  function handleDeshacer() {
    if (!confirm("¿Volver al estado anterior? El cambio queda registrado en la trazabilidad.")) return;
    setActionError(null);
    startDeshacer(async () => {
      const r = await deshacerUltimoPaso(solicitud.id);
      if (!r.ok) {
        setActionError(r.error);
        return;
      }
      router.refresh();
    });
  }

  function handleDerivar() {
    if (!areaDestino) return;
    setActionError(null);
    startDerivar(async () => {
      const r = await derivarManualmente(
        solicitud.id,
        areaDestino,
        motivoDerivar.trim() || undefined,
      );
      if (!r.ok) {
        setActionError(r.error);
        return;
      }
      setShowDerivar(false);
      setAreaDestino("");
      setMotivoDerivar("");
      router.refresh();
    });
  }

  function handleCancelar() {
    const text = motivoCancelar.trim();
    if (!text) {
      setActionError("Indicá la razón de la cancelación.");
      return;
    }
    setActionError(null);
    startCancelar(async () => {
      const r = await cancelarSolicitud(solicitud.id, text);
      if (!r.ok) {
        setActionError(r.error);
        return;
      }
      setShowCancelar(false);
      setMotivoCancelar("");
      router.refresh();
    });
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
    setPendingLocalEntries((prev) => [...prev, entry]);
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
              <div className="flex justify-end items-center gap-2 mt-2">
                {actionError && (
                  <span className="text-[11.5px] text-destructive mr-auto">{actionError}</span>
                )}
                <button
                  onClick={() => setShowNota(false)}
                  disabled={isGuardandoNota}
                  className="text-[12px] text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={agregarNota}
                  disabled={isGuardandoNota || !nota.trim()}
                  className="text-[12px] font-semibold text-primary hover:text-primary/70 transition-colors disabled:opacity-50"
                >
                  {isGuardandoNota ? "Guardando…" : "Guardar nota"}
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
                <div className="space-y-3">
                  {historialDesc.map((ev, idx) => {
                    const userName = ev.user?.full_name || ev.user?.email || "Sistema";
                    const isExpanded = expandedEventId === ev.id;
                    const hasUserEmail = !!ev.user?.email;
                    const otherMetadata = ev.metadata
                      ? Object.entries(ev.metadata).filter(([k]) => k !== "note")
                      : [];
                    return (
                      <div key={ev.id} className="relative">
                        <button
                          onClick={() => setExpandedEventId(isExpanded ? null : ev.id)}
                          className={cn(
                            "w-full flex gap-4 relative text-left rounded-lg px-2 -ml-2 py-2 transition-colors",
                            isExpanded ? "bg-muted/40" : "hover:bg-muted/30",
                          )}
                        >
                          <div
                            className={cn(
                              "w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 z-10 text-[10px] font-bold ring-2 ring-background",
                              idx === 0
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted border border-border text-muted-foreground",
                            )}
                          >
                            {idx === 0 ? (
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <circle cx="12" cy="12" r="3" strokeWidth={2.5} fill="currentColor" />
                              </svg>
                            ) : (
                              userInitials(ev.user?.full_name, ev.user?.email)
                            )}
                          </div>
                          <div className="flex-1 min-w-0 pt-0.5">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-[13.5px] font-semibold text-foreground leading-snug truncate">
                                {eventoLabel(ev)}
                              </p>
                              <svg
                                className={cn(
                                  "w-3.5 h-3.5 text-muted-foreground/50 flex-shrink-0 transition-transform",
                                  isExpanded && "rotate-180",
                                )}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </div>
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
                        </button>

                        {isExpanded && (
                          <div className="ml-10 mt-2 mb-1 p-3.5 rounded-lg border border-border bg-background space-y-3">
                            <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-[12px]">
                              <span className="text-muted-foreground font-medium">Evento</span>
                              <span className="font-mono text-foreground">{ev.event_type}</span>

                              {ev.user?.email && (
                                <>
                                  <span className="text-muted-foreground font-medium">Mail</span>
                                  <span className="font-mono text-foreground break-all">{ev.user.email}</span>
                                </>
                              )}

                              <span className="text-muted-foreground font-medium">Fecha</span>
                              <span className="font-mono text-foreground">{new Date(ev.created_at).toISOString()}</span>

                              {otherMetadata.map(([k, v]) => (
                                <span key={k} className="contents">
                                  <span className="text-muted-foreground font-medium">{k}</span>
                                  <span className="font-mono text-foreground break-all">
                                    {typeof v === "object" ? JSON.stringify(v) : String(v)}
                                  </span>
                                </span>
                              ))}
                            </div>

                            {hasUserEmail && (
                              <div className="pt-2 border-t border-border/60">
                                <a
                                  href={buildMailtoForEvent(ev.user!.email, ev.user!.full_name, ev)}
                                  className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-primary hover:bg-primary/10 px-2.5 py-1.5 rounded-md transition-colors"
                                >
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                  </svg>
                                  Consultar a {userName}
                                </a>
                              </div>
                            )}
                          </div>
                        )}
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
                    {f.estado === "pendiente" && (
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

          </div>
        )}

        <FirmaModal
          isOpen={showFirmaPad && firmaTarget !== null}
          firmante={firmaTarget}
          onSave={(dataUrl) => firmaTarget && firmarDocumento(firmaTarget, dataUrl)}
          onClose={() => {
            setShowFirmaPad(false);
            setFirmaTarget(null);
          }}
        />

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
                  ¿Confirmar &ldquo;{transition.label}&rdquo;?
                </p>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => setConfirming(false)}
                    disabled={isAvanzando}
                    className="flex-1 px-2 py-1.5 text-[12px] border border-border rounded-lg hover:bg-muted transition-colors disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={avanzarEstado}
                    disabled={isAvanzando}
                    className={cn(
                      "flex-1 px-2 py-1.5 text-[12px] font-semibold text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-60",
                      transition.color
                    )}
                  >
                    {isAvanzando ? "Guardando…" : "Confirmar"}
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setConfirming(true)}
                disabled={isAvanzando}
                className={cn(
                  "w-full px-3 py-2 text-[12.5px] font-semibold text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-60",
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
          {actionError && (
            <p className="text-[11.5px] text-destructive mt-2 leading-snug">
              {actionError}
            </p>
          )}

          {/* Acciones de escape */}
          <div className="mt-3 pt-3 border-t border-border/60 space-y-1.5">
            {hayCambioPrevio && (
              <button
                onClick={handleDeshacer}
                disabled={isDeshaciendo}
                className="w-full text-[11.5px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted py-1.5 rounded transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                </svg>
                {isDeshaciendo ? "Deshaciendo…" : "Deshacer último paso"}
              </button>
            )}

            {puedeCancelar && (
              <button
                onClick={() => setShowDerivar((v) => !v)}
                disabled={isDerivando}
                className="w-full text-[11.5px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted py-1.5 rounded transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
                Derivar manualmente a otra área
              </button>
            )}

            {showDerivar && (
              <div className="bg-muted/30 border border-border rounded-lg p-2.5 space-y-2">
                <select
                  value={areaDestino}
                  onChange={(e) => setAreaDestino(e.target.value)}
                  className="w-full text-[12px] border border-border rounded px-2 py-1.5 bg-card focus:outline-none focus:ring-2 focus:ring-ring/40"
                >
                  <option value="">Elegí un área…</option>
                  {allAreas
                    .filter((a) => a.id !== solicitud.current_area_id)
                    .map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                </select>
                <input
                  type="text"
                  value={motivoDerivar}
                  onChange={(e) => setMotivoDerivar(e.target.value)}
                  placeholder="Motivo (opcional)"
                  className="w-full text-[12px] border border-border rounded px-2 py-1.5 bg-card focus:outline-none focus:ring-2 focus:ring-ring/40"
                />
                <div className="flex gap-1.5">
                  <button
                    onClick={() => {
                      setShowDerivar(false);
                      setAreaDestino("");
                      setMotivoDerivar("");
                    }}
                    disabled={isDerivando}
                    className="flex-1 text-[11.5px] py-1.5 rounded border border-border text-muted-foreground hover:bg-muted transition-colors disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleDerivar}
                    disabled={isDerivando || !areaDestino}
                    className="flex-1 text-[11.5px] font-semibold py-1.5 rounded bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    {isDerivando ? "Derivando…" : "Derivar"}
                  </button>
                </div>
              </div>
            )}

            {puedeCancelar && !showCancelar && (
              <button
                onClick={() => setShowCancelar(true)}
                className="w-full text-[11.5px] font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 py-1.5 rounded transition-colors flex items-center justify-center gap-1.5"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Cancelar expediente
              </button>
            )}

            {showCancelar && (
              <div className="bg-rose-50 border border-rose-200 rounded-lg p-2.5 space-y-2">
                <p className="text-[11.5px] text-rose-900 font-medium">
                  Cancelar este expediente. Esta acción queda registrada.
                </p>
                <input
                  type="text"
                  value={motivoCancelar}
                  onChange={(e) => setMotivoCancelar(e.target.value)}
                  placeholder="Razón de la cancelación"
                  autoFocus
                  className="w-full text-[12px] border border-rose-300 rounded px-2 py-1.5 bg-card focus:outline-none focus:ring-2 focus:ring-rose-300/60"
                />
                <div className="flex gap-1.5">
                  <button
                    onClick={() => {
                      setShowCancelar(false);
                      setMotivoCancelar("");
                    }}
                    disabled={isCancelando}
                    className="flex-1 text-[11.5px] py-1.5 rounded border border-border text-muted-foreground hover:bg-muted transition-colors disabled:opacity-50"
                  >
                    Volver
                  </button>
                  <button
                    onClick={handleCancelar}
                    disabled={isCancelando || !motivoCancelar.trim()}
                    className="flex-1 text-[11.5px] font-semibold py-1.5 rounded bg-rose-600 text-white hover:bg-rose-700 transition-colors disabled:opacity-50"
                  >
                    {isCancelando ? "Cancelando…" : "Confirmar cancelación"}
                  </button>
                </div>
              </div>
            )}
          </div>
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
