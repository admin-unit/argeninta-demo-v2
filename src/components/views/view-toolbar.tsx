"use client";

import * as React from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  ArrowUpDownIcon,
  FilterIcon,
  LayoutGridIcon,
  TableIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import {
  parseViewConfig,
  serializeViewConfig,
  stripViewParams,
} from "@/lib/views/encoding";
import type { ObjectSchema, ViewType } from "@/lib/views/types";

/**
 * Top bar de una vista Attio-style.
 * v1: switcher Tabla|Kanban + Sort (stub) + Filter (disabled).
 */
export function ViewToolbar({ schema }: { schema: ObjectSchema }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const config = parseViewConfig(searchParams, schema);

  const setType = (type: ViewType) => {
    const next = { ...config, type };
    const merged = stripViewParams(searchParams);
    serializeViewConfig(next, schema).forEach((v, k) => merged.set(k, v));
    const qs = merged.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="inline-flex items-center rounded-lg bg-muted/40 p-0.5">
        <SwitchButton
          active={config.type === "table"}
          onClick={() => setType("table")}
          icon={<TableIcon className="w-3.5 h-3.5" />}
          label="Tabla"
        />
        <SwitchButton
          active={config.type === "kanban"}
          onClick={() => setType("kanban")}
          icon={<LayoutGridIcon className="w-3.5 h-3.5" />}
          label="Kanban"
        />
      </div>

      <ToolbarButton
        icon={<FilterIcon className="w-3.5 h-3.5" />}
        label="Filtrar"
        disabled
        title="Próximamente"
      />
      <ToolbarButton
        icon={<ArrowUpDownIcon className="w-3.5 h-3.5" />}
        label={
          config.sort.length > 0
            ? `Ordenado por ${config.sort[0].attribute}`
            : "Ordenar"
        }
        active={config.sort.length > 0}
        title="Click en una columna para ordenarla"
      />
    </div>
  );
}

function SwitchButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[12.5px] font-medium transition-colors",
        active
          ? "bg-card text-foreground shadow-sm ring-1 ring-border"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      {icon}
      {label}
    </button>
  );
}

function ToolbarButton({
  icon,
  label,
  active,
  disabled,
  title,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  disabled?: boolean;
  title?: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[12.5px] font-medium transition-colors",
        "border border-transparent",
        active
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:text-foreground hover:bg-muted/60",
        disabled && "opacity-40 cursor-not-allowed hover:bg-transparent",
      )}
    >
      {icon}
      {label}
    </button>
  );
}
