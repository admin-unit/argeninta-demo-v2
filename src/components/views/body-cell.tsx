"use client";

import { cn } from "@/lib/utils";
import type { Attribute, ObjectSchema } from "@/lib/views/types";

type Row = Record<string, unknown>;

/**
 * Render de una celda según el tipo del Attribute.
 * Special-cases por (object_slug, attribute.id) cuando hace falta una vista compuesta
 * (ej. en organisms el atributo "organismo" combina short_name + name + avatar).
 */
export function BodyCell({
  schema,
  attribute,
  row,
}: {
  schema: ObjectSchema;
  attribute: Attribute;
  row: Row;
}) {
  // Composite cells per object_slug + attribute_id
  if (schema.slug === "organisms" && attribute.id === "organismo") {
    return <OrganismPrimaryCell row={row} />;
  }

  const value = row[attribute.id];
  const align = attribute.align ?? defaultAlign(attribute.type);
  const wrapperCls = cn(
    "text-[13px] leading-snug",
    align === "right" && "text-right tabular-nums",
    align === "center" && "text-center",
  );

  if (value == null || value === "") {
    return <span className="text-muted-foreground/40">—</span>;
  }

  switch (attribute.type) {
    case "text":
    case "url":
      return (
        <span className={cn(wrapperCls, "text-foreground line-clamp-1")}>
          {String(value)}
        </span>
      );
    case "email":
      return (
        <span className={cn(wrapperCls, "text-foreground font-mono text-[12px] line-clamp-1")}>
          {String(value)}
        </span>
      );
    case "number":
      return (
        <span className={cn(wrapperCls, "text-foreground")}>
          {fmtNumber(value)}
        </span>
      );
    case "currency":
      return (
        <span className={cn(wrapperCls, "text-foreground font-semibold")}>
          {fmtNumber(value)}
        </span>
      );
    case "boolean":
      return <BooleanCell value={Boolean(value)} />;
    case "date":
    case "datetime":
      return (
        <span className={cn(wrapperCls, "text-muted-foreground tabular-nums")}>
          {fmtDate(String(value), attribute.type)}
        </span>
      );
    case "select":
      return <SelectPill attribute={attribute} value={String(value)} />;
    case "multiselect":
      return (
        <div className="flex flex-wrap gap-1">
          {(value as string[]).map((v) => (
            <SelectPill key={v} attribute={attribute} value={v} />
          ))}
        </div>
      );
    case "reference":
    case "user":
      return (
        <span className={cn(wrapperCls, "text-foreground")}>
          {String(value)}
        </span>
      );
  }
}

// ---------------------------------------------------------------------------
// Composite renderers

function OrganismPrimaryCell({ row }: { row: Row }) {
  const shortName = (row.short_name as string | null) ?? null;
  const name = (row.name as string | null) ?? "";
  const initial = (shortName ?? name)[0] ?? "?";
  return (
    <div className="flex items-center gap-2.5 min-w-0">
      <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
        <span className="text-primary text-[11px] font-bold">{initial}</span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-foreground text-[13px] leading-tight line-clamp-1">
          {shortName ?? name}
        </p>
        {shortName && (
          <p className="text-[11.5px] text-muted-foreground leading-tight line-clamp-1">
            {name}
          </p>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Type-specific bits

function BooleanCell({ value }: { value: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center w-5 h-5 rounded-full text-[11px] font-semibold",
        value
          ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
          : "bg-zinc-100 text-zinc-500 ring-1 ring-zinc-200",
      )}
    >
      {value ? "✓" : "✗"}
    </span>
  );
}

const SELECT_COLOR_STYLES: Record<string, string> = {
  blue: "bg-blue-50 text-blue-700 ring-blue-200",
  violet: "bg-violet-50 text-violet-700 ring-violet-200",
  amber: "bg-amber-50 text-amber-700 ring-amber-200",
  emerald: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  rose: "bg-rose-50 text-rose-700 ring-rose-200",
  zinc: "bg-zinc-100 text-zinc-700 ring-zinc-200",
};

function SelectPill({ attribute, value }: { attribute: Attribute; value: string }) {
  const opt = attribute.options?.find((o) => o.value === value);
  const colorCls = SELECT_COLOR_STYLES[opt?.color ?? "zinc"] ?? SELECT_COLOR_STYLES.zinc;
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ring-1",
        colorCls,
      )}
    >
      {opt?.label ?? value}
    </span>
  );
}

// ---------------------------------------------------------------------------
// formatters

function defaultAlign(type: Attribute["type"]): "left" | "right" | "center" {
  if (type === "number" || type === "currency") return "right";
  if (type === "boolean") return "center";
  return "left";
}

function fmtNumber(v: unknown): string {
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n)) return String(v);
  return new Intl.NumberFormat("es-AR").format(n);
}

function fmtDate(v: string, type: "date" | "datetime"): string {
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return v;
  if (type === "datetime") {
    return d.toLocaleString("es-AR", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  return d.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
