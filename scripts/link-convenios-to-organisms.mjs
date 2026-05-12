#!/usr/bin/env node
/**
 * link-convenios-to-organisms.mjs
 *
 * Auto-vincula cuentas analíticas (convenios) a organismos en organism_convenios.
 *
 * Estrategia de matching:
 *   A) Si el convenio tiene partner_odoo_id y matchea con organism.odoo_partner_id
 *   B) Por patrón de código:
 *       - "10.BID.*" → BID
 *       - "1.X" donde fuente=FONTAGRO en el listado de Excel → FONTAGRO
 *       - Los 5.2.* genéricos → INTA (es el organismo ejecutor por default)
 *   C) Para el resto, los dejamos sin vincular (un admin los vincula manual)
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
const env = readFileSync(".env.local", "utf-8");
for (const line of env.split("\n")) {
  if (!line.trim() || line.startsWith("#")) continue;
  const [k, ...v] = line.split("=");
  if (k && v.length) process.env[k.trim()] = v.join("=").trim();
}
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// 1. Cargar organismos
const { data: organisms } = await sb.from("organisms").select("id, short_name, odoo_partner_id");
const byPartnerId = new Map();
const byShortName = new Map();
for (const o of organisms || []) {
  if (o.odoo_partner_id) byPartnerId.set(o.odoo_partner_id, o);
  byShortName.set(o.short_name, o);
}
console.log(`✓ ${organisms.length} organismos cargados`);

// 2. Cargar todas las cuentas analíticas activas (paginando, default Supabase = 1000)
const aas = [];
const pageSize = 1000;
for (let from = 0; ; from += pageSize) {
  const { data, error } = await sb
    .from("odoo_analytic_accounts")
    .select("odoo_id, code, name, partner_odoo_id, plan_name")
    .eq("active", true)
    .range(from, from + pageSize - 1);
  if (error) throw error;
  if (!data || data.length === 0) break;
  aas.push(...data);
  if (data.length < pageSize) break;
}
console.log(`✓ ${aas.length} cuentas analíticas cargadas`);

// 3. Matching
const links = [];
let matchedByPartner = 0;
let matchedByCode = 0;
let unmatched = 0;

// Helper: extraer el "código" del registro. Si code está vacío, lo intentamos
// inferir del inicio del name (formato típico: "10.BID.001 - ...").
function extractCode(aa) {
  const c = (aa.code || "").trim();
  if (c) return c;
  const m = (aa.name || "").trim().match(/^(\d+(?:\.[A-Z0-9]+)+(?:\.\d+)?)/);
  return m ? m[1] : "";
}

// Detectar sigla de organismo desde un código tipo "10.BID.001" o "5.2.XX"
function siglaFromCode(code) {
  // Patrón "<num>.<SIGLA>.<resto>" donde sigla son letras
  const m1 = code.match(/^\d+\.([A-Z]+)\b/i);
  if (m1) return m1[1].toUpperCase();
  return null;
}

const SIGLA_TO_ORG = {
  BID: { org: "BID", fuente: "BID" },
  CFP: { org: "INIDEP", fuente: "OTROS" },
  GIRSAR: { org: "INTA", fuente: "OTROS" },
  GMZA: { org: "INTA", fuente: "OTROS" },
  CCT: { org: "CONICET", fuente: "OTROS" },
  INA: { org: "INA", fuente: "OTROS" },
  GNA: { org: "INTA", fuente: "OTROS" },
  IMPULS: { org: "INTA", fuente: "OTROS" },
};

for (const aa of aas) {
  let organism = null;
  let fuente = null;
  const codeRaw = extractCode(aa);
  const combined = `${codeRaw} ${aa.name || ""}`.toUpperCase();

  // A) Por partner_id directo
  if (aa.partner_odoo_id && byPartnerId.has(aa.partner_odoo_id)) {
    organism = byPartnerId.get(aa.partner_odoo_id);
    matchedByPartner++;
  } else {
    // B) Por sigla del código (preferido — más estructurado)
    const sigla = siglaFromCode(codeRaw);
    if (sigla && SIGLA_TO_ORG[sigla]) {
      const cfg = SIGLA_TO_ORG[sigla];
      organism = byShortName.get(cfg.org);
      fuente = cfg.fuente;
      matchedByCode++;
    }
    // C) Por keywords en el nombre (fallback)
    else if (combined.includes("FAO") || combined.includes("ALIMENTACION")) {
      organism = byShortName.get("FAO");
      fuente = "FAO";
      matchedByCode++;
    } else if (combined.includes("FONTAGRO") || combined.includes("FTG-") || combined.includes("FTG ") || combined.includes("ATN/RF") || combined.includes("ATN/RR")) {
      organism = byShortName.get("FONTAGRO");
      fuente = "FONTAGRO";
      matchedByCode++;
    } else if (combined.includes("H2020") || combined.includes("HORIZON")) {
      organism = byShortName.get("INTA");
      fuente = "EU-H2020";
      matchedByCode++;
    } else if (combined.includes("PROCISUR")) {
      organism = byShortName.get("INTA");
      fuente = "PROCISUR";
      matchedByCode++;
    } else if (combined.includes("AECID")) {
      organism = byShortName.get("INTA");
      fuente = "AECID";
      matchedByCode++;
    } else if (combined.includes("BID")) {
      organism = byShortName.get("BID");
      fuente = "BID";
      matchedByCode++;
    } else if (combined.includes("IAEA") || combined.includes("OIEA")) {
      organism = byShortName.get("INTA");
      fuente = "IAEA";
      matchedByCode++;
    } else if (combined.includes("USDA")) {
      organism = byShortName.get("INTA");
      fuente = "USDA";
      matchedByCode++;
    } else if (combined.includes("UNIVERSIDAD")) {
      organism = byShortName.get("INTA");
      fuente = "OTROS";
      matchedByCode++;
    } else if (codeRaw.startsWith("5.2.")) {
      // Proyectos de cooperación internacional gestionados via INTA
      organism = byShortName.get("INTA");
      fuente = inferFuenteFromName(aa.name);
      matchedByCode++;
    } else if (codeRaw.startsWith("10.") || codeRaw.startsWith("100.") || codeRaw.match(/^\d+\.\d+/)) {
      // Resto de proyectos 10.* o numéricos — INTA como ejecutor por default
      organism = byShortName.get("INTA");
      fuente = inferFuenteFromName(aa.name) || "OTROS";
      matchedByCode++;
    }
  }

  if (organism) {
    links.push({
      organism_id: organism.id,
      odoo_analytic_account_id: aa.odoo_id,
      code: aa.code,
      name: aa.name,
      fuente_financiamiento: fuente,
      visible: true,
    });
  } else {
    unmatched++;
  }
}

function inferFuenteFromName(name) {
  if (!name) return null;
  const u = name.toUpperCase();
  if (u.includes("H2020") || u.includes("HORIZON")) return "EU-H2020";
  if (u.includes("FONTAGRO") || u.includes("FTG")) return "FONTAGRO";
  if (u.includes("PROCISUR")) return "PROCISUR";
  if (u.includes("AECID")) return "AECID";
  if (u.includes("FAO")) return "FAO";
  if (u.includes("BID")) return "BID";
  if (u.includes("USDA")) return "USDA";
  if (u.includes("IAEA")) return "IAEA";
  return "OTROS";
}

console.log(`\n📊 Matching stats:`);
console.log(`   - por partner_id directo: ${matchedByPartner}`);
console.log(`   - por patrón de código: ${matchedByCode}`);
console.log(`   - sin vincular: ${unmatched}`);
console.log(`   total a insertar: ${links.length}`);

// 4. Insertar en organism_convenios (batches de 500)
const batchSize = 500;
let inserted = 0;
for (let i = 0; i < links.length; i += batchSize) {
  const batch = links.slice(i, i + batchSize);
  const { error } = await sb.from("organism_convenios").upsert(batch, {
    onConflict: "organism_id,odoo_analytic_account_id",
  });
  if (error) {
    console.error(`error en batch ${i}: ${error.message}`);
    break;
  }
  inserted += batch.length;
  process.stdout.write(`\r   inserting: ${inserted}/${links.length}`);
}
process.stdout.write("\n");

// 5. Verificar
console.log("\n=== Convenios vinculados por organismo ===");
for (const o of organisms) {
  const { count } = await sb
    .from("organism_convenios")
    .select("*", { count: "exact", head: true })
    .eq("organism_id", o.id);
  console.log(`   ${o.short_name.padEnd(10)}: ${count || 0}`);
}
