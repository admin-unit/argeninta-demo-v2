import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentProfileWithContext, getSolicitudes } from "@/lib/data";
import { EstadoBadge } from "@/components/solicitudes/estado-badge";
import { type EstadoSolicitud } from "@/types";

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

export default async function FacturasMiOrganismo() {
  const ctx = await getCurrentProfileWithContext();
  if (!ctx.profile) redirect("/login");

  const org = ctx.primary_organism;
  if (!org) {
    return (
      <div className="p-8 max-w-2xl">
        <h1 className="text-xl font-semibold text-foreground mb-2">Facturas</h1>
        <p className="text-sm text-muted-foreground">
          No estás asignado a ningún organismo todavía.
        </p>
      </div>
    );
  }

  const facturas = await getSolicitudes({
    organism_id: org.id,
    tipo_slug: "pago_factura",
    limit: 200,
  });

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
            / Facturas
          </p>
          <h1 className="text-xl font-semibold text-foreground">
            Facturas — {org.short_name ?? org.name}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {facturas.length} facturas registradas
          </p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left px-4 py-3 text-[10.5px] font-semibold text-muted-foreground uppercase tracking-wider">
                Expediente
              </th>
              <th className="text-left px-4 py-3 text-[10.5px] font-semibold text-muted-foreground uppercase tracking-wider">
                Concepto
              </th>
              <th className="text-left px-4 py-3 text-[10.5px] font-semibold text-muted-foreground uppercase tracking-wider">
                Solicitante
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
            {facturas.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground text-sm">
                  Sin facturas registradas para este organismo.
                </td>
              </tr>
            ) : (
              facturas.map((s) => (
                <tr key={s.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <Link
                      href={`/solicitudes/${s.id}`}
                      className="font-mono text-[11px] font-semibold text-muted-foreground hover:underline"
                    >
                      {s.numero_expediente ?? "(sin nro)"}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-foreground max-w-[260px]">
                    <Link
                      href={`/solicitudes/${s.id}`}
                      className="hover:underline line-clamp-1"
                    >
                      {s.concepto ?? "(sin concepto)"}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-[12px]">
                    {s.created_by_name ?? "—"}
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
