/**
 * Encoding/decoding de `ViewConfig` a URL search params.
 *
 * Convenciones:
 *   ?type=table|kanban
 *   ?sort=col1:asc,col2:desc
 *   ?cols=col1,col2,col3        ← orden de visibles. Si está presente, columnas no listadas se ocultan.
 *                                   Si está ausente, default = todas visibles, orden del schema.
 *   ?density=compact|comfortable
 *   ?group=col
 *
 * Cuando el user no tocó nada, NO emitimos params (URL limpia). Cualquier modificación
 * trae todo el state encodeado.
 */

import {
  defaultViewConfig,
  type ColumnConfig,
  type Density,
  type ObjectSchema,
  type SortDirection,
  type SortKey,
  type ViewConfig,
  type ViewType,
} from "./types";

const VIEW_PARAM_KEYS = ["type", "sort", "cols", "density", "group"] as const;
type ViewParamKey = (typeof VIEW_PARAM_KEYS)[number];

/** Convierte URL search params en `ViewConfig`, usando defaults del schema para lo que falte. */
export function parseViewConfig(
  params: URLSearchParams | Record<string, string | undefined>,
  schema: ObjectSchema,
): ViewConfig {
  const get = (key: string): string | undefined => {
    if (params instanceof URLSearchParams) return params.get(key) ?? undefined;
    return params[key];
  };
  const base = defaultViewConfig(schema);
  const validAttrs = new Set(schema.attributes.map((a) => a.id));

  const type: ViewType = get("type") === "kanban" ? "kanban" : "table";

  const sort = parseSort(get("sort"), validAttrs);

  const columns = parseColumns(get("cols"), schema);

  const density: Density = get("density") === "compact" ? "compact" : "comfortable";

  const groupRaw = get("group");
  const groupBy = groupRaw && validAttrs.has(groupRaw) ? groupRaw : undefined;

  return {
    type,
    sort,
    columns,
    density,
    groupBy: type === "kanban" ? (groupBy ?? base.groupBy) : groupBy,
  };
}

/** Convierte `ViewConfig` en URLSearchParams, emitiendo solo lo que se desvía del default. */
export function serializeViewConfig(
  config: ViewConfig,
  schema: ObjectSchema,
): URLSearchParams {
  const params = new URLSearchParams();

  if (config.type !== "table") params.set("type", config.type);

  if (config.sort.length > 0) {
    params.set(
      "sort",
      config.sort.map((s) => `${s.attribute}:${s.direction}`).join(","),
    );
  }

  const isDefaultColumns = isDefaultColumnConfig(config.columns, schema);
  if (!isDefaultColumns) {
    const visibleInOrder = [...config.columns]
      .filter((c) => c.visible)
      .sort((a, b) => a.order - b.order)
      .map((c) => c.id);
    params.set("cols", visibleInOrder.join(","));
  }

  if (config.density !== "comfortable") params.set("density", config.density);

  if (config.groupBy) params.set("group", config.groupBy);

  return params;
}

/**
 * Devuelve los params actuales SIN los keys de view (para preservar `q` u otros filtros
 * legacy mientras conviven). Útil cuando se reescribe la URL.
 */
export function stripViewParams(
  params: URLSearchParams | Record<string, string | undefined>,
): URLSearchParams {
  const result = new URLSearchParams();
  const entries: Array<[string, string]> =
    params instanceof URLSearchParams
      ? Array.from(params.entries())
      : Object.entries(params).filter(([, v]) => v !== undefined) as Array<[string, string]>;
  for (const [k, v] of entries) {
    if (!VIEW_PARAM_KEYS.includes(k as ViewParamKey)) result.append(k, v);
  }
  return result;
}

// ---------------------------------------------------------------------------
// internals

function parseSort(raw: string | undefined, validAttrs: Set<string>): SortKey[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((chunk): SortKey | null => {
      const [attribute, dirRaw] = chunk.split(":");
      if (!attribute || !validAttrs.has(attribute)) return null;
      const direction: SortDirection = dirRaw === "desc" ? "desc" : "asc";
      return { attribute, direction };
    })
    .filter((x): x is SortKey => x !== null);
}

function parseColumns(raw: string | undefined, schema: ObjectSchema): ColumnConfig[] {
  const allIds = schema.attributes.map((a) => a.id);
  if (!raw) {
    return allIds.map((id, i) => ({ id, visible: true, order: i }));
  }

  const visibleOrdered = raw
    .split(",")
    .map((s) => s.trim())
    .filter((id) => allIds.includes(id));

  // De-dupe preservando primer aparición.
  const seen = new Set<string>();
  const visible = visibleOrdered.filter((id) => {
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });

  const result: ColumnConfig[] = visible.map((id, i) => ({
    id,
    visible: true,
    order: i,
  }));

  // Atributos NO listados → ocultos, al final del orden, en el orden del schema.
  let nextOrder = visible.length;
  for (const id of allIds) {
    if (!seen.has(id)) {
      result.push({ id, visible: false, order: nextOrder++ });
    }
  }
  return result;
}

function isDefaultColumnConfig(columns: ColumnConfig[], schema: ObjectSchema): boolean {
  if (columns.length !== schema.attributes.length) return false;
  for (let i = 0; i < schema.attributes.length; i++) {
    const col = columns[i];
    if (col.id !== schema.attributes[i].id) return false;
    if (!col.visible) return false;
    if (col.order !== i) return false;
  }
  return true;
}
