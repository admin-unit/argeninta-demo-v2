"use client";

import * as React from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  EyeOffIcon,
  PlusIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import {
  parseViewConfig,
  serializeViewConfig,
  stripViewParams,
} from "@/lib/views/encoding";
import type {
  Attribute,
  ColumnConfig,
  ObjectSchema,
  SortDirection,
  ViewConfig,
} from "@/lib/views/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { BodyCell } from "./body-cell";

type Row = Record<string, unknown> & { id: string };

type RenderPreview = (row: Row, close: () => void) => React.ReactNode;

export function DataTable({
  schema,
  rows,
  renderPreview,
}: {
  schema: ObjectSchema;
  rows: Row[];
  renderPreview?: RenderPreview;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // El config "vive" en URL — leemos en cada render para mantener sync.
  // Pero permitimos drag local optimista antes de pushear a la URL.
  const config = React.useMemo(
    () => parseViewConfig(searchParams, schema),
    [searchParams, schema],
  );

  const updateConfig = React.useCallback(
    (next: ViewConfig) => {
      const merged = stripViewParams(searchParams);
      const viewParams = serializeViewConfig(next, schema);
      viewParams.forEach((v, k) => merged.set(k, v));
      const qs = merged.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [router, pathname, searchParams, schema],
  );

  // -------------------------------------------------------------------------
  // Sort

  const cycleSort = (attrId: string) => {
    const current = config.sort.find((s) => s.attribute === attrId);
    let next: ViewConfig["sort"];
    if (!current) {
      next = [{ attribute: attrId, direction: "asc" }];
    } else if (current.direction === "asc") {
      next = [{ attribute: attrId, direction: "desc" }];
    } else {
      next = [];
    }
    updateConfig({ ...config, sort: next });
  };

  const setSort = (attrId: string, direction: SortDirection) => {
    updateConfig({
      ...config,
      sort: [{ attribute: attrId, direction }],
    });
  };

  // -------------------------------------------------------------------------
  // Columnas — ordenamiento y visibilidad

  const visibleColumns = React.useMemo(() => {
    const byId = new Map(schema.attributes.map((a) => [a.id, a]));
    return [...config.columns]
      .filter((c) => c.visible)
      .sort((a, b) => a.order - b.order)
      .map((c) => ({ col: c, attr: byId.get(c.id)! }))
      .filter((x) => x.attr);
  }, [config.columns, schema.attributes]);

  const hiddenAttributes = React.useMemo(() => {
    const visible = new Set(
      config.columns.filter((c) => c.visible).map((c) => c.id),
    );
    return schema.attributes.filter((a) => !visible.has(a.id));
  }, [config.columns, schema.attributes]);

  const hideColumn = (attrId: string) => {
    const newCols = config.columns.map((c) =>
      c.id === attrId ? { ...c, visible: false } : c,
    );
    updateConfig({ ...config, columns: newCols });
  };

  const showColumn = (attrId: string) => {
    const newCols = config.columns.map((c) =>
      c.id === attrId ? { ...c, visible: true } : c,
    );
    updateConfig({ ...config, columns: newCols });
  };

  // Reorder: mover atributo `dragId` justo antes de `targetId`.
  const reorderColumns = (dragId: string, targetId: string) => {
    if (dragId === targetId) return;
    const visibleIds = visibleColumns.map((v) => v.col.id);
    const dragIdx = visibleIds.indexOf(dragId);
    const targetIdx = visibleIds.indexOf(targetId);
    if (dragIdx < 0 || targetIdx < 0) return;

    const next = [...visibleIds];
    next.splice(dragIdx, 1);
    const insertAt = targetIdx > dragIdx ? targetIdx - 1 : targetIdx;
    next.splice(insertAt, 0, dragId);

    // Reconstruir todas las columnas: visibles en el nuevo orden, después las ocultas.
    const hiddenIds = config.columns
      .filter((c) => !c.visible)
      .sort((a, b) => a.order - b.order)
      .map((c) => c.id);

    const newCols: ColumnConfig[] = [
      ...next.map((id, i) => ({ id, visible: true, order: i })),
      ...hiddenIds.map((id, i) => ({
        id,
        visible: false,
        order: next.length + i,
      })),
    ];
    updateConfig({ ...config, columns: newCols });
  };

  // -------------------------------------------------------------------------
  // Sort rows en cliente (v1 — para datasets chiquitos)

  const sortedRows = React.useMemo(() => {
    if (config.sort.length === 0) return rows;
    const sortKey = config.sort[0];
    const dir = sortKey.direction === "asc" ? 1 : -1;
    return [...rows].sort((a, b) => {
      const av = a[sortKey.attribute];
      const bv = b[sortKey.attribute];
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      if (typeof av === "number" && typeof bv === "number") return (av - bv) * dir;
      return String(av).localeCompare(String(bv), "es", { numeric: true }) * dir;
    });
  }, [rows, config.sort]);

  // -------------------------------------------------------------------------
  // Preview popover state — single anchor per click

  const [previewRow, setPreviewRow] = React.useState<Row | null>(null);

  // -------------------------------------------------------------------------
  // Render

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              {visibleColumns.map(({ col, attr }) => (
                <HeaderCell
                  key={col.id}
                  attribute={attr}
                  width={col.width ?? attr.width}
                  sortDirection={
                    config.sort.find((s) => s.attribute === col.id)?.direction
                  }
                  onSortClick={() => cycleSort(col.id)}
                  onSortAsc={() => setSort(col.id, "asc")}
                  onSortDesc={() => setSort(col.id, "desc")}
                  onHide={() => hideColumn(col.id)}
                  onReorderDrop={(dragId) => reorderColumns(dragId, col.id)}
                />
              ))}
              <th className="px-2 py-3 w-10 bg-muted/30">
                <AddColumnButton
                  hidden={hiddenAttributes}
                  onShow={showColumn}
                />
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {sortedRows.length === 0 ? (
              <tr>
                <td
                  colSpan={visibleColumns.length + 1}
                  className="py-16 text-center text-muted-foreground text-sm"
                >
                  No hay registros.
                </td>
              </tr>
            ) : (
              sortedRows.map((row) => (
                <tr
                  key={row.id}
                  className="group hover:bg-muted/25 transition-colors"
                  onDoubleClick={() => router.push(schema.detailUrl(row.id))}
                >
                  {visibleColumns.map(({ col, attr }) => (
                    <td
                      key={col.id}
                      className={cn(
                        "px-4 py-3 cursor-pointer",
                        "transition-colors",
                        "hover:bg-primary/5",
                        previewRow?.id === row.id && "bg-primary/[0.04]",
                      )}
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreviewRow(row);
                      }}
                    >
                      <BodyCell schema={schema} attribute={attr} row={row} />
                    </td>
                  ))}
                  <td className="px-2 py-3 w-10" />
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Preview popover (anchored a viewport top-right, simple-modo en v1) */}
      {previewRow && renderPreview && (
        <PreviewOverlay onClose={() => setPreviewRow(null)}>
          {renderPreview(previewRow, () => setPreviewRow(null))}
        </PreviewOverlay>
      )}
    </div>
  );
}

// ===========================================================================
// HeaderCell

function HeaderCell({
  attribute,
  width,
  sortDirection,
  onSortClick,
  onSortAsc,
  onSortDesc,
  onHide,
  onReorderDrop,
}: {
  attribute: Attribute;
  width?: number;
  sortDirection?: SortDirection;
  onSortClick: () => void;
  onSortAsc: () => void;
  onSortDesc: () => void;
  onHide: () => void;
  onReorderDrop: (dragId: string) => void;
}) {
  const [isDropTarget, setIsDropTarget] = React.useState(false);

  return (
    <th
      style={width ? { width: `${width}px`, minWidth: `${width}px` } : undefined}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/x-attribute-id", attribute.id);
        e.dataTransfer.effectAllowed = "move";
      }}
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        setIsDropTarget(true);
      }}
      onDragLeave={() => setIsDropTarget(false)}
      onDrop={(e) => {
        e.preventDefault();
        const dragId = e.dataTransfer.getData("text/x-attribute-id");
        if (dragId && dragId !== attribute.id) onReorderDrop(dragId);
        setIsDropTarget(false);
      }}
      className={cn(
        "group/header relative text-left px-4 py-3 text-[10.5px] font-semibold text-muted-foreground uppercase tracking-wider select-none",
        "cursor-grab active:cursor-grabbing",
        isDropTarget && "bg-primary/10 ring-2 ring-inset ring-primary/30",
      )}
    >
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={onSortClick}
          className="flex items-center gap-1 hover:text-foreground transition-colors min-w-0"
        >
          <span className="truncate">{attribute.label}</span>
          {sortDirection === "asc" && (
            <ChevronUpIcon className="w-3 h-3 text-foreground shrink-0" />
          )}
          {sortDirection === "desc" && (
            <ChevronDownIcon className="w-3 h-3 text-foreground shrink-0" />
          )}
        </button>
        <div className="ml-auto opacity-0 group-hover/header:opacity-100 transition-opacity">
          <DropdownMenu>
            <DropdownMenuTrigger
              className="p-0.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
              aria-label={`Menú de columna ${attribute.label}`}
              onClick={(e) => e.stopPropagation()}
            >
              <DotsIcon />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" sideOffset={4}>
              <DropdownMenuItem onClick={onSortAsc}>
                <ChevronUpIcon className="w-3.5 h-3.5" /> Ordenar A → Z
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onSortDesc}>
                <ChevronDownIcon className="w-3.5 h-3.5" /> Ordenar Z → A
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onHide}>
                <EyeOffIcon className="w-3.5 h-3.5" /> Ocultar columna
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </th>
  );
}

function DotsIcon() {
  return (
    <svg className="w-3 h-3" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
      <circle cx="3" cy="8" r="1.4" />
      <circle cx="8" cy="8" r="1.4" />
      <circle cx="13" cy="8" r="1.4" />
    </svg>
  );
}

// ===========================================================================
// AddColumnButton — restore hidden cols

function AddColumnButton({
  hidden,
  onShow,
}: {
  hidden: Attribute[];
  onShow: (attrId: string) => void;
}) {
  if (hidden.length === 0) return null;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="inline-flex items-center justify-center w-6 h-6 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
        aria-label="Mostrar columna oculta"
      >
        <PlusIcon className="w-3.5 h-3.5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={4}>
        {hidden.map((attr) => (
          <DropdownMenuItem key={attr.id} onClick={() => onShow(attr.id)}>
            {attr.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ===========================================================================
// PreviewOverlay — popover panel anchored top-right of viewport (v1 simple)

function PreviewOverlay({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px]"
        onClick={onClose}
      />
      <div className="fixed right-6 top-20 z-50 w-[420px] max-h-[80vh] overflow-auto rounded-xl bg-card shadow-2xl ring-1 ring-foreground/10 animate-in slide-in-from-right-4 fade-in-0 duration-150">
        {children}
      </div>
    </>
  );
}
