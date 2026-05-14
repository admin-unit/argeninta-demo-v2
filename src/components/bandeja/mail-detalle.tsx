"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import type {
  AuditLogEvent,
  InboxAttachment,
  InboxEmailDetail,
  InboxStatus,
  SolicitudVinculable,
} from "@/lib/data";
import {
  derivarMailAArea,
  marcarMailLeido,
  descartarMail,
  agregarNotaMail,
} from "@/app/actions/inbox";
import { MailTrazabilidad } from "./mail-trazabilidad";
import { AttachmentThumbsGrid } from "./attachment-thumbs";

const STATUS_STYLES: Record<InboxStatus, string> = {
  unprocessed: "bg-amber-50 text-amber-700 border-amber-200",
  read: "bg-blue-50 text-blue-700 border-blue-200",
  processed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  discarded: "bg-zinc-50 text-zinc-600 border-zinc-200",
};

const STATUS_LABEL: Record<InboxStatus, string> = {
  unprocessed: "Sin procesar",
  read: "Leído",
  processed: "Procesado",
  discarded: "Descartado",
};

function formatFechaHora(iso: string) {
  const d = new Date(iso);
  return `${d.toLocaleDateString("es-AR")} ${d.toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

function formatBytes(bytes: number | null | undefined) {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function MailDetalle({
  mail,
  historial,
  attachments,
  attachmentUrls,
  allAreas,
  solicitudesVinculadas,
  tiposGestion,
}: {
  mail: InboxEmailDetail;
  historial: AuditLogEvent[];
  attachments: InboxAttachment[];
  attachmentUrls: Record<string, string>;
  allAreas: { id: string; name: string }[];
  solicitudesVinculadas: SolicitudVinculable[];
  tiposGestion: { id: string; slug: string; name: string }[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionOk, setActionOk] = useState<string | null>(null);

  // Derivar
  const [areaTarget, setAreaTarget] = useState("");
  const [motivoDerivar, setMotivoDerivar] = useState("");

  // Nota
  const [nota, setNota] = useState("");
  const [showNota, setShowNota] = useState(false);

  // Descartar
  const [showDescartar, setShowDescartar] = useState(false);
  const [motivoDescartar, setMotivoDescartar] = useState("");

  // Modal convertir / vincular
  const [showConvertir, setShowConvertir] = useState(false);
  const [showVincular, setShowVincular] = useState(false);

  function runAction<T extends { ok: true } | { ok: false; error: string }>(
    fn: () => Promise<T>,
    onSuccess?: (r: Extract<T, { ok: true }>) => void,
  ) {
    setActionError(null);
    setActionOk(null);
    startTransition(async () => {
      const r = await fn();
      if (r.ok) {
        onSuccess?.(r as Extract<T, { ok: true }>);
        router.refresh();
      } else {
        setActionError(r.error);
      }
    });
  }

  const fromDisplay = mail.from_name
    ? `${mail.from_name} <${mail.from_email}>`
    : mail.from_email;

  const totalSize = attachments.reduce(
    (sum, a) => sum + (a.size_bytes ?? 0),
    0,
  );

  const otherAreas = allAreas.filter((a) => a.id !== mail.current_area_id);

  return (
    <div className="p-8">
      {/* Breadcrumb */}
      <div className="mb-4">
        <p className="text-[11px] text-muted-foreground">
          <Link href="/bandeja/mails" className="hover:underline">
            Bandeja de mails
          </Link>{" "}
          / Mail
        </p>
        <div className="flex items-center gap-3 mt-1">
          <h1 className="text-xl font-semibold text-foreground line-clamp-1">
            {mail.subject}
          </h1>
          <span
            className={cn(
              "inline-flex items-center px-2 py-0.5 rounded-md text-[11.5px] font-medium border",
              STATUS_STYLES[mail.status],
            )}
          >
            {STATUS_LABEL[mail.status]}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-5">
        {/* Columna principal */}
        <div className="col-span-2 space-y-4">
          {/* Datos */}
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="px-5 py-3.5 border-b border-border/60 bg-muted/20">
              <h2 className="text-[13px] font-semibold text-foreground">
                Datos del mail
              </h2>
            </div>
            <div className="p-5 grid grid-cols-2 gap-x-8 gap-y-5">
              <Field label="De">{fromDisplay}</Field>
              <Field label="Recibido">{formatFechaHora(mail.received_at)}</Field>
              <Field label="Para">
                {mail.to_emails && mail.to_emails.length > 0
                  ? mail.to_emails.join(", ")
                  : "—"}
              </Field>
              <Field label="Área actual">
                {mail.current_area_name ?? "Sin asignar"}
              </Field>
              <Field label="Subido por">
                {mail.source === "imap" ? "Sistema · IMAP" : mail.uploaded_by ?? "—"}
              </Field>
              <Field label="Adjuntos">
                {attachments.length === 0
                  ? "Ninguno"
                  : `${attachments.length} · ${formatBytes(totalSize)}`}
              </Field>
            </div>
          </div>

          {/* Cuerpo */}
          {(mail.body_text || mail.body_html) && (
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              <div className="px-5 py-3.5 border-b border-border/60 bg-muted/20">
                <h2 className="text-[13px] font-semibold text-foreground">
                  Cuerpo del mail
                </h2>
              </div>
              <div className="p-5">
                {mail.body_text ? (
                  <pre className="text-[13px] text-foreground whitespace-pre-wrap font-sans leading-relaxed">
                    {mail.body_text}
                  </pre>
                ) : (
                  <p className="text-[13px] text-muted-foreground italic">
                    (Solo cuerpo HTML — preview no disponible)
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Adjuntos */}
          {attachments.length > 0 && (
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              <div className="px-5 py-3.5 border-b border-border/60 bg-muted/20">
                <h2 className="text-[13px] font-semibold text-foreground">
                  Adjuntos ({attachments.length})
                </h2>
              </div>
              <div className="p-5">
                <AttachmentThumbsGrid
                  attachments={attachments}
                  urls={attachmentUrls}
                />
              </div>
            </div>
          )}

          {/* Trazabilidad */}
          <MailTrazabilidad historial={historial} />

          {/* Nota inline (escribir) */}
          <div className="bg-card rounded-xl border border-border p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[13px] font-semibold text-foreground">
                Agregar nota
              </h2>
              {!showNota && (
                <button
                  onClick={() => setShowNota(true)}
                  className="text-[12px] font-medium text-primary hover:text-primary/70"
                >
                  + Nueva nota
                </button>
              )}
            </div>
            {showNota && (
              <>
                <textarea
                  value={nota}
                  onChange={(e) => setNota(e.target.value)}
                  placeholder="Escribí una nota interna sobre este mail…"
                  className="w-full text-[13px] border border-border rounded-lg p-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-ring/50 bg-background"
                  rows={3}
                />
                <div className="flex justify-end gap-2 mt-2">
                  <button
                    onClick={() => {
                      setShowNota(false);
                      setNota("");
                    }}
                    disabled={isPending}
                    className="text-[12px] text-muted-foreground hover:text-foreground disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() =>
                      runAction(
                        () => agregarNotaMail(mail.id, nota),
                        () => {
                          setShowNota(false);
                          setNota("");
                          setActionOk("Nota agregada");
                        },
                      )
                    }
                    disabled={isPending || !nota.trim()}
                    className="text-[12px] font-semibold text-primary hover:text-primary/70 disabled:opacity-50"
                  >
                    {isPending ? "Guardando…" : "Guardar nota"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="col-span-1 space-y-4">
          {actionError && (
            <div className="bg-destructive/10 border border-destructive/30 rounded-lg px-3 py-2 text-[12.5px] text-destructive">
              {actionError}
            </div>
          )}
          {actionOk && !actionError && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 text-[12.5px] text-emerald-700">
              {actionOk}
            </div>
          )}

          {/* Convertir / sub-acciones */}
          <div className="bg-card rounded-xl border border-border p-5">
            <h3 className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Acciones
            </h3>
            <button
              onClick={() => setShowConvertir(true)}
              disabled={mail.status === "discarded" || attachments.length === 0}
              title={
                attachments.length === 0
                  ? "El mail no tiene adjuntos para convertir"
                  : undefined
              }
              className="w-full inline-flex items-center justify-center gap-2 px-3 py-2.5 bg-primary text-primary-foreground text-[13px] font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
            >
              → Convertir a solicitud
            </button>
            <div className="mt-3 pt-3 border-t border-border/60 space-y-1.5">
              <SubAction
                onClick={() => setShowVincular(true)}
                disabled={mail.status === "discarded"}
                label="↳ Vincular a solicitud existente"
              />
              {mail.status === "unprocessed" && (
                <SubAction
                  onClick={() => runAction(() => marcarMailLeido(mail.id))}
                  disabled={isPending}
                  label="✓ Marcar como leído"
                />
              )}
              {mail.status !== "discarded" && mail.status !== "processed" && (
                <SubAction
                  onClick={() => setShowDescartar(true)}
                  disabled={isPending}
                  label="✕ Descartar mail"
                  destructive
                />
              )}
            </div>
          </div>

          {showDescartar && (
            <div className="bg-card rounded-xl border border-destructive/40 p-4">
              <h3 className="text-[12.5px] font-semibold text-destructive mb-2">
                Descartar mail
              </h3>
              <input
                value={motivoDescartar}
                onChange={(e) => setMotivoDescartar(e.target.value)}
                placeholder="Motivo (obligatorio)"
                className="w-full text-[12.5px] border border-border rounded-md px-2.5 py-1.5 bg-background focus:outline-none focus:ring-2 focus:ring-ring/50"
              />
              <div className="flex justify-end gap-2 mt-2.5">
                <button
                  onClick={() => {
                    setShowDescartar(false);
                    setMotivoDescartar("");
                  }}
                  className="text-[12px] text-muted-foreground hover:text-foreground"
                >
                  Cancelar
                </button>
                <button
                  onClick={() =>
                    runAction(
                      () => descartarMail(mail.id, motivoDescartar),
                      () => {
                        setShowDescartar(false);
                        setMotivoDescartar("");
                      },
                    )
                  }
                  disabled={isPending || !motivoDescartar.trim()}
                  className="text-[12px] font-semibold text-destructive hover:text-destructive/70 disabled:opacity-50"
                >
                  {isPending ? "Descartando…" : "Confirmar descarte"}
                </button>
              </div>
            </div>
          )}

          {/* Derivar a otra área */}
          <div className="bg-card rounded-xl border border-border p-5">
            <h3 className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Enviar a otra área
            </h3>
            <p className="text-[11.5px] text-muted-foreground mb-3">
              El mail queda en la bandeja del área destino y se registra en la
              trazabilidad.
            </p>
            <select
              value={areaTarget}
              onChange={(e) => setAreaTarget(e.target.value)}
              className="w-full text-[12.5px] border border-border rounded-md px-2.5 py-1.5 bg-background focus:outline-none focus:ring-2 focus:ring-ring/50"
            >
              <option value="">— Elegí un área —</option>
              {otherAreas.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
            <input
              value={motivoDerivar}
              onChange={(e) => setMotivoDerivar(e.target.value)}
              placeholder="Motivo (opcional)"
              className="mt-2 w-full text-[12.5px] border border-border rounded-md px-2.5 py-1.5 bg-background focus:outline-none focus:ring-2 focus:ring-ring/50"
            />
            <button
              onClick={() =>
                runAction(
                  () => derivarMailAArea(mail.id, areaTarget, motivoDerivar || undefined),
                  () => {
                    setAreaTarget("");
                    setMotivoDerivar("");
                  },
                )
              }
              disabled={isPending || !areaTarget}
              className="mt-3 w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-foreground text-background text-[12.5px] font-semibold rounded-md hover:opacity-90 disabled:opacity-40"
            >
              {isPending ? "Enviando…" : "Enviar"}
            </button>
          </div>

          {/* Solicitudes vinculadas */}
          <div className="bg-card rounded-xl border border-border p-5">
            <h3 className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Solicitudes vinculadas
            </h3>
            {solicitudesVinculadas.length === 0 ? (
              <p className="text-[12.5px] text-muted-foreground/70">
                Aún no se generó ninguna solicitud a partir de este mail.
              </p>
            ) : (
              <ul className="space-y-2">
                {solicitudesVinculadas.map((s) => (
                  <li key={s.id}>
                    <Link
                      href={`/solicitudes/${s.id}`}
                      className="block bg-muted/30 hover:bg-muted/60 rounded-md px-3 py-2 transition-colors"
                    >
                      <p className="font-mono text-[12px] font-semibold text-foreground">
                        {s.numero_expediente ?? "(sin nro)"}
                      </p>
                      <p className="text-[12px] text-muted-foreground line-clamp-1 mt-0.5">
                        {s.concepto ?? "(sin concepto)"}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Fechas */}
          <div className="bg-card rounded-xl border border-border p-5">
            <h3 className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Fechas
            </h3>
            <div className="space-y-2 text-[12.5px]">
              <FechaItem label="Recibido" value={formatFechaHora(mail.received_at)} />
              <FechaItem label="Ingresado a bandeja" value={formatFechaHora(mail.created_at)} />
              <FechaItem label="Última actividad" value={formatFechaHora(mail.updated_at)} />
            </div>
          </div>
        </div>
      </div>

      {showConvertir && (
        <ConvertirModalLazy
          mail={mail}
          attachments={attachments}
          tiposGestion={tiposGestion}
          onClose={() => setShowConvertir(false)}
        />
      )}
      {showVincular && (
        <VincularModalLazy
          mail={mail}
          attachments={attachments}
          onClose={() => setShowVincular(false)}
        />
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] text-muted-foreground uppercase tracking-wide font-medium mb-1">
        {label}
      </p>
      <p className="text-[13px] text-foreground break-words">{children}</p>
    </div>
  );
}

function FechaItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-foreground tabular-nums">{value}</span>
    </div>
  );
}

function SubAction({
  onClick,
  label,
  disabled,
  destructive,
}: {
  onClick: () => void;
  label: string;
  disabled?: boolean;
  destructive?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "w-full text-left px-2.5 py-1.5 text-[12.5px] rounded-md hover:bg-muted/50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed",
        destructive
          ? "text-destructive hover:bg-destructive/10"
          : "text-foreground",
      )}
    >
      {label}
    </button>
  );
}

// Stubs — implementados en Sprint 5 y 6
import { ConvertirModal } from "./convertir-modal";
import { VincularModal } from "./vincular-modal";

function ConvertirModalLazy(props: React.ComponentProps<typeof ConvertirModal>) {
  return <ConvertirModal {...props} />;
}
function VincularModalLazy(props: React.ComponentProps<typeof VincularModal>) {
  return <VincularModal {...props} />;
}
