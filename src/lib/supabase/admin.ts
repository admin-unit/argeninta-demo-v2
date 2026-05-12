/**
 * Cliente Supabase con service_role.
 *
 * IMPORTANTE: SOLO server-side. Nunca importar desde Client Components.
 * El service role bypassea RLS — equivalente a superuser de la DB.
 *
 * Uso: scripts de sync, server actions que necesitan escribir sin restricciones
 * (ej: cargar partners de Odoo a la tabla cache).
 */

import { createClient } from "@supabase/supabase-js";

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error(
      "Faltan vars: NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY"
    );
  }
  return createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
