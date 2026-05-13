/**
 * src/lib/data.ts
 *
 * Queries server-side a Supabase con tipos. Usar desde Server Components
 * y Server Actions. Reemplaza progresivamente a mock-data.ts.
 */

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// =============================================================================
// CONSTANTES — UUIDs estables del seed (migration 0004_seed_areas.sql)
// =============================================================================

export const AREA_IDS = {
  DIRECCION:         "11111111-1111-1111-1111-111111111111",
  GERENCIA_ADMIN:    "22222222-2222-2222-2222-222222222222",
  MESA_ENTRADA:      "33333333-3333-3333-3333-333333333333",
  ADMINISTRACION:    "44444444-4444-4444-4444-444444444444",
  TESORERIA:         "55555555-5555-5555-5555-555555555555",
  COMPRAS:           "66666666-6666-6666-6666-666666666666",
  INTERNACIONAL:     "77777777-7777-7777-7777-777777777777",
  JURIDICOS:         "88888888-8888-8888-8888-888888888888",
  CAPITAL_HUMANO:    "99999999-9999-9999-9999-999999999999",
} as const;

/** Áreas que componen la "Bandeja Nacional" en el sidebar de Luki */
export const AREAS_NACIONAL = [
  AREA_IDS.MESA_ENTRADA,
  AREA_IDS.ADMINISTRACION,
  AREA_IDS.TESORERIA,
  AREA_IDS.COMPRAS,
];

/** Áreas que componen la "Bandeja Internacional" */
export const AREAS_INTERNACIONAL = [AREA_IDS.INTERNACIONAL];

// =============================================================================
// USUARIO ACTUAL Y PERFIL
// =============================================================================

// Deduplicado por request: layout + page + actions del mismo SSR comparten el resultado.
export const getCurrentUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  return profile;
});

export async function getCurrentUserOrThrow() {
  const profile = await getCurrentUser();
  if (!profile) throw new Error("No hay user logueado");
  return profile;
}

// =============================================================================
// ORGANISMOS DEL USUARIO (para externos)
// =============================================================================

export async function getOrganismsForUser(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("organism_members")
    .select("role, organism:organisms(id, name, short_name, cuit, email_domain, contact_email)")
    .eq("user_id", userId);
  return data || [];
}

// =============================================================================
// CONVENIOS VISIBLES POR ORGANISMO
// =============================================================================

export async function getConveniosForOrganism(organismId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("organism_convenios")
    .select(`
      odoo_analytic_account_id,
      code,
      name,
      display_alias,
      fuente_financiamiento,
      analytic:odoo_analytic_accounts(balance, plan_name)
    `)
    .eq("organism_id", organismId)
    .eq("visible", true)
    .order("name", { ascending: true })
    .limit(500);
  return data || [];
}

// =============================================================================
// SOLICITUDES
// =============================================================================

export interface SolicitudFilters {
  organism_id?: string;
  status?: string[];
  current_area_id?: string;
  current_area_ids?: string[];
  assigned_user_id?: string;
  created_by_user_id?: string;
  tipo_slug?: string;
  search?: string;
  limit?: number;
}

export async function getSolicitudes(filters: SolicitudFilters = {}) {
  const supabase = await createClient();
  let q = supabase
    .from("v_solicitudes_full")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(filters.limit ?? 100);

  if (filters.organism_id) q = q.eq("organism_id", filters.organism_id);
  if (filters.status?.length) q = q.in("status", filters.status);
  if (filters.current_area_id) q = q.eq("current_area_id", filters.current_area_id);
  if (filters.current_area_ids?.length) q = q.in("current_area_id", filters.current_area_ids);
  if (filters.assigned_user_id) q = q.eq("assigned_user_id", filters.assigned_user_id);
  if (filters.created_by_user_id) q = q.eq("created_by_user_id", filters.created_by_user_id);
  if (filters.tipo_slug) q = q.eq("tipo_slug", filters.tipo_slug);
  if (filters.search) {
    q = q.or(
      `numero_expediente.ilike.%${filters.search}%,concepto.ilike.%${filters.search}%`
    );
  }

  const { data } = await q;
  return data || [];
}

// =============================================================================
// AUDIT LOG — timeline de una solicitud
// =============================================================================

export interface AuditLogEvent {
  id: number;
  event_type: string;
  description: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  user: { id: string; full_name: string | null; email: string } | null;
  area: { id: string; name: string } | null;
}

export async function getAuditLogForSolicitud(
  solicitudId: string
): Promise<AuditLogEvent[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("audit_log")
    .select(`
      id, event_type, description, metadata, created_at,
      user:profiles!audit_log_user_id_fkey(id, full_name, email),
      area:internal_areas(id, name)
    `)
    .eq("solicitud_id", solicitudId)
    .order("created_at", { ascending: true });
  // Supabase devuelve las relaciones como array cuando no hay PK directa;
  // normalizamos al primer elemento.
  return (data || []).map((row) => ({
    id: row.id as number,
    event_type: row.event_type as string,
    description: (row.description as string) ?? null,
    metadata: (row.metadata as Record<string, unknown>) ?? null,
    created_at: row.created_at as string,
    user: Array.isArray(row.user) ? row.user[0] ?? null : (row.user ?? null),
    area: Array.isArray(row.area) ? row.area[0] ?? null : (row.area ?? null),
  }));
}

// =============================================================================
// CONTEXTO DE PERFIL — perfil + organismo primario + área primaria
// =============================================================================

export interface ProfileContext {
  profile: {
    id: string;
    email: string;
    full_name: string | null;
    avatar_url: string | null;
    user_type: "interno" | "externo";
    is_super_admin: boolean;
    odoo_user_id: number | null;
  } | null;
  primary_organism: {
    id: string;
    name: string;
    short_name: string | null;
    role: string;
  } | null;
  primary_area: {
    id: string;
    name: string;
    role: string;
  } | null;
}

export const getCurrentProfileWithContext = cache(async (): Promise<ProfileContext> => {
  const profile = await getCurrentUser();
  if (!profile) return { profile: null, primary_organism: null, primary_area: null };

  const supabase = await createClient();
  const [{ data: orgMem }, { data: areaMem }] = await Promise.all([
    supabase
      .from("organism_members")
      .select("role, organism:organisms(id, name, short_name)")
      .eq("user_id", profile.id)
      .limit(1)
      .maybeSingle(),
    supabase
      .from("internal_area_members")
      .select("role, is_primary, area:internal_areas(id, name)")
      .eq("user_id", profile.id)
      .order("is_primary", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const organism = (orgMem?.organism ?? null) as
    | { id: string; name: string; short_name: string | null }
    | null;
  const area = (areaMem?.area ?? null) as { id: string; name: string } | null;

  return {
    profile,
    primary_organism: organism
      ? { ...organism, role: (orgMem?.role as string) ?? "solicitante" }
      : null,
    primary_area: area
      ? { ...area, role: (areaMem?.role as string) ?? "miembro" }
      : null,
  };
});

export async function getSolicitudById(id: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("v_solicitudes_full")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return data;
}

// =============================================================================
// TIPOS DE GESTIÓN
// =============================================================================

export async function getTiposGestion() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("tipos_gestion")
    .select("*")
    .eq("active", true)
    .order("sort_order", { ascending: true });
  return data || [];
}

// =============================================================================
// ORGANIGRAMA INTERNO
// =============================================================================

export async function getInternalAreas() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("internal_areas")
    .select("*")
    .eq("active", true)
    .order("sort_order", { ascending: true });
  return data || [];
}

export async function getAreaMembers(areaId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("internal_area_members")
    .select("role, is_primary, user:profiles(id, email, full_name, avatar_url, active)")
    .eq("area_id", areaId);
  return data || [];
}

// =============================================================================
// ORGANISMOS (catálogo)
// =============================================================================

export async function getAllOrganisms() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("organisms")
    .select("*")
    .eq("active", true)
    .order("short_name", { ascending: true });
  return data || [];
}

// =============================================================================
// PARTNERS (proveedores) — buscar por CUIT o nombre
// =============================================================================

export async function searchPartners(query: string, limit = 20) {
  if (!query || query.length < 2) return [];
  const supabase = await createClient();

  // Buscar por CUIT exacto o por nombre fuzzy
  const isCuit = /^\d{2}-?\d{8}-?\d{1}$/.test(query.replace(/\D/g, "")) && query.replace(/\D/g, "").length === 11;

  let q = supabase
    .from("odoo_partners")
    .select("odoo_id, name, vat, email, phone, is_company")
    .eq("active", true)
    .limit(limit);

  if (isCuit) {
    q = q.eq("vat", query.replace(/\D/g, ""));
  } else {
    q = q.ilike("name", `%${query}%`);
  }

  const { data } = await q;
  return data || [];
}

// =============================================================================
// PRODUCTOS (categorías de gasto)
// =============================================================================

export async function getProductsForExternal() {
  // Solo productos "G3" (gastos de convenios) visibles para externos
  const supabase = await createClient();
  const { data } = await supabase
    .from("odoo_products")
    .select("odoo_id, name, default_code, product_type, categ_name")
    .ilike("categ_name", "%G3%")
    .order("name", { ascending: true });
  return data || [];
}

export async function getAllProducts() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("odoo_products")
    .select("odoo_id, name, default_code, product_type, categ_name")
    .order("categ_name", { ascending: true });
  return data || [];
}

// =============================================================================
// JOURNALS (cuentas bancarias) — para admin
// =============================================================================

export async function getBankJournals() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("odoo_journals")
    .select("odoo_id, name, code, default_account_name")
    .eq("journal_type", "bank")
    .eq("active", true)
    .order("name", { ascending: true });
  return data || [];
}

// =============================================================================
// TIPOS DE DOCUMENTO ARGENTINOS
// =============================================================================

export async function getInvoiceDocTypes() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("odoo_doc_types")
    .select("odoo_id, code, name, doc_code_prefix")
    .eq("internal_type", "invoice")
    .eq("country_code", "AR")
    .order("doc_code_prefix", { ascending: true });
  return data || [];
}

// =============================================================================
// SALDOS / RESUMEN POR ORGANISMO (para dashboard externo)
// =============================================================================

export async function getResumenForOrganism(organismId: string) {
  const supabase = await createClient();

  // Convenios visibles con saldos
  const { data: convenios } = await supabase
    .from("organism_convenios")
    .select(`
      odoo_analytic_account_id, code, name, fuente_financiamiento,
      analytic:odoo_analytic_accounts(balance)
    `)
    .eq("organism_id", organismId)
    .eq("visible", true)
    .limit(1000);

  // Solicitudes del organismo
  const { data: solicitudes } = await supabase
    .from("v_solicitudes_full")
    .select("id, status, importe, moneda")
    .eq("organism_id", organismId);

  const sols = solicitudes || [];
  const conv = convenios || [];

  // Helper: extraer balance del campo relacional (Supabase devuelve array o objeto)
  const getBalance = (
    a: { balance: number } | { balance: number }[] | null | undefined
  ): number => {
    if (!a) return 0;
    if (Array.isArray(a)) return Number(a[0]?.balance) || 0;
    return Number(a.balance) || 0;
  };

  // Calcular agregados
  const totalSaldo = conv.reduce((sum, c) => sum + getBalance(c.analytic), 0);
  const enProceso = sols.filter((s) =>
    ["submitted", "in_review", "in_progress", "posted_to_odoo", "in_payment"].includes(
      s.status as string
    )
  ).length;
  const completadas = sols.filter((s) => s.status === "closed").length;
  const cancelled = sols.filter((s) => s.status === "cancelled").length;
  const pendienteSaldo = sols
    .filter((s) =>
      ["submitted", "in_review", "in_progress", "posted_to_odoo", "in_payment"].includes(
        s.status as string
      )
    )
    .reduce((sum, s) => sum + (Number(s.importe) || 0), 0);

  return {
    convenios: conv,
    totalSaldo,
    enProceso,
    completadas,
    cancelled,
    pendienteSaldo,
    totalSolicitudes: sols.length,
  };
}

// =============================================================================
// CONVENIOS — catálogo global (admin) y por usuario (externo)
// =============================================================================

export async function getAllConvenios(limit = 200) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("organism_convenios")
    .select(`
      odoo_analytic_account_id, code, name, display_alias,
      fuente_financiamiento, visible,
      organism:organisms(id, short_name, name),
      analytic:odoo_analytic_accounts(balance, plan_name)
    `)
    .eq("visible", true)
    .order("code", { ascending: true })
    .limit(limit);
  return data || [];
}

export async function getConveniosForUser(userId: string) {
  const supabase = await createClient();
  const { data: orgs } = await supabase
    .from("organism_members")
    .select("organism_id")
    .eq("user_id", userId);
  const orgIds = (orgs || []).map((o) => o.organism_id);
  if (orgIds.length === 0) return [];

  const { data } = await supabase
    .from("organism_convenios")
    .select(`
      odoo_analytic_account_id, code, name, display_alias,
      fuente_financiamiento, organism_id,
      organism:organisms(short_name, name),
      analytic:odoo_analytic_accounts(balance)
    `)
    .in("organism_id", orgIds)
    .eq("visible", true)
    .order("name", { ascending: true })
    .limit(500);
  return data || [];
}

// =============================================================================
// COUNTS — solicitudes por organismo (para tabla de organismos)
// =============================================================================

export async function getSolicitudCountByOrganism() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("v_solicitudes_full")
    .select("organism_id, status")
    .limit(5000);

  const counts = new Map<string, { total: number; activas: number }>();
  for (const row of data || []) {
    const key = row.organism_id as string | null;
    if (!key) continue;
    const acc = counts.get(key) || { total: 0, activas: 0 };
    acc.total += 1;
    if (
      row.status &&
      !["closed", "cancelled"].includes(row.status as string)
    )
      acc.activas += 1;
    counts.set(key, acc);
  }
  return counts;
}

// =============================================================================
// RESUMEN GLOBAL para admin/super-admin
// =============================================================================

export async function getGlobalSummary() {
  const supabase = await createClient();

  const [
    { count: totalSolicitudes },
    { count: enProceso },
    { count: completadas },
    { data: porArea },
  ] = await Promise.all([
    supabase.from("solicitudes").select("*", { count: "exact", head: true }),
    supabase
      .from("solicitudes")
      .select("*", { count: "exact", head: true })
      .in("status", ["submitted", "in_review", "in_progress", "posted_to_odoo", "in_payment"]),
    supabase
      .from("solicitudes")
      .select("*", { count: "exact", head: true })
      .eq("status", "closed"),
    supabase
      .from("v_solicitudes_full")
      .select("current_area_name, status")
      .limit(1000),
  ]);

  return {
    totalSolicitudes: totalSolicitudes || 0,
    enProceso: enProceso || 0,
    completadas: completadas || 0,
    porArea: porArea || [],
  };
}
