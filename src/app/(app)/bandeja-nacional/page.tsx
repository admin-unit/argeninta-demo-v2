import Link from "next/link";
import {
  getSolicitudes,
  AREAS_NACIONAL,
} from "@/lib/data";
import { EstadoBadge } from "@/components/solicitudes/estado-badge";
import { ESTADO_GROUPS, TIPO_LABEL, type EstadoSolicitud, type TipoGestion, type Solicitud } from "@/types";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const FILTROS = [
  { key: "todos", label: "Todos", statuses: null as EstadoSolicitud[] | null },
  { key: "pendientes", label: "Pendientes", statuses: ESTADO_GROUPS.pendientes },
  { key: "en_proceso", label: "En proceso", statuses: ESTADO_GROUPS.en_proceso },
  { key: "cerradas", label: "Cerradas", statuses: ESTADO_GROUPS.cerradas },
  { key: "borradores", label: "Borradores", statuses: ESTADO_GROUPS.borradores },
] as const;

const KANBAN_COLUMNS: { key: string; label: string; statuses: EstadoSolicitud[]; tone: string }[] = [
  { key: "borradores", label: "Borradores", statuses: ESTADO_GROUPS.borradores, tone: "bg-gray-100 text-gray-700" },
  { key: "pendientes", label: "Pendientes", statuses: ESTADO_GROUPS.pendientes, tone: "bg-amber-50 text-amber-700" },
  { key: "en_proceso", label: "En proceso", statuses: ESTADO_GROUPS.en_proceso, tone: "bg-blue-50 text-blue-700" },
  { key: "cerradas", label: "Cerradas", statuses: ESTADO_GROUPS.cerradas, tone: "bg-green-50 text-green-700" },
  { key: "problemas", label: "Problemas", statuses: ESTADO_GROUPS.problemas, tone: "bg-rose-50 text-rose-700" },
];

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

export default async function BandejaNacional({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string; q?: string; vista?: string }>;
}) {
  const { estado = "todos", q = "", vista = "tabla" } = await searchParams;
  const isKanban = vista === "kanban";
  const qs = (overrides: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    const base = { estado, q, vista };
    for (const [k, v] of Object.entries({ ...base, ...overrides })) {
      if (v && v !== "todos" && !(k === "vista" && v === "tabla")) params.set(k, v);
    }
    const s = params.toString();
    return s ? `?${s}` : "";
  };

  // Todas las solicitudes de las áreas "nacionales" (Mesa, Admin, Tesorería, Compras)
  const todas = await getSolicitudes({ current_area_ids: AREAS_NACIONAL, limit: 500 });
  const search = q.toLowerCase();
  const filtroActivo = FILTROS.find((f) => f.key === estado) ?? FILTROS[0];

  const solicitudes = todas.filter((s) => {
    if (filtroActivo.statuses && !filtroActivo.statuses.includes(s.status)) return false;
    if (search) {
      const hay =
        (s.numero_expediente ?? "").toLowerCase().includes(search) ||
        (s.concepto ?? "").toLowerCase().includes(search) ||
        (s.organism_short_name ?? "").toLowerCase().includes(search) ||
        (s.created_by_name ?? "").toLowerCase().includes(search);
      if (!hay) return false;
    }
    return true;
  });

  const counts: Record<string, number> = { todos: todas.length };
  for (const f of FILTROS.slice(1)) {
    counts[f.key] = f.statuses ? todas.filter((s) => f.statuses!.includes(s.status)).length : 0;
  }

  const pendientes = todas.filter((s) =>
    ESTADO_GROUPS.pendientes.includes(s.status)
  ).length;
  const enProceso = todas.filter((s) =>
    ESTADO_GROUPS.en_proceso.includes(s.status)
  ).length;
  const totalImporte = todas.reduce((sum, s) => sum + (Number(s.importe) || 0), 0);

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Bandeja Nacional</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gestiones de Mesa de Entrada, Administración, Tesorería y Compras
          </p>
        </div>
        <Link
          href="/solicitudes/nueva?bandeja=nacional"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:opacity-90 transition-opacity shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-card rounded-xl border border-border p-5">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-2">
            Pendientes
          </p>
          <p className="text-3xl font-bold text-amber-500 tabular-nums">{pendientes}</p>
          <p className="text-xs text-muted-foreground mt-1">esperando revisión</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-5">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-2">
            En proceso
          </p>
          <p className="text-3xl font-bold text-primary tabular-nums">{enProceso}</p>
          <p className="text-xs text-muted-foreground mt-1">en gestión / pago</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-5">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-2">
            Volumen total
          </p>
          <p className="text-3xl font-bold text-foreground tabular-nums">
            ${new Intl.NumberFormat("es-AR", { notation: "compact" }).format(totalImporte)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">{todas.length} solicitudes</p>
        </div>
      </div>

      {/* Filtros + búsqueda */}
      <div className="flex items-center gap-1 mb-5">
        {FILTROS.map((f) => (
          <Link
            key={f.key}
            href={`/bandeja-nacional${qs({ estado: f.key })}`}
            className={cn(
              "inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all",
              estado === f.key
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-accent"
            )}
          >
            {f.label}
            {counts[f.key] > 0 && (
              <span
                className={cn(
                  "text-[11px] font-semibold tabular-nums px-1 py-0.5 rounded",
                  estado === f.key
                    ? "text-primary-foreground/70"
                    : "text-muted-foreground/60 bg-muted"
                )}
              >
                {counts[f.key]}
              </span>
            )}
          </Link>
        ))}

        <div className="ml-auto flex items-center gap-3">
          <div className="inline-flex rounded-lg border border-border bg-card p-0.5">
            <Link
              href={`/bandeja-nacional${qs({ vista: "tabla" })}`}
              className={cn(
                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[12.5px] font-medium transition-colors",
                !isKanban
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
              title="Vista tabla"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              Tabla
            </Link>
            <Link
              href={`/bandeja-nacional${qs({ vista: "kanban" })}`}
              className={cn(
                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[12.5px] font-medium transition-colors",
                isKanban
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
              title="Vista kanban"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5h4v14H4zM10 5h4v9h-4zM16 5h4v6h-4z" />
              </svg>
              Kanban
            </Link>
          </div>

          <form method="GET" action="/bandeja-nacional" className="relative">
            {estado !== "todos" && <input type="hidden" name="estado" value={estado} />}
            {isKanban && <input type="hidden" name="vista" value="kanban" />}
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/50 pointer-events-none"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <circle cx="11" cy="11" r="8" strokeWidth={2} />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="m21 21-4.35-4.35"
              />
            </svg>
            <input
              name="q"
              defaultValue={q}
              placeholder="Buscar expediente, concepto, organismo…"
              className="pl-9 pr-4 py-1.5 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring/50 w-72 bg-card placeholder:text-muted-foreground/50"
            />
          </form>
        </div>
      </div>

      {/* Tabla o Kanban */}
      {isKanban ? (
        <KanbanBoard solicitudes={solicitudes} />
      ) : (
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        {solicitudes.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-muted-foreground text-sm">
              No hay solicitudes con los filtros aplicados.
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">
                  Expediente
                </th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">
                  Tipo
                </th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">
                  Concepto
                </th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">
                  Organismo
                </th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">
                  Área
                </th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">
                  Estado
                </th>
                <th className="text-right px-5 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">
                  Importe
                </th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">
                  Fecha
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {solicitudes.map((s) => (
                <tr key={s.id} className="group hover:bg-muted/25 transition-colors">
                  <td className="px-5 py-4">
                    <Link
                      href={`/solicitudes/${s.id}`}
                      className="font-mono text-[12px] font-semibold text-muted-foreground group-hover:text-primary transition-colors"
                    >
                      {s.numero_expediente ?? "(sin nro)"}
                    </Link>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-[12.5px] text-muted-foreground">
                      {s.tipo_slug ? TIPO_LABEL[s.tipo_slug as TipoGestion] : s.tipo_name ?? "—"}
                    </span>
                  </td>
                  <td className="px-5 py-4 max-w-[280px]">
                    <Link
                      href={`/solicitudes/${s.id}`}
                      className="text-[14px] font-medium text-foreground hover:text-primary transition-colors line-clamp-1 leading-snug"
                    >
                      {s.concepto ?? "(sin concepto)"}
                    </Link>
                    <p className="text-[12px] text-muted-foreground mt-0.5 leading-none">
                      {s.created_by_name ?? "—"}
                    </p>
                  </td>
                  <td className="px-5 py-4">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-muted text-[12px] font-medium text-muted-foreground border border-border/60">
                      {s.organism_short_name ?? "—"}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-[12.5px] text-muted-foreground">
                    {s.current_area_name ?? "—"}
                  </td>
                  <td className="px-5 py-4">
                    <EstadoBadge estado={s.status as EstadoSolicitud} />
                  </td>
                  <td className="px-5 py-4 text-right">
                    <span className="text-[14px] font-semibold text-foreground tabular-nums">
                      {formatImporte(Number(s.importe), s.moneda)}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-[12.5px] text-muted-foreground">
                      {formatFecha(s.created_at)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      )}

      <p className="mt-3 text-[12.5px] text-muted-foreground">
        {solicitudes.length} solicitud{solicitudes.length !== 1 ? "es" : ""}
        {estado !== "todos" && ` · filtrando por "${filtroActivo.label}"`}
        {q && ` · búsqueda "${q}"`}
      </p>
    </div>
  );
}

function KanbanBoard({ solicitudes }: { solicitudes: Solicitud[] }) {
  const byColumn = new Map<string, Solicitud[]>();
  for (const col of KANBAN_COLUMNS) byColumn.set(col.key, []);
  for (const s of solicitudes) {
    const col = KANBAN_COLUMNS.find((c) => c.statuses.includes(s.status));
    if (col) byColumn.get(col.key)!.push(s);
  }

  return (
    <div className="flex gap-3 overflow-x-auto pb-4 -mx-1 px-1">
      {KANBAN_COLUMNS.map((col) => {
        const items = byColumn.get(col.key) ?? [];
        return (
          <div
            key={col.key}
            className="shrink-0 w-[280px] bg-muted/30 rounded-xl border border-border/60 flex flex-col max-h-[calc(100vh-280px)]"
          >
            <div className="flex items-center justify-between px-3 py-2.5 border-b border-border/60">
              <div className="flex items-center gap-2">
                <span className={cn("inline-block w-2 h-2 rounded-full", col.tone.split(" ")[0])} />
                <span className="text-[12px] font-semibold text-foreground uppercase tracking-wider">
                  {col.label}
                </span>
              </div>
              <span className="text-[11px] font-semibold text-muted-foreground tabular-nums px-1.5 py-0.5 rounded bg-card border border-border/60">
                {items.length}
              </span>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-2">
              {items.length === 0 ? (
                <p className="text-[11.5px] text-muted-foreground/60 text-center py-6">
                  Sin solicitudes
                </p>
              ) : (
                items.map((s) => <KanbanCard key={s.id} solicitud={s} />)
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function KanbanCard({ solicitud: s }: { solicitud: Solicitud }) {
  return (
    <Link
      href={`/solicitudes/${s.id}`}
      className="block bg-card rounded-lg border border-border/70 p-2.5 hover:border-primary/40 hover:shadow-sm transition-all"
    >
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <span className="font-mono text-[11px] font-semibold text-muted-foreground">
          {s.numero_expediente ?? "(sin nro)"}
        </span>
        <EstadoBadge estado={s.status as EstadoSolicitud} />
      </div>
      <p className="text-[13px] font-medium text-foreground leading-snug line-clamp-2 mb-2">
        {s.concepto ?? "(sin concepto)"}
      </p>
      <div className="flex items-center justify-between text-[11.5px]">
        <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border/60 font-medium truncate max-w-[140px]">
          {s.organism_short_name ?? "—"}
        </span>
        <span className="font-semibold text-foreground tabular-nums">
          {formatImporte(Number(s.importe), s.moneda)}
        </span>
      </div>
      {s.tipo_slug && (
        <p className="text-[11px] text-muted-foreground mt-1.5 truncate">
          {TIPO_LABEL[s.tipo_slug as TipoGestion]}
          {s.current_area_name && ` · ${s.current_area_name}`}
        </p>
      )}
    </Link>
  );
}
