/**
 * Fetcher de filas para la vista `/organismos`.
 *
 * Devuelve un array de `OrganismRow` con los 15 atributos declarados en
 * `ORGANISMS_SCHEMA` (más `id`, `short_name`, `name` raw para renderizar la
 * celda primaria con avatar + título + subtítulo).
 *
 * Hace 4 queries en paralelo y mergea en memoria. Para ~50-200 organismos
 * el costo es despreciable. Si esto crece, mover a una RPC en Postgres.
 */

import { createClient } from "@/lib/supabase/server";

export type OrganismTipo = "nacional" | "internacional";

export type OrganismRow = {
  id: string;
  short_name: string | null;
  name: string;
  tipo: OrganismTipo;
  cuit: string | null;
  email_domain: string | null;
  contact_email: string | null;
  members_count: number;
  convenios_count: number;
  sol_activas: number;
  sol_total: number;
  last_activity: string | null;
  notes: string | null;
  active: boolean;
  odoo_partner_id: number | null;
  created_at: string;
  updated_at: string;
};

const ESTADOS_CERRADOS = new Set(["closed", "cancelled"]);

/**
 * Hasta que migremos `tipo` a una columna real en `organisms`, lo computamos
 * desde `short_name`. Estos 3 son los únicos organismos internacionales hoy.
 */
const INTERNACIONALES = new Set(["FAO", "BID", "FONTAGRO"]);

export async function getOrganismRows(): Promise<OrganismRow[]> {
  const supabase = await createClient();

  const [organisms, members, convenios, solicitudes] = await Promise.all([
    supabase
      .from("organisms")
      .select(
        "id, short_name, name, cuit, email_domain, contact_email, notes, active, odoo_partner_id, created_at, updated_at",
      )
      .order("short_name", { ascending: true }),
    supabase.from("organism_members").select("organism_id"),
    supabase
      .from("organism_convenios")
      .select("organism_id")
      .eq("visible", true),
    supabase
      .from("v_solicitudes_full")
      .select("organism_id, status, created_at")
      .limit(5000),
  ]);

  const membersCount = tally((members.data ?? []).map((r) => r.organism_id));
  const conveniosCount = tally(
    (convenios.data ?? []).map((r) => r.organism_id),
  );

  const solStats = new Map<
    string,
    { total: number; activas: number; lastActivity: string | null }
  >();
  for (const row of solicitudes.data ?? []) {
    const orgId = row.organism_id as string | null;
    if (!orgId) continue;
    const acc = solStats.get(orgId) ?? {
      total: 0,
      activas: 0,
      lastActivity: null,
    };
    acc.total += 1;
    if (row.status && !ESTADOS_CERRADOS.has(row.status as string)) {
      acc.activas += 1;
    }
    const ts = row.created_at as string | null;
    if (ts && (!acc.lastActivity || ts > acc.lastActivity)) {
      acc.lastActivity = ts;
    }
    solStats.set(orgId, acc);
  }

  return (organisms.data ?? []).map((o) => {
    const stats = solStats.get(o.id) ?? {
      total: 0,
      activas: 0,
      lastActivity: null,
    };
    return {
      id: o.id,
      short_name: o.short_name,
      name: o.name,
      tipo: INTERNACIONALES.has(o.short_name ?? "")
        ? "internacional"
        : "nacional",
      cuit: o.cuit,
      email_domain: o.email_domain,
      contact_email: o.contact_email,
      members_count: membersCount.get(o.id) ?? 0,
      convenios_count: conveniosCount.get(o.id) ?? 0,
      sol_activas: stats.activas,
      sol_total: stats.total,
      last_activity: stats.lastActivity,
      notes: o.notes,
      active: o.active,
      odoo_partner_id: o.odoo_partner_id,
      created_at: o.created_at,
      updated_at: o.updated_at,
    };
  });
}

export async function getOrganismRow(id: string): Promise<OrganismRow | null> {
  const all = await getOrganismRows();
  return all.find((r) => r.id === id) ?? null;
}

function tally(ids: Array<string | null>): Map<string, number> {
  const m = new Map<string, number>();
  for (const id of ids) {
    if (!id) continue;
    m.set(id, (m.get(id) ?? 0) + 1);
  }
  return m;
}
