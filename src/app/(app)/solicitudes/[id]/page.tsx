import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getSolicitudById,
  getAuditLogForSolicitud,
  getCurrentProfileWithContext,
  AREAS_INTERNACIONAL,
} from "@/lib/data";
import { EstadoBadge } from "@/components/solicitudes/estado-badge";
import { SolicitudDetalleArgeninta } from "@/components/solicitudes/solicitud-detalle-argeninta";
import { TIPO_LABEL, type EstadoSolicitud, type TipoGestion } from "@/types";

export const dynamic = "force-dynamic";

const TIPOS_CON_FIRMA: TipoGestion[] = ["pago_factura", "contrato", "anticipo_rendicion"];

const FIRMANTES_DEMO = [
  {
    nombre: "René Castro",
    cargo: "Director — Fundación Argeninta",
    estado: "pendiente" as const,
  },
];

function formatImporte(importe: number | null, moneda: string | null) {
  if (importe == null) return "—";
  const fmt = new Intl.NumberFormat("es-AR", { minimumFractionDigits: 0 });
  return `${moneda === "ARS" || !moneda ? "$" : moneda + " "}${fmt.format(importe)}`;
}

export default async function SolicitudDetalle({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [solicitud, auditLog, ctx] = await Promise.all([
    getSolicitudById(id),
    getAuditLogForSolicitud(id),
    getCurrentProfileWithContext(),
  ]);
  if (!solicitud) notFound();

  const isArgeninta =
    ctx.profile?.user_type === "interno" || ctx.profile?.is_super_admin === true;

  const isIntl =
    solicitud.current_area_id != null &&
    (AREAS_INTERNACIONAL as readonly string[]).includes(solicitud.current_area_id);
  const bandejaPath = isIntl ? "bandeja-internacional" : "bandeja-nacional";
  const necesitaFirma = TIPOS_CON_FIRMA.includes(solicitud.tipo_slug as TipoGestion);
  const tipoLabel =
    solicitud.tipo_slug && solicitud.tipo_slug in TIPO_LABEL
      ? TIPO_LABEL[solicitud.tipo_slug as TipoGestion]
      : solicitud.tipo_name ?? "—";

  // Datos extraídos del data jsonb (variable según tipo)
  const data = (solicitud.data as Record<string, unknown>) ?? {};
  const beneficiario =
    (data.beneficiario_nombre as string) ||
    (data.proveedor_nombre as string) ||
    (data.contratado_nombre as string) ||
    "—";

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-[13px] text-muted-foreground mb-6">
        <Link
          href={isArgeninta ? `/${bandejaPath}` : "/mis-solicitudes"}
          className="hover:text-foreground transition-colors"
        >
          {isArgeninta
            ? isIntl
              ? "Bandeja Internacional"
              : "Bandeja Nacional"
            : "Mis solicitudes"}
        </Link>
        <svg
          className="w-3.5 h-3.5 text-muted-foreground/40"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
        <span className="font-mono text-foreground font-semibold">
          {solicitud.numero_expediente ?? "(sin nro)"}
        </span>
      </div>

      {/* Header */}
      <div className="mb-7">
        <div className="flex items-center gap-3 mb-2">
          <span className="font-mono text-[12px] font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
            {solicitud.numero_expediente ?? "—"}
          </span>
          <EstadoBadge estado={solicitud.status as EstadoSolicitud} />
          {isIntl && (
            <span className="inline-flex items-center gap-1 text-[11.5px] font-medium text-violet-600 bg-violet-50 border border-violet-200 px-2 py-0.5 rounded-full">
              Internacional
            </span>
          )}
          {solicitud.urgency === "urgente" && (
            <span className="inline-flex items-center gap-1 text-[11.5px] font-medium text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
              Urgente
            </span>
          )}
          {solicitud.odoo_move_id && (
            <span className="text-[11.5px] text-muted-foreground bg-muted px-2 py-0.5 rounded-md font-mono border border-border/60">
              Odoo #{solicitud.odoo_move_id}
            </span>
          )}
        </div>
        <h1 className="text-xl font-semibold text-foreground leading-snug max-w-2xl">
          {solicitud.concepto ?? "(sin concepto)"}
        </h1>
      </div>

      {/* Vista para externos (solicitante) — simplificada */}
      {!isArgeninta && (
        <div className="grid grid-cols-3 gap-5">
          <div className="col-span-2 space-y-4">
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              <div className="px-5 py-3.5 border-b border-border/60 bg-muted/20">
                <h2 className="text-[13px] font-semibold text-foreground">
                  Datos de la solicitud
                </h2>
              </div>
              <div className="p-5 grid grid-cols-2 gap-x-8 gap-y-5">
                <Field label="Tipo de gestión">{tipoLabel}</Field>
                <Field label="Organismo">{solicitud.organism_name ?? "—"}</Field>
                <Field label="Beneficiario">{beneficiario}</Field>
                <Field label="Área actual">
                  {solicitud.current_area_name ?? "Pendiente de ruteo"}
                </Field>
                <Field label="Importe">
                  <span className="text-[22px] font-bold text-foreground tabular-nums leading-none">
                    {formatImporte(Number(solicitud.importe), solicitud.moneda)}
                  </span>
                </Field>
                <Field label="Solicitante">{solicitud.created_by_name ?? "—"}</Field>
              </div>
            </div>

            <div className="bg-card rounded-xl border border-border p-5">
              <p className="text-[11.5px] text-muted-foreground mb-2 uppercase tracking-wide font-medium">
                Estado actual
              </p>
              <EstadoBadge estado={solicitud.status as EstadoSolicitud} />
              <p className="text-[12.5px] text-muted-foreground mt-3">
                Tu solicitud fue recibida y está siendo procesada por el equipo de
                Argeninta. Te notificaremos cuando haya novedades.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-card rounded-xl border border-border p-4">
              <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-3">
                Fechas
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-[11.5px] text-muted-foreground mb-0.5">
                    Solicitud creada
                  </p>
                  <p className="text-[13px] font-medium text-foreground">
                    {new Date(solicitud.created_at).toLocaleDateString("es-AR", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-[11.5px] text-muted-foreground mb-0.5">
                    Última actualización
                  </p>
                  <p className="text-[13px] font-medium text-foreground">
                    {new Date(solicitud.updated_at).toLocaleDateString("es-AR", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Vista para internos (Argeninta) — completa con firma + trazabilidad */}
      {isArgeninta && (
        <SolicitudDetalleArgeninta
          solicitud={solicitud}
          historial={auditLog}
          beneficiario={beneficiario}
          firmantesIniciales={necesitaFirma ? FIRMANTES_DEMO : []}
          necesitaFirma={necesitaFirma}
        />
      )}
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
