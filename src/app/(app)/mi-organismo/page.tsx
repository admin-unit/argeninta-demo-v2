import Link from "next/link";
import { redirect } from "next/navigation";
import {
  getCurrentProfileWithContext,
  getConveniosForOrganism,
  getResumenForOrganism,
} from "@/lib/data";

export const dynamic = "force-dynamic";

function formatBalance(balance: number | null, plan: string | null) {
  if (balance == null) return "—";
  const fmt = new Intl.NumberFormat("es-AR", { minimumFractionDigits: 0 });
  const isUsd =
    plan?.toLowerCase().includes("intl") || plan?.toLowerCase().includes("usd");
  return `${isUsd ? "USD " : "$"}${fmt.format(balance)}`;
}

export default async function MiOrganismo() {
  const ctx = await getCurrentProfileWithContext();
  if (!ctx.profile) redirect("/login");

  if (!ctx.primary_organism) {
    return (
      <div className="p-8 max-w-2xl">
        <h1 className="text-xl font-semibold text-foreground mb-2">Mi Organismo</h1>
        <p className="text-sm text-muted-foreground">
          Tu cuenta todavía no está asignada a ningún organismo. Pedile a un admin que te
          agregue al organismo correspondiente desde Settings → Organismos.
        </p>
      </div>
    );
  }

  const org = ctx.primary_organism;
  const [convenios, resumen] = await Promise.all([
    getConveniosForOrganism(org.id),
    getResumenForOrganism(org.id),
  ]);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-[11px] text-muted-foreground mb-0.5">
            <Link href="/dashboard" className="hover:underline">
              Inicio
            </Link>{" "}
            / Mi Organismo
          </p>
          <h1 className="text-xl font-semibold text-foreground">
            Convenios — {org.short_name ?? org.name}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {convenios.length} convenios visibles · saldo total:{" "}
            <span className="font-semibold tabular-nums">
              ${new Intl.NumberFormat("es-AR").format(resumen.totalSaldo)}
            </span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3 mb-6">
        <Stat label="Saldo total" value={`$${new Intl.NumberFormat("es-AR").format(resumen.totalSaldo)}`} />
        <Stat label="En proceso" value={resumen.enProceso} />
        <Stat label="Completadas" value={resumen.completadas} />
        <Stat
          label="Pendiente de pago"
          value={`$${new Intl.NumberFormat("es-AR").format(resumen.pendienteSaldo)}`}
        />
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left px-4 py-3 text-[10.5px] font-semibold text-muted-foreground uppercase tracking-wider">
                Código
              </th>
              <th className="text-left px-4 py-3 text-[10.5px] font-semibold text-muted-foreground uppercase tracking-wider">
                Nombre
              </th>
              <th className="text-left px-4 py-3 text-[10.5px] font-semibold text-muted-foreground uppercase tracking-wider">
                Fuente
              </th>
              <th className="text-right px-4 py-3 text-[10.5px] font-semibold text-muted-foreground uppercase tracking-wider">
                Saldo Odoo
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {convenios.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-12 text-center text-muted-foreground text-sm">
                  Este organismo aún no tiene convenios visibles configurados.
                </td>
              </tr>
            ) : (
              convenios.slice(0, 100).map((c) => {
                const analytic = Array.isArray(c.analytic) ? c.analytic[0] : c.analytic;
                return (
                  <tr
                    key={`${c.odoo_analytic_account_id}`}
                    className="hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-4 py-3 font-mono text-[11px] text-muted-foreground">
                      {c.code ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-foreground font-medium max-w-[480px]">
                      <p className="line-clamp-1">{c.display_alias ?? c.name ?? "—"}</p>
                    </td>
                    <td className="px-4 py-3">
                      {c.fuente_financiamiento ? (
                        <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 border border-violet-200">
                          {c.fuente_financiamiento}
                        </span>
                      ) : (
                        <span className="text-muted-foreground/50 text-[12px]">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-foreground tabular-nums">
                      {formatBalance(Number(analytic?.balance), null)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {convenios.length > 100 && (
        <p className="mt-3 text-[12.5px] text-muted-foreground">
          Mostrando primeros 100 de {convenios.length}.
        </p>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <p className="text-[10.5px] text-muted-foreground uppercase tracking-wider font-medium">
        {label}
      </p>
      <p className="text-xl font-bold text-foreground mt-1 tabular-nums">{value}</p>
    </div>
  );
}
