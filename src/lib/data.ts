/**
 * src/lib/data.ts
 *
 * Queries server-side a Supabase con tipos. Usar desde Server Components
 * y Server Actions. Reemplaza progresivamente a mock-data.ts.
 */

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// =============================================================================
// USUARIO ACTUAL Y PERFIL
// =============================================================================

export async function getCurrentUser() {
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
}

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
  assigned_user_id?: string;
  created_by_user_id?: string;
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
  if (filters.assigned_user_id) q = q.eq("assigned_user_id", filters.assigned_user_id);
  if (filters.created_by_user_id) q = q.eq("created_by_user_id", filters.created_by_user_id);
  if (filters.search) {
    q = q.or(
      `numero_expediente.ilike.%${filters.search}%,concepto.ilike.%${filters.search}%`
    );
  }

  const { data } = await q;
  return data || [];
}

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
