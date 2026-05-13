import { getAllConvenios } from "@/lib/data";

export const dynamic = "force-dynamic";

function formatBalance(balance: number | null, plan: string | null) {
  if (balance == null) return "—";
  const fmt = new Intl.NumberFormat("es-AR", { minimumFractionDigits: 0 });
  // Convenios pueden tener balance en distintas monedas según plan_name
  const isUsd = plan?.toLowerCase().includes("intl") || plan?.toLowerCase().includes("usd");
  return `${isUsd ? "USD " : "$"}${fmt.format(balance)}`;
}

export default async function Convenios({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const all = await getAllConvenios(500);
  const search = q.toLowerCase();
  const convenios = q
    ? all.filter(
        (c) =>
          (c.code ?? "").toLowerCase().includes(search) ||
          (c.name ?? "").toLowerCase().includes(search) ||
          (c.fuente_financiamiento ?? "").toLowerCase().includes(search)
      )
    : all;

  return (
    <div className="p-6">
      <div className="flex items-end justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Convenios</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {convenios.length} de {all.length} convenios — mostrados desde Odoo (cache)
          </p>
        </div>
        <form method="GET" action="/convenios" className="relative">
          <input
            name="q"
            defaultValue={q}
            placeholder="Buscar por código, nombre, fuente…"
            className="pl-3 pr-4 py-1.5 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring/50 w-80 bg-card placeholder:text-muted-foreground/50"
          />
        </form>
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
                Organismo
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
            {convenios.slice(0, 200).map((c) => {
              const org = Array.isArray(c.organism) ? c.organism[0] : c.organism;
              const analytic = Array.isArray(c.analytic) ? c.analytic[0] : c.analytic;
              return (
                <tr
                  key={`${c.odoo_analytic_account_id}`}
                  className="hover:bg-muted/30 transition-colors"
                >
                  <td className="px-4 py-3 font-mono text-[11px] text-muted-foreground">
                    {c.code ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-foreground font-medium max-w-[420px]">
                    <p className="line-clamp-1">{c.display_alias ?? c.name ?? "—"}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-[11.5px] font-semibold text-muted-foreground">
                      {org?.short_name ?? org?.name ?? "—"}
                    </span>
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
                    {formatBalance(Number(analytic?.balance), analytic?.plan_name ?? null)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {convenios.length > 200 && (
        <p className="mt-3 text-[12.5px] text-muted-foreground">
          Mostrando primeros 200 — refiná la búsqueda para ver más.
        </p>
      )}
    </div>
  );
}
