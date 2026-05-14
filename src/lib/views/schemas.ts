/**
 * Registry de `ObjectSchema` — un schema por Object listable.
 *
 * Cada schema declara los atributos visibles en la tabla, tipados. Las celdas y
 * los operadores de filtro futuro se derivan del tipo.
 *
 * Para v1 vive solamente `organisms`. A medida que migremos `/convenios`, `/facturas`,
 * etc, se suman acá.
 */

import type { ObjectSchema } from "./types";

export const ORGANISMS_SCHEMA: ObjectSchema = {
  slug: "organisms",
  label: "Organismo",
  pluralLabel: "Organismos",
  primaryAttribute: "organismo",
  detailUrl: (id) => `/organismos/${id}`,
  attributes: [
    {
      id: "organismo",
      label: "Organismo",
      type: "text",
      width: 280,
      description: "Avatar + short_name + name completo",
    },
    {
      id: "tipo",
      label: "Tipo",
      type: "select",
      width: 130,
      options: [
        { value: "nacional", label: "Nacional", color: "blue" },
        { value: "internacional", label: "Internacional", color: "violet" },
      ],
    },
    { id: "cuit", label: "CUIT", type: "text", width: 140 },
    { id: "email_domain", label: "Dominio", type: "text", width: 170 },
    { id: "contact_email", label: "Email contacto", type: "email", width: 220 },
    { id: "members_count", label: "Miembros", type: "number", width: 100 },
    { id: "convenios_count", label: "Convenios", type: "number", width: 100 },
    { id: "sol_activas", label: "Sol. activas", type: "number", width: 110 },
    { id: "sol_total", label: "Sol. total", type: "number", width: 100 },
    { id: "last_activity", label: "Última actividad", type: "date", width: 150 },
    { id: "notes", label: "Notas", type: "text", width: 260 },
    { id: "active", label: "Activo", type: "boolean", width: 90 },
    { id: "odoo_partner_id", label: "Odoo partner ID", type: "number", width: 130 },
    { id: "created_at", label: "Creado", type: "date", width: 120 },
    { id: "updated_at", label: "Actualizado", type: "date", width: 120 },
  ],
};

export const SCHEMA_REGISTRY: Record<string, ObjectSchema> = {
  organisms: ORGANISMS_SCHEMA,
};

export function getSchema(slug: string): ObjectSchema {
  const schema = SCHEMA_REGISTRY[slug];
  if (!schema) throw new Error(`No ObjectSchema registered for slug "${slug}"`);
  return schema;
}
