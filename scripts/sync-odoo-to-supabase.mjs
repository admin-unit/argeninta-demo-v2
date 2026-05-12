#!/usr/bin/env node
/**
 * sync-odoo-to-supabase.mjs
 *
 * Importa datos de Odoo a las tablas cache de Supabase.
 * Corre periódicamente (cada 4h) o on-demand.
 *
 * Uso:
 *   node scripts/sync-odoo-to-supabase.mjs           # todo
 *   node scripts/sync-odoo-to-supabase.mjs --only=doc_types,journals
 *   node scripts/sync-odoo-to-supabase.mjs --skip=partners   # partners es lo más pesado
 *
 * Necesita en .env.local:
 *   ODOO_URL, ODOO_DB, ODOO_USERNAME, ODOO_PASSWORD
 *   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import path from "node:path";

// =============================================================================
// CARGAR .env.local manualmente (no usamos dotenv para no agregar dep)
// =============================================================================
function loadEnv() {
  const envPath = path.join(process.cwd(), ".env.local");
  try {
    const lines = readFileSync(envPath, "utf-8").split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      const value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
      if (!process.env[key]) process.env[key] = value;
    }
  } catch (e) {
    console.warn("⚠️  No se pudo leer .env.local:", e.message);
  }
}
loadEnv();

// =============================================================================
// PARSE ARGS
// =============================================================================
const args = process.argv.slice(2);
const only = args.find((a) => a.startsWith("--only="))?.split("=")[1]?.split(",") || null;
const skip = args.find((a) => a.startsWith("--skip="))?.split("=")[1]?.split(",") || [];

function shouldRun(entity) {
  if (only && !only.includes(entity)) return false;
  if (skip.includes(entity)) return false;
  return true;
}

// =============================================================================
// CLIENTES
// =============================================================================
const ODOO_URL = process.env.ODOO_URL;
const ODOO_DB = process.env.ODOO_DB;
const ODOO_USER = process.env.ODOO_USERNAME;
const ODOO_PASS = process.env.ODOO_PASSWORD;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!ODOO_URL || !ODOO_DB || !ODOO_USER || !ODOO_PASS) {
  console.error("❌ Falta config de Odoo");
  process.exit(1);
}
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("❌ Falta config de Supabase");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// =============================================================================
// ODOO CLIENT (mínimo)
// =============================================================================
let odooUid = null;

async function odooCall(service, method, args) {
  const res = await fetch(`${ODOO_URL}/jsonrpc`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      method: "call",
      params: { service, method, args },
    }),
  });
  const json = await res.json();
  if (json.error) {
    const msg = json.error.data?.message || json.error.message;
    throw new Error(`Odoo ${msg}`);
  }
  return json.result;
}

async function odooAuth() {
  if (odooUid) return odooUid;
  odooUid = await odooCall("common", "authenticate", [ODOO_DB, ODOO_USER, ODOO_PASS, {}]);
  if (!odooUid) throw new Error("Odoo auth failed");
  return odooUid;
}

async function odooSearchRead(model, domain = [], options = {}) {
  await odooAuth();
  const kwargs = {};
  if (options.fields) kwargs.fields = options.fields;
  if (options.limit !== undefined) kwargs.limit = options.limit;
  if (options.offset !== undefined) kwargs.offset = options.offset;
  if (options.order) kwargs.order = options.order;
  return odooCall("object", "execute_kw", [
    ODOO_DB,
    odooUid,
    ODOO_PASS,
    model,
    "search_read",
    [domain],
    kwargs,
  ]);
}

async function odooSearchCount(model, domain = []) {
  await odooAuth();
  return odooCall("object", "execute_kw", [
    ODOO_DB,
    odooUid,
    ODOO_PASS,
    model,
    "search_count",
    [domain],
  ]);
}

// =============================================================================
// HELPERS
// =============================================================================
async function logSync(entity, fn) {
  if (!shouldRun(entity)) {
    console.log(`⏭️  Skip ${entity}`);
    return;
  }
  const started = new Date();
  console.log(`\n🔄 [${entity}] arrancando...`);
  const startedMs = Date.now();
  try {
    const count = await fn();
    const duration = Date.now() - startedMs;
    console.log(`✅ [${entity}] ${count} registros en ${duration}ms`);
    await supabase.from("odoo_sync_log").insert({
      entity,
      records_synced: count,
      duration_ms: duration,
      status: "success",
      started_at: started.toISOString(),
      finished_at: new Date().toISOString(),
    });
  } catch (e) {
    const duration = Date.now() - startedMs;
    console.error(`❌ [${entity}] error: ${e.message}`);
    await supabase.from("odoo_sync_log").insert({
      entity,
      records_synced: 0,
      duration_ms: duration,
      status: "error",
      error_message: e.message,
      started_at: started.toISOString(),
      finished_at: new Date().toISOString(),
    });
    throw e;
  }
}

async function batchUpsert(table, rows, conflictKey, batchSize = 500) {
  let total = 0;
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const { error } = await supabase.from(table).upsert(batch, { onConflict: conflictKey });
    if (error) throw new Error(`upsert ${table}: ${error.message}`);
    total += batch.length;
    if (rows.length > batchSize) {
      process.stdout.write(`\r   ${table}: ${total}/${rows.length}`);
    }
  }
  if (rows.length > batchSize) process.stdout.write("\n");
  return total;
}

// =============================================================================
// ENTIDADES A SINCRONIZAR
// =============================================================================

async function syncDocTypes() {
  const docs = await odooSearchRead(
    "l10n_latam.document.type",
    [["country_id.code", "=", "AR"]],
    { fields: ["code", "name", "doc_code_prefix", "internal_type"], limit: 200 }
  );
  const rows = docs.map((d) => ({
    odoo_id: d.id,
    code: d.code || null,
    name: d.name,
    doc_code_prefix: d.doc_code_prefix || null,
    internal_type: d.internal_type || null,
    country_code: "AR",
    raw_data: d,
  }));
  return batchUpsert("odoo_doc_types", rows, "odoo_id");
}

async function syncJournals() {
  const journals = await odooSearchRead(
    "account.journal",
    [["active", "=", true]],
    {
      fields: ["name", "code", "type", "default_account_id", "currency_id"],
      limit: 500,
    }
  );
  const rows = journals.map((j) => ({
    odoo_id: j.id,
    name: j.name,
    code: j.code || null,
    journal_type: j.type,
    default_account_id: j.default_account_id ? j.default_account_id[0] : null,
    default_account_name: j.default_account_id ? j.default_account_id[1] : null,
    currency_code: j.currency_id ? j.currency_id[1] : null,
    active: true,
    raw_data: j,
  }));
  return batchUpsert("odoo_journals", rows, "odoo_id");
}

async function syncAccounts() {
  // Solo cuentas relevantes (no las 700 enteras)
  const accs = await odooSearchRead(
    "account.account",
    [["account_type", "in", ["liability_payable", "expense", "asset_cash", "asset_current", "liability_current", "income"]]],
    { fields: ["code", "name", "account_type"], limit: 2000 }
  );
  const rows = accs.map((a) => ({
    odoo_id: a.id,
    code: a.code,
    name: a.name,
    account_type: a.account_type,
    raw_data: a,
  }));
  return batchUpsert("odoo_accounts", rows, "odoo_id");
}

async function syncProducts() {
  const prods = await odooSearchRead(
    "product.product",
    [],
    {
      fields: ["name", "default_code", "type", "categ_id", "list_price", "purchase_ok"],
      limit: 500,
    }
  );
  const rows = prods.map((p) => ({
    odoo_id: p.id,
    name: p.name,
    default_code: p.default_code || null,
    product_type: p.type || null,
    categ_id: p.categ_id ? p.categ_id[0] : null,
    categ_name: p.categ_id ? p.categ_id[1] : null,
    list_price: p.list_price || 0,
    purchase_ok: p.purchase_ok ?? true,
    raw_data: p,
  }));
  return batchUpsert("odoo_products", rows, "odoo_id");
}

async function syncAnalyticAccounts() {
  // Plan id 2 = "Convenios" (lo vimos en exploración previa)
  const aas = await odooSearchRead(
    "account.analytic.account",
    [["active", "=", true]],
    {
      fields: ["code", "name", "plan_id", "balance", "partner_id"],
      limit: 5000,
    }
  );
  const rows = aas.map((a) => ({
    odoo_id: a.id,
    code: a.code || null,
    name: a.name,
    plan_id: a.plan_id ? a.plan_id[0] : null,
    plan_name: a.plan_id ? a.plan_id[1] : null,
    balance: a.balance || 0,
    partner_odoo_id: a.partner_id ? a.partner_id[0] : null,
    active: true,
    raw_data: a,
  }));
  return batchUpsert("odoo_analytic_accounts", rows, "odoo_id", 1000);
}

async function syncPartners() {
  // Empresas (proveedores + organismos). 65k entries — paginamos.
  const total = await odooSearchCount("res.partner", [["is_company", "=", true]]);
  console.log(`   partners empresas en Odoo: ${total}`);
  const pageSize = 2000;
  let synced = 0;
  for (let offset = 0; offset < total; offset += pageSize) {
    const partners = await odooSearchRead(
      "res.partner",
      [["is_company", "=", true]],
      {
        fields: ["name", "vat", "email", "phone", "parent_id", "country_id", "supplier_rank", "customer_rank", "active"],
        limit: pageSize,
        offset,
        order: "id",
      }
    );
    if (partners.length === 0) break;
    const rows = partners.map((p) => ({
      odoo_id: p.id,
      name: p.name || `(sin nombre #${p.id})`,
      vat: p.vat || null,
      email: p.email || null,
      phone: p.phone || null,
      is_company: true,
      parent_id: p.parent_id ? p.parent_id[0] : null,
      country_code: p.country_id ? p.country_id[1] : null,
      supplier_rank: p.supplier_rank || 0,
      customer_rank: p.customer_rank || 0,
      active: p.active ?? true,
      raw_data: p,
    }));
    await batchUpsert("odoo_partners", rows, "odoo_id", 500);
    synced += rows.length;
    process.stdout.write(`\r   partners: ${synced}/${total}`);
  }
  process.stdout.write("\n");
  return synced;
}

async function syncInternalUsers() {
  // Importa los usuarios internos (no portal) de Odoo a profiles.
  // Crea auth.users via Admin API y profile asociado.
  const users = await odooSearchRead(
    "res.users",
    [["share", "=", false], ["active", "=", true]],
    {
      fields: ["name", "login", "partner_id", "active", "login_date"],
      limit: 200,
    }
  );

  let created = 0;
  let skipped = 0;
  for (const u of users) {
    if (!u.login || !u.login.includes("@")) {
      skipped++;
      continue;
    }

    // Buscar si ya existe
    const { data: existing } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", u.login.toLowerCase())
      .maybeSingle();

    if (existing) {
      // Actualizar metadata
      await supabase
        .from("profiles")
        .update({
          full_name: u.name,
          odoo_user_id: u.id,
          user_type: "interno",
        })
        .eq("id", existing.id);
      continue;
    }

    // Crear auth user
    const { data: authUser, error: authErr } = await supabase.auth.admin.createUser({
      email: u.login.toLowerCase(),
      email_confirm: true,
    });

    if (authErr || !authUser?.user) {
      console.warn(`   ⚠️  no se pudo crear ${u.login}: ${authErr?.message}`);
      skipped++;
      continue;
    }

    // Crear profile
    const { error: profileErr } = await supabase.from("profiles").insert({
      id: authUser.user.id,
      email: u.login.toLowerCase(),
      full_name: u.name,
      user_type: "interno",
      odoo_user_id: u.id,
      active: true,
    });

    if (profileErr) {
      console.warn(`   ⚠️  profile ${u.login}: ${profileErr.message}`);
      skipped++;
    } else {
      created++;
    }
  }
  console.log(`   creados: ${created}, skipped: ${skipped}, ya existían: ${users.length - created - skipped}`);
  return created;
}

// =============================================================================
// MAIN
// =============================================================================
async function main() {
  console.log("🚀 sync-odoo-to-supabase.mjs");
  console.log(`   Odoo: ${ODOO_URL}`);
  console.log(`   Supabase: ${SUPABASE_URL}`);

  try {
    await odooAuth();
    console.log(`✓ Odoo auth OK (uid=${odooUid})`);
  } catch (e) {
    console.error(`❌ Odoo auth: ${e.message}`);
    process.exit(1);
  }

  // Ordenamos de chico a grande
  await logSync("doc_types", syncDocTypes);
  await logSync("journals", syncJournals);
  await logSync("accounts", syncAccounts);
  await logSync("products", syncProducts);
  await logSync("analytic_accounts", syncAnalyticAccounts);
  await logSync("internal_users", syncInternalUsers);
  await logSync("partners", syncPartners);

  console.log("\n✨ Sync completo");
}

main().catch((e) => {
  console.error("\n💥 Error fatal:", e);
  process.exit(1);
});
