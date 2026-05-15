import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon, PlusIcon, UsersIcon } from "lucide-react";

import { getOrganismRow } from "@/lib/views/data-organisms";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function OrganismDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const row = await getOrganismRow(id);
  if (!row) notFound();

  const initial = (row.short_name ?? row.name)[0] ?? "?";
  const tipoStyles =
    row.tipo === "internacional"
      ? "bg-violet-50 text-violet-700 ring-violet-200"
      : "bg-blue-50 text-blue-700 ring-blue-200";

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <Link
        href="/organismos"
        className="inline-flex items-center gap-1.5 text-[12.5px] text-muted-foreground hover:text-foreground transition-colors mb-4"
      >
        <ArrowLeftIcon className="w-3.5 h-3.5" />
        Organismos
      </Link>

      <header className="flex items-start gap-4 mb-8">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
          <span className="text-primary text-2xl font-bold">{initial}</span>
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-semibold text-foreground leading-tight">
            {row.short_name ?? row.name}
          </h1>
          {row.short_name && (
            <p className="text-sm text-muted-foreground leading-snug mt-1">
              {row.name}
            </p>
          )}
          <div className="mt-2 flex items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ring-1",
                tipoStyles,
              )}
            >
              {row.tipo === "internacional" ? "Internacional" : "Nacional"}
            </span>
            {!row.active && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ring-1 bg-zinc-100 text-zinc-500 ring-zinc-200">
                Archivado
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/organismos/${row.id}/miembros`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-border text-foreground text-[13px] font-medium rounded-lg hover:bg-accent transition-colors"
          >
            <UsersIcon className="w-3.5 h-3.5" />
            Miembros
          </Link>
          <Link
            href={`/solicitudes/nueva?organism_id=${row.id}&organism_name=${encodeURIComponent(row.short_name ?? row.name)}&bandeja=${row.tipo === "internacional" ? "internacional" : "nacional"}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground text-[13px] font-medium rounded-lg hover:opacity-90 transition-opacity shadow-sm"
          >
            <PlusIcon className="w-3.5 h-3.5" />
            Nueva solicitud
          </Link>
        </div>
      </header>

      <section className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
        <StatCard label="Sol. activas" value={row.sol_activas} accent="amber" />
        <StatCard label="Sol. totales" value={row.sol_total} />
        <StatCard
          label="Última actividad"
          value={
            row.last_activity
              ? new Date(row.last_activity).toLocaleDateString("es-AR", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })
              : "—"
          }
        />
        <StatCard label="Miembros" value={row.members_count} />
        <StatCard label="Convenios visibles" value={row.convenios_count} />
        <StatCard
          label="Odoo partner ID"
          value={row.odoo_partner_id ?? "—"}
          mono
        />
      </section>

      <section className="bg-card border border-border rounded-xl p-5 mb-6">
        <h2 className="text-[11px] uppercase tracking-widest font-semibold text-muted-foreground mb-3">
          Datos
        </h2>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-[13px]">
          <Field label="CUIT" value={row.cuit} mono />
          <Field label="Dominio" value={row.email_domain} />
          <Field label="Email contacto" value={row.contact_email} mono />
          <Field
            label="Creado"
            value={new Date(row.created_at).toLocaleString("es-AR", {
              day: "2-digit",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          />
          <Field
            label="Última actualización"
            value={new Date(row.updated_at).toLocaleString("es-AR", {
              day: "2-digit",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          />
        </dl>
      </section>

      {row.notes && (
        <section className="bg-card border border-border rounded-xl p-5">
          <h2 className="text-[11px] uppercase tracking-widest font-semibold text-muted-foreground mb-2">
            Notas
          </h2>
          <p className="text-[13.5px] text-foreground leading-relaxed whitespace-pre-wrap">
            {row.notes}
          </p>
        </section>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  accent,
  mono,
}: {
  label: string;
  value: string | number;
  accent?: "amber" | "primary";
  mono?: boolean;
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <p className="text-[10.5px] uppercase tracking-widest font-semibold text-muted-foreground mb-1">
        {label}
      </p>
      <p
        className={cn(
          "text-2xl font-semibold tabular-nums leading-none mt-1",
          accent === "amber" && Number(value) > 0
            ? "text-amber-600"
            : "text-foreground",
          mono && "font-mono text-lg",
        )}
      >
        {value}
      </p>
    </div>
  );
}

function Field({
  label,
  value,
  mono,
}: {
  label: string;
  value: string | null | undefined;
  mono?: boolean;
}) {
  return (
    <div>
      <dt className="text-[10.5px] uppercase tracking-widest font-semibold text-muted-foreground">
        {label}
      </dt>
      <dd
        className={cn(
          "text-foreground mt-0.5",
          mono && "font-mono text-[12.5px]",
        )}
      >
        {value ?? <span className="text-muted-foreground/40">—</span>}
      </dd>
    </div>
  );
}
