#!/usr/bin/env node
/**
 * scripts/sync-imap-once.mjs
 *
 * Corre el sync IMAP una sola vez contra Supabase remoto (modo dev).
 * Útil para probar la ingesta sin esperar al cron de Vercel.
 *
 * Uso: node --import tsx scripts/sync-imap-once.mjs
 *
 * Requiere en .env.local: SUPABASE_*, INBOX_IMAP_*
 */

import { config } from "dotenv";
config({ path: ".env.local" });

const { syncImapInbox } = await import("../src/lib/imap/sync.ts");

console.log("Sincronizando IMAP…");
const result = await syncImapInbox();
console.log(JSON.stringify(result, null, 2));
process.exit(result.errors.length > 0 ? 1 : 0);
