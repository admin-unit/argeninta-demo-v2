import Link from "next/link";
import { redirect } from "next/navigation";
import { canAccessInbox, getInboxEmails, type InboxStatus } from "@/lib/data";
import { cn } from "@/lib/utils";
import { SyncControl } from "@/components/bandeja/sync-control";

export const dynamic = "force-dynamic";

const FILTROS: Array<{ key: InboxStatus | "all"; label: string }> = [
  { key: "all", label: "Todos" },
  { key: "unprocessed", label: "Sin procesar" },
  { key: "read", label: "Leídos" },
  { key: "processed", label: "Procesados" },
  { key: "discarded", label: "Descartados" },
];

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
  return d.toLocaleString("es-AR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function BandejaMailsPage({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string; q?: string }>;
}) {
  const access = await canAccessInbox();
  if (!access) redirect("/dashboard");

  const { estado = "all", q = "" } = await searchParams;
  const status = (FILTROS.find((f) => f.key === estado)?.key ?? "all") as
    | InboxStatus
    | "all";

  const mails = await getInboxEmails({ status, search: q });

  const totales = await getInboxEmails({ status: "all" });
  const counts: Record<string, number> = {
    all: totales.length,
    unprocessed: totales.filter((m) => m.status === "unprocessed").length,
    read: totales.filter((m) => m.status === "read").length,
    processed: totales.filter((m) => m.status === "processed").length,
    discarded: totales.filter((m) => m.status === "discarded").length,
  };

  return (
    <div className="p-8">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Bandeja de mails</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Casilla compartida — sync automático cada 10 s mientras tengas esta página abierta.{" "}
            {counts.all} mail{counts.all !== 1 ? "s" : ""} · {counts.unprocessed} sin procesar
          </p>
        </div>
        <SyncControl />
      </div>

      {/* Filtros + búsqueda */}
      <div className="flex items-center gap-1 mb-5">
        {FILTROS.map((f) => (
          <Link
            key={f.key}
            href={`/bandeja/mails?estado=${f.key}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
            className={cn(
              "inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all",
              estado === f.key
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-accent",
            )}
          >
            {f.label}
            {counts[f.key] > 0 && (
              <span
                className={cn(
                  "text-[11px] font-semibold tabular-nums px-1 py-0.5 rounded",
                  estado === f.key
                    ? "text-primary-foreground/70"
                    : "text-muted-foreground/60 bg-muted",
                )}
              >
                {counts[f.key]}
              </span>
            )}
          </Link>
        ))}

        <div className="ml-auto">
          <form method="GET" action="/bandeja/mails" className="relative">
            {status !== "all" && <input type="hidden" name="estado" value={status} />}
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
              placeholder="Buscar asunto, remitente…"
              className="pl-9 pr-4 py-1.5 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring/50 w-72 bg-card placeholder:text-muted-foreground/50"
            />
          </form>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        {mails.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-muted-foreground text-sm">
              {counts.all === 0
                ? "Todavía no llegaron mails a la casilla."
                : "No hay mails que coincidan con los filtros."}
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">
                  De
                </th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">
                  Asunto
                </th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">
                  Área
                </th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">
                  Adj
                </th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">
                  Estado
                </th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">
                  Recibido
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {mails.map((m) => (
                <tr key={m.id} className="group hover:bg-muted/25 transition-colors">
                  <td className="px-5 py-4 max-w-[220px]">
                    <Link
                      href={`/bandeja/mails/${m.id}`}
                      className="block"
                    >
                      <p className="text-[13.5px] font-medium text-foreground group-hover:text-primary truncate">
                        {m.from_name || m.from_email}
                      </p>
                      {m.from_name && (
                        <p className="text-[11.5px] font-mono text-muted-foreground/70 truncate">
                          {m.from_email}
                        </p>
                      )}
                    </Link>
                  </td>
                  <td className="px-5 py-4 max-w-[420px]">
                    <Link
                      href={`/bandeja/mails/${m.id}`}
                      className="text-[13.5px] font-medium text-foreground hover:text-primary line-clamp-1"
                    >
                      {m.subject}
                    </Link>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-[12.5px] text-muted-foreground">
                      {m.current_area_name ?? "—"}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    {m.attachment_count > 0 ? (
                      <span className="inline-flex items-center gap-1 text-[12.5px] text-muted-foreground">
                        <svg
                          className="w-3.5 h-3.5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          strokeWidth={1.75}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66L9.41 17.41a2 2 0 01-2.83-2.83l8.49-8.49" />
                        </svg>
                        {m.attachment_count}
                      </span>
                    ) : (
                      <span className="text-[12.5px] text-muted-foreground/50">—</span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={cn(
                        "inline-flex items-center px-2 py-0.5 rounded-md text-[11.5px] font-medium border",
                        STATUS_STYLES[m.status],
                      )}
                    >
                      {STATUS_LABEL[m.status]}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-[12.5px] text-muted-foreground tabular-nums">
                      {formatFechaHora(m.received_at)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <p className="mt-3 text-[12.5px] text-muted-foreground">
        {mails.length} mail{mails.length !== 1 ? "s" : ""}
        {estado !== "all" && ` · filtrando por "${FILTROS.find((f) => f.key === estado)?.label}"`}
        {q && ` · búsqueda "${q}"`}
      </p>
    </div>
  );
}
