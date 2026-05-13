#!/usr/bin/env node
/**
 * scripts/seed-members.mjs
 *
 * Re-aplica el seed de internal_area_members + organism_members.
 * Es idempotente (usa ON CONFLICT DO NOTHING).
 *
 * Uso: node scripts/seed-members.mjs
 *
 * Requiere SUPABASE_SERVICE_ROLE_KEY + NEXT_PUBLIC_SUPABASE_URL en .env.local.
 *
 * NOTA: La fuente canónica es supabase/migrations/0007_seed_members_demo.sql.
 * Este script existe sólo como conveniencia para re-aplicar sin tocar migrations.
 */

import { createClient } from "@supabase/supabase-js";
import { readFile } from "node:fs/promises";
import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env.local" });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Falta NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const sql = await readFile(
  new URL("../supabase/migrations/0007_seed_members_demo.sql", import.meta.url),
  "utf8"
);

const { error } = await supabase.rpc("exec_sql", { sql_text: sql }).catch((e) => ({ error: e }));
if (error) {
  console.error("Error aplicando seed:", error);
  process.exit(1);
}
console.log("✅ Members seed aplicado");
