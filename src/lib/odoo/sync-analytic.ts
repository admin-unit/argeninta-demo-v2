/**
 * Sync de cuentas analíticas desde Odoo → tabla cache odoo_analytic_accounts.
 *
 * Trae:
 *   - account.analytic.account (con parent_id para jerarquía)
 *   - account.move.line agregado por analytic_distribution → balance financiero (cash basis)
 *
 * El balance "general" (devengado) viene del campo balance del propio analytic
 * (que ya considera move_lines con state=posted).
 *
 * Idempotente: usa upsert por odoo_id.
 *
 * Llamar desde /api/admin/sync-analytic (super_admin only) o de un cron.
 */

import { searchRead } from "@/lib/odoo/client";
import { createAdminClient } from "@/lib/supabase/admin";

type OdooAnalyticRow = {
  id: number;
  code: string | false;
  name: string;
  plan_id: [number, string] | false;
  balance: number;
  partner_id: [number, string] | false;
  parent_id: [number, string] | false;
  active: boolean;
};

type OdooMoveLineAggRow = {
  analytic_distribution: Record<string, number> | false;
  balance: number;
  parent_state: string;
  payment_state?: string;
};

interface SyncResult {
  total: number;
  upserted: number;
  withParent: number;
  errors: string[];
}

export async function syncAnalyticAccounts(): Promise<SyncResult> {
  const errors: string[] = [];

  // 1. Leer todas las cuentas analíticas activas.
  const rows = await searchRead<OdooAnalyticRow>(
    "account.analytic.account",
    [["active", "=", true]],
    {
      fields: [
        "id",
        "code",
        "name",
        "plan_id",
        "balance",
        "partner_id",
        "parent_id",
        "active",
      ],
      limit: 5000,
    }
  );

  // 2. Calcular saldo financiero (cash basis) sumando payment_lines por analítica.
  //    Estrategia: traer move_lines de pagos efectivos y agruparlos por analytic_id
  //    presente en su analytic_distribution.
  let paymentLines: OdooMoveLineAggRow[] = [];
  try {
    paymentLines = await searchRead<OdooMoveLineAggRow>(
      "account.move.line",
      [
        ["parent_state", "=", "posted"],
        ["payment_id", "!=", false],
        ["analytic_distribution", "!=", false],
      ],
      {
        fields: ["analytic_distribution", "balance"],
        limit: 50000,
      }
    );
  } catch (e) {
    // Si payment_id no aplica como filtro o la query es muy pesada, no rompemos
    // el sync entero. Queda balance_financiero en null.
    errors.push(
      `No se pudo calcular balance_financiero: ${e instanceof Error ? e.message : String(e)}`
    );
  }

  const financieroPorId = new Map<number, number>();
  for (const line of paymentLines) {
    if (!line.analytic_distribution) continue;
    for (const [analyticIdStr, percent] of Object.entries(
      line.analytic_distribution
    )) {
      const analyticId = Number(analyticIdStr);
      if (!Number.isFinite(analyticId)) continue;
      const share = (Number(line.balance) * Number(percent)) / 100;
      financieroPorId.set(
        analyticId,
        (financieroPorId.get(analyticId) ?? 0) + share
      );
    }
  }

  // 3. Construir hierarchy_path y level.
  const byId = new Map<number, OdooAnalyticRow>(rows.map((r) => [r.id, r]));

  function pathFor(id: number): { path: string; level: number } {
    const visited = new Set<number>();
    const segments: string[] = [];
    let curr: number | null = id;
    while (curr !== null && !visited.has(curr)) {
      visited.add(curr);
      const node = byId.get(curr);
      if (!node) break;
      const seg = (typeof node.code === "string" && node.code) || node.name;
      segments.unshift(seg);
      curr = node.parent_id ? node.parent_id[0] : null;
    }
    return { path: segments.join(" / "), level: Math.max(0, segments.length - 1) };
  }

  const withParent = rows.filter((r) => r.parent_id).length;

  // 4. Upsert en Supabase.
  const supabase = createAdminClient();
  const payload = rows.map((r) => {
    const { path, level } = pathFor(r.id);
    return {
      odoo_id: r.id,
      code: typeof r.code === "string" ? r.code : null,
      name: r.name,
      plan_id: r.plan_id ? r.plan_id[0] : null,
      plan_name: r.plan_id ? r.plan_id[1] : null,
      balance: r.balance ?? 0,
      balance_devengado: r.balance ?? 0,
      balance_financiero: financieroPorId.get(r.id) ?? null,
      partner_odoo_id: r.partner_id ? r.partner_id[0] : null,
      parent_odoo_id: r.parent_id ? r.parent_id[0] : null,
      hierarchy_path: path,
      hierarchy_level: level,
      active: r.active,
      raw_data: r as unknown as Record<string, unknown>,
      synced_at: new Date().toISOString(),
    };
  });

  // Upsert en chunks de 500 para no exceder límites.
  let upserted = 0;
  for (let i = 0; i < payload.length; i += 500) {
    const chunk = payload.slice(i, i + 500);
    const { error } = await supabase
      .from("odoo_analytic_accounts")
      .upsert(chunk, { onConflict: "odoo_id" });
    if (error) {
      errors.push(`Upsert chunk ${i}: ${error.message}`);
    } else {
      upserted += chunk.length;
    }
  }

  return { total: rows.length, upserted, withParent, errors };
}
