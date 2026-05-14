"use client";

import Link from "next/link";
import { ExternalLinkIcon, XIcon } from "lucide-react";
import type { OrganismRow } from "@/lib/views/data-organisms";
import { cn } from "@/lib/utils";

export function OrganismPreview({
  row,
  onClose,
}: {
  row: OrganismRow;
  onClose: () => void;
}) {
  const initial = (row.short_name ?? row.name)[0] ?? "?";
  return (
    <div className="p-5">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <span className="text-primary text-lg font-bold">{initial}</span>
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-base font-semibold text-foreground leading-tight">
            {row.short_name ?? row.name}
          </h2>
          {row.short_name && (
            <p className="text-[12.5px] text-muted-foreground leading-snug mt-0.5">
              {row.name}
            </p>
          )}
          <div className="mt-2">
            <TipoPill tipo={row.tipo} />
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
          aria-label="Cerrar preview"
        >
          <XIcon className="w-4 h-4" />
        </button>
      </div>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-[12.5px]">
        <Field label="CUIT" value={row.cuit} mono />
        <Field label="Dominio" value={row.email_domain} />
        <Field label="Contacto" value={row.contact_email} mono span2 />
        <Field label="Miembros" value={String(row.members_count)} />
        <Field label="Convenios" value={String(row.convenios_count)} />
        <Field label="Sol. activas" value={String(row.sol_activas)} />
        <Field label="Sol. totales" value={String(row.sol_total)} />
        <Field
          label="Última actividad"
          value={
            row.last_activity
              ? new Date(row.last_activity).toLocaleDateString("es-AR", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })
              : null
          }
        />
        <Field label="Activo" value={row.active ? "Sí" : "No"} />
      </dl>

      {row.notes && (
        <div className="mt-3 pt-3 border-t border-border/60">
          <p className="text-[11px] uppercase tracking-widest font-semibold text-muted-foreground mb-1">
            Notas
          </p>
          <p className="text-[13px] text-foreground leading-snug whitespace-pre-wrap">
            {row.notes}
          </p>
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-border/60 flex items-center justify-end gap-2">
        <Link
          href={`/organismos/${row.id}`}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-[13px] font-medium hover:opacity-90 transition-opacity"
        >
          Abrir ficha
          <ExternalLinkIcon className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  mono,
  span2,
}: {
  label: string;
  value: string | null | undefined;
  mono?: boolean;
  span2?: boolean;
}) {
  return (
    <div className={cn(span2 && "col-span-2")}>
      <dt className="text-[10.5px] uppercase tracking-widest font-semibold text-muted-foreground">
        {label}
      </dt>
      <dd
        className={cn(
          "text-foreground mt-0.5 truncate",
          mono && "font-mono text-[12px]",
        )}
      >
        {value ?? <span className="text-muted-foreground/40">—</span>}
      </dd>
    </div>
  );
}

function TipoPill({ tipo }: { tipo: OrganismRow["tipo"] }) {
  const styles =
    tipo === "internacional"
      ? "bg-violet-50 text-violet-700 ring-violet-200"
      : "bg-blue-50 text-blue-700 ring-blue-200";
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ring-1",
        styles,
      )}
    >
      {tipo === "internacional" ? "Internacional" : "Nacional"}
    </span>
  );
}
