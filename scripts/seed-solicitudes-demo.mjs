#!/usr/bin/env node
/**
 * scripts/seed-solicitudes-demo.mjs
 *
 * Carga 25 solicitudes demo + audit_log con mix de tipos/organismos/estados.
 * La fuente canónica vive en supabase/migrations/0008_seed_solicitudes_demo.sql.
 * Este wrapper sólo está para conveniencia (no es idempotente: re-correrlo crea
 * solicitudes duplicadas).
 *
 * Uso: node scripts/seed-solicitudes-demo.mjs
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
  new URL("../supabase/migrations/0008_seed_solicitudes_demo.sql", import.meta.url),
  "utf8"
);

const { error } = await supabase.rpc("exec_sql", { sql_text: sql }).catch((e) => ({ error: e }));
if (error) {
  console.error("Error aplicando seed:", error);
  process.exit(1);
}
console.log("✅ Solicitudes demo aplicadas");
