"use server";

import { createClient } from "@/lib/supabase/server";
import { headers } from "next/headers";

/**
 * Obtiene la base URL del sitio respetando los headers de proxy (Caddy)
 * antes que el origin "interno" del servidor.
 *
 * Orden de preferencia:
 *   1. NEXT_PUBLIC_SITE_URL (env var en producción)
 *   2. X-Forwarded-Host + X-Forwarded-Proto (set por Caddy)
 *   3. Host header + asumir https
 *   4. Origin (fallback final)
 */
async function getSiteUrl(): Promise<string> {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  }
  const h = await headers();
  const xfHost = h.get("x-forwarded-host");
  const xfProto = h.get("x-forwarded-proto");
  if (xfHost) {
    return `${xfProto || "https"}://${xfHost}`;
  }
  const host = h.get("host");
  if (host && !host.startsWith("0.0.0.0") && !host.startsWith("127.0.0.1") && !host.startsWith("localhost")) {
    return `https://${host}`;
  }
  return h.get("origin") || "http://localhost:3000";
}

export async function signInWithMagicLink(email: string) {
  const supabase = await createClient();
  const site = await getSiteUrl();

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${site}/auth/callback`,
    },
  });

  if (error) throw new Error(error.message);
}

export async function getGoogleOAuthUrl() {
  const supabase = await createClient();
  const site = await getSiteUrl();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${site}/auth/callback`,
      queryParams: { access_type: "offline", prompt: "consent" },
    },
  });

  if (error) throw new Error(error.message);
  return data.url;
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
}
