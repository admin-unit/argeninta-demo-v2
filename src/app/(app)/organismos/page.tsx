import { getAllOrganisms, getSolicitudCountByOrganism } from "@/lib/data";

export const dynamic = "force-dynamic";

/** Organismos considerados "internacionales" (los cargados por Área Internacional) */
const INTERNACIONALES = new Set(["FAO", "BID", "FONTAGRO"]);

export default async function Organismos() {
  const [organisms, counts] = await Promise.all([
    getAllOrganisms(),
    getSolicitudCountByOrganism(),
  ]);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-foreground">Organismos</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {organisms.length} organismos registrados
        </p>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left px-4 py-3 text-[10.5px] font-semibold text-muted-foreground uppercase tracking-wider">
                Organismo
              </th>
              <th className="text-left px-4 py-3 text-[10.5px] font-semibold text-muted-foreground uppercase tracking-wider">
                Tipo
              </th>
              <th className="text-left px-4 py-3 text-[10.5px] font-semibold text-muted-foreground uppercase tracking-wider">
                CUIT
              </th>
              <th className="text-left px-4 py-3 text-[10.5px] font-semibold text-muted-foreground uppercase tracking-wider">
                Dominio
              </th>
              <th className="text-right px-4 py-3 text-[10.5px] font-semibold text-muted-foreground uppercase tracking-wider">
                Sol. activas
              </th>
              <th className="text-right px-4 py-3 text-[10.5px] font-semibold text-muted-foreground uppercase tracking-wider">
                Total
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {organisms.map((org) => {
              const c = counts.get(org.id) || { total: 0, activas: 0 };
              const isInternacional = INTERNACIONALES.has(org.short_name ?? "");
              return (
                <tr key={org.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="text-primary text-[11px] font-bold">
                          {(org.short_name ?? org.name)[0]}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground leading-tight">
                          {org.short_name ?? org.name}
                        </p>
                        <p className="text-[11.5px] text-muted-foreground leading-tight truncate max-w-[320px]">
                          {org.name}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                        isInternacional
                          ? "bg-violet-50 text-violet-700 border border-violet-200"
                          : "bg-blue-50 text-blue-700 border border-blue-200"
                      }`}
                    >
                      {isInternacional ? "Internacional" : "Nacional"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-[12px] font-mono">
                    {org.cuit ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-[12px]">
                    {org.email_domain ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {c.activas > 0 ? (
                      <span className="font-semibold text-amber-600 tabular-nums">
                        {c.activas}
                      </span>
                    ) : (
                      <span className="text-muted-foreground/40">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right text-muted-foreground tabular-nums">
                    {c.total || "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
