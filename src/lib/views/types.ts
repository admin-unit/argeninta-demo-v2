/**
 * Tipos base del sistema de Vistas (estilo Attio).
 *
 * Tres conceptos:
 *   - `Attribute`   → una columna del Object (tipada).
 *   - `ObjectSchema` → la lista de atributos + metadata de un Object (organisms, convenios, ...).
 *   - `ViewConfig`  → el state visual de una vista (sort, columnas visibles/orden, tipo, density, groupBy).
 *
 * El `ViewConfig` se persiste en URL search params (source of truth en v1). Cuando se
 * implemente "Save as view" en v2+, se snapshotea a la tabla `object_views` en Supabase.
 */

export type AttributeType =
  | "text"
  | "number"
  | "currency"
  | "boolean"
  | "date"
  | "datetime"
  | "select"
  | "multiselect"
  | "reference"
  | "user"
  | "url"
  | "email";

export type SelectOption = {
  value: string;
  label: string;
  /** Tailwind color slug (`blue`, `violet`, `amber`, `emerald`, `zinc`...). Render decide intensidades. */
  color?: string;
};

export type Attribute = {
  /** Slug estable. Se usa en URL y en `ColumnConfig.id`. */
  id: string;
  label: string;
  type: AttributeType;
  /** Ancho default en px. El user lo puede sobreescribir via resize. */
  width?: number;
  /** Para `select` y `multiselect`. */
  options?: SelectOption[];
  /** Para `reference`: slug del Object referenciado. */
  referenceObject?: string;
  /** Alineación de la celda. Defaults: number/currency → right, boolean → center, resto → left. */
  align?: "left" | "right" | "center";
  /** Si está, override del default render. Útil para columnas derivadas. */
  description?: string;
};

export type ObjectSchema = {
  slug: string;
  label: string;
  pluralLabel: string;
  /** ID del atributo "título". Drives navegación, kanban card title, primary cell. */
  primaryAttribute: string;
  /** Función que devuelve la URL de detalle del record. */
  detailUrl: (id: string) => string;
  attributes: Attribute[];
};

export type SortDirection = "asc" | "desc";

export type SortKey = {
  attribute: string;
  direction: SortDirection;
};

export type ColumnConfig = {
  id: string;
  visible: boolean;
  /** Posición en la tabla (0 = primera columna). */
  order: number;
  /** Override del width default del Attribute. */
  width?: number;
};

export type ViewType = "table" | "kanban";

export type Density = "compact" | "comfortable";

export type ViewConfig = {
  type: ViewType;
  sort: SortKey[];
  /** Cobertura completa: una entrada por cada atributo del schema. */
  columns: ColumnConfig[];
  density: Density;
  /** Obligatorio si type === "kanban". ID de un atributo `select` o `boolean`. */
  groupBy?: string;
};

/**
 * Devuelve el `ViewConfig` default para un Object: todos visibles, orden del schema,
 * sin sort, type table, density comfortable, no groupBy.
 */
export function defaultViewConfig(schema: ObjectSchema): ViewConfig {
  return {
    type: "table",
    sort: [],
    columns: schema.attributes.map((attr, i) => ({
      id: attr.id,
      visible: true,
      order: i,
    })),
    density: "comfortable",
  };
}
