import Link from "next/link";
import { redirect } from "next/navigation";
import {
  getCurrentProfileWithContext,
  getConveniosForOrganism,
  getResumenForOrganism,
} from "@/lib/data";

export const dynamic = "force-dynamic";

type Analytic = {
  balance: number | null;
  balance_devengado: number | null;
  balance_financiero: number | null;
  plan_name: string | null;
  parent_odoo_id: number | null;
  hierarchy_path: string | null;
  hierarchy_level: number | null;
};

type Convenio = {
  odoo_analytic_account_id: number;
  code: string | null;
  name: string | null;
  display_alias: string | null;
  fuente_financiamiento: string | null;
  analytic: Analytic | Analytic[] | null;
};

function normalizeAnalytic(a: Analytic | Analytic[] | null): Analytic | null {
  if (!a) return null;
  return Array.isArray(a) ? (a[0] ?? null) : a;
}

function fmt(n: number | null | undefined, currency = "ARS") {
  if (n == null) return "—";
  const symbol = currency === "USD" ? "USD " : "$";
  return `${symbol}${new Intl.NumberFormat("es-AR", { minimumFractionDigits: 0 }).format(n)}`;
}

export default async function MiOrganismo({
  searchParams,
}: {
  searchParams: Promise<{ fuente?: string; plan?: string; q?: string }>;
}) {
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
  const sp = await searchParams;
  const [conveniosRaw, resumen] = await Promise.all([
    getConveniosForOrganism(org.id),
    getResumenForOrganism(org.id),
  ]);
  const convenios = conveniosRaw as unknown as Convenio[];

  // Opciones de filtros
  const fuentes = Array.from(
    new Set(convenios.map((c) => c.fuente_financiamiento).filter(Boolean))
  ) as string[];
  const planes = Array.from(
    new Set(
      convenios
        .map((c) => normalizeAnalytic(c.analytic)?.plan_name)
        .filter(Boolean)
    )
  ) as string[];

  // Aplicar filtros
  const q = (sp.q ?? "").trim().toLowerCase();
  const filtered = convenios.filter((c) => {
    const a = normalizeAnalytic(c.analytic);
    if (sp.fuente && c.fuente_financiamiento !== sp.fuente) return false;
    if (sp.plan && a?.plan_name !== sp.plan) return false;
    if (q) {
      const hay = `${c.code ?? ""} ${c.name ?? ""} ${c.display_alias ?? ""}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  // Ordenar por hierarchy_path para que padres queden antes que hijos
  filtered.sort((a, b) => {
    const pa = normalizeAnalytic(a.analytic)?.hierarchy_path ?? "";
    const pb = normalizeAnalytic(b.analytic)?.hierarchy_path ?? "";
    if (pa && pb) return pa.localeCompare(pb);
    return (a.name ?? "").localeCompare(b.name ?? "");
  });

  // Stats
  const totalDevengado = filtered.reduce((acc, c) => {
    const a = normalizeAnalytic(c.analytic);
    return acc + Number(a?.balance_devengado ?? a?.balance ?? 0);
  }, 0);
  const totalFinanciero = filtered.reduce((acc, c) => {
    const a = normalizeAnalytic(c.analytic);
    return acc + Number(a?.balance_financiero ?? 0);
  }, 0);

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
            {filtered.length} de {convenios.length} convenios · saldo devengado total:{" "}
            <span className="font-semibold tabular-nums">{fmt(totalDevengado)}</span>
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        <Stat
          label="Saldo devengado"
          value={fmt(totalDevengado)}
          hint="Comprometido en facturas posted"
        />
        <Stat
          label="Saldo financiero"
          value={fmt(totalFinanciero)}
          hint="Pagos efectivamente conciliados"
        />
        <Stat label="En proceso" value={resumen.enProceso} />
        <Stat label="Completadas" value={resumen.completadas} />
      </div>

      {/* Filtros (GET form, sin client component) */}
      <form
        className="flex flex-wrap gap-2 items-center mb-4 bg-card border border-border rounded-xl px-3 py-2"
        method="GET"
      >
        <input
          type="text"
          name="q"
          defaultValue={sp.q ?? ""}
          placeholder="Buscar código o nombre…"
          className="flex-1 min-w-[200px] px-3 py-1.5 text-[13px] border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <select
          name="fuente"
          defaultValue={sp.fuente ?? ""}
          className="text-[13px] border border-input rounded-lg px-2 py-1.5 bg-background"
        >
          <option value="">Todas las fuentes</option>
          {fuentes.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>
        <select
          name="plan"
          defaultValue={sp.plan ?? ""}
          className="text-[13px] border border-input rounded-lg px-2 py-1.5 bg-background"
        >
          <option value="">Todos los planes</option>
          {planes.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="text-[13px] bg-primary text-primary-foreground rounded-lg px-3 py-1.5 hover:opacity-90"
        >
          Aplicar
        </button>
        {(sp.q || sp.fuente || sp.plan) && (
          <Link
            href="/mi-organismo"
            className="text-[12.5px] text-muted-foreground hover:text-foreground underline"
          >
            Limpiar
          </Link>
        )}
      </form>

      {/* Tabla */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left px-4 py-3 text-[10.5px] font-semibold text-muted-foreground uppercase tracking-wider">
                Código
              </th>
              <th className="text-left px-4 py-3 text-[10.5px] font-semibold text-muted-foreground uppercase tracking-wider">
                Nombre / Path
              </th>
              <th className="text-left px-4 py-3 text-[10.5px] font-semibold text-muted-foreground uppercase tracking-wider">
                Fuente
              </th>
              <th
                className="text-right px-4 py-3 text-[10.5px] font-semibold text-muted-foreground uppercase tracking-wider"
                title="Suma de facturas posteadas en Odoo"
              >
                Devengado
              </th>
              <th
                className="text-right px-4 py-3 text-[10.5px] font-semibold text-muted-foreground uppercase tracking-wider"
                title="Suma de pagos conciliados (cash basis)"
              >
                Financiero
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-muted-foreground text-sm">
                  {convenios.length === 0
                    ? "Este organismo aún no tiene convenios visibles configurados."
                    : "Ningún convenio coincide con los filtros."}
                </td>
              </tr>
            ) : (
              filtered.slice(0, 200).map((c) => {
                const a = normalizeAnalytic(c.analytic);
                const level = Math.min(Number(a?.hierarchy_level ?? 0), 4);
                return (
                  <tr
                    key={`${c.odoo_analytic_account_id}`}
                    className="hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-4 py-3 font-mono text-[11px] text-muted-foreground">
                      {c.code ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-foreground font-medium max-w-[480px]">
                      <div style={{ paddingLeft: `${level * 14}px` }}>
                        <p className="line-clamp-1">
                          {level > 0 && (
                            <span className="text-muted-foreground/40 mr-1">↳</span>
                          )}
                          {c.display_alias ?? c.name ?? "—"}
                        </p>
                        {a?.hierarchy_path && (
                          <p className="text-[10.5px] text-muted-foreground/70 font-mono line-clamp-1">
                            {a.hierarchy_path}
                          </p>
                        )}
                      </div>
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
                      {fmt(Number(a?.balance_devengado ?? a?.balance ?? 0))}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-muted-foreground tabular-nums">
                      {a?.balance_financiero == null
                        ? "—"
                        : fmt(Number(a.balance_financiero))}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {filtered.length > 200 && (
        <p className="mt-3 text-[12.5px] text-muted-foreground">
          Mostrando primeros 200 de {filtered.length}.
        </p>
      )}

      <p className="mt-4 text-[11.5px] text-muted-foreground">
        <strong>Devengado:</strong> facturas registradas y posteadas en contabilidad.{" "}
        <strong>Financiero:</strong> pagos efectivamente conciliados con banco. La
        diferencia entre ambos es lo pendiente de pago.
      </p>
    </div>
  );
}

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: number | string;
  hint?: string;
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <p className="text-[10.5px] text-muted-foreground uppercase tracking-wider font-medium">
        {label}
      </p>
      <p className="text-xl font-bold text-foreground mt-1 tabular-nums">{value}</p>
      {hint && (
        <p className="text-[10.5px] text-muted-foreground/70 mt-1 leading-tight">
          {hint}
        </p>
      )}
    </div>
  );
}
