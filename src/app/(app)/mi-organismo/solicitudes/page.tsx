import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentProfileWithContext, getSolicitudes } from "@/lib/data";
import { EstadoBadge } from "@/components/solicitudes/estado-badge";
import { TIPO_LABEL, type EstadoSolicitud, type TipoGestion } from "@/types";

export const dynamic = "force-dynamic";

function formatImporte(importe: number | null, moneda: string | null) {
  if (importe == null) return "—";
  const fmt = new Intl.NumberFormat("es-AR", { minimumFractionDigits: 0 });
  return `${moneda === "ARS" || !moneda ? "$" : moneda + " "}${fmt.format(importe)}`;
}

function formatFecha(fecha: string) {
  return new Date(fecha).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default async function SolicitudesMiOrganismo() {
  const ctx = await getCurrentProfileWithContext();
  if (!ctx.profile) redirect("/login");

  const org = ctx.primary_organism;
  if (!org) {
    return (
      <div className="p-8 max-w-2xl">
        <h1 className="text-xl font-semibold text-foreground mb-2">Solicitudes</h1>
        <p className="text-sm text-muted-foreground">
          No estás asignado a ningún organismo todavía.
        </p>
      </div>
    );
  }

  const solicitudes = await getSolicitudes({ organism_id: org.id, limit: 200 });

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-[11px] text-muted-foreground mb-0.5">
            <Link href="/dashboard" className="hover:underline">
              Inicio
            </Link>{" "}
            /{" "}
            <Link href="/mi-organismo" className="hover:underline">
              Mi Organismo
            </Link>{" "}
            / Solicitudes
          </p>
          <h1 className="text-xl font-semibold text-foreground">
            Solicitudes — {org.short_name ?? org.name}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {solicitudes.length} solicitudes
          </p>
        </div>
        <Link
          href="/solicitudes/nueva?bandeja=nacional"
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:opacity-90 transition-opacity"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          Nueva solicitud
        </Link>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left px-4 py-3 text-[10.5px] font-semibold text-muted-foreground uppercase tracking-wider">
                Expediente
              </th>
              <th className="text-left px-4 py-3 text-[10.5px] font-semibold text-muted-foreground uppercase tracking-wider">
                Tipo
              </th>
              <th className="text-left px-4 py-3 text-[10.5px] font-semibold text-muted-foreground uppercase tracking-wider">
                Concepto
              </th>
              <th className="text-left px-4 py-3 text-[10.5px] font-semibold text-muted-foreground uppercase tracking-wider">
                Fecha
              </th>
              <th className="text-left px-4 py-3 text-[10.5px] font-semibold text-muted-foreground uppercase tracking-wider">
                Estado
              </th>
              <th className="text-right px-4 py-3 text-[10.5px] font-semibold text-muted-foreground uppercase tracking-wider">
                Importe
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {solicitudes.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-muted-foreground text-sm">
                  Tu organismo aún no tiene solicitudes.
                </td>
              </tr>
            ) : (
              solicitudes.map((s) => (
                <tr key={s.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <Link
                      href={`/solicitudes/${s.id}`}
                      className="font-mono text-[11px] font-semibold text-muted-foreground hover:underline"
                    >
                      {s.numero_expediente ?? "(sin nro)"}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-[12px]">
                    {s.tipo_slug ? TIPO_LABEL[s.tipo_slug as TipoGestion] : "—"}
                  </td>
                  <td className="px-4 py-3 text-foreground max-w-[280px]">
                    <Link
                      href={`/solicitudes/${s.id}`}
                      className="hover:underline line-clamp-1"
                    >
                      {s.concepto ?? "(sin concepto)"}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-[12px]">
                    {formatFecha(s.created_at)}
                  </td>
                  <td className="px-4 py-3">
                    <EstadoBadge estado={s.status as EstadoSolicitud} />
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-foreground tabular-nums">
                    {formatImporte(Number(s.importe), s.moneda)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
