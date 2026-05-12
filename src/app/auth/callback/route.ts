import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { headers } from "next/headers";

/**
 * URL pública del sitio respetando proxy headers (igual que actions/auth.ts).
 */
async function getSiteUrl(): Promise<string> {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  }
  const h = await headers();
  const xfHost = h.get("x-forwarded-host");
  const xfProto = h.get("x-forwarded-proto");
  if (xfHost) return `${xfProto || "https"}://${xfHost}`;
  const host = h.get("host");
  if (
    host &&
    !host.startsWith("0.0.0.0") &&
    !host.startsWith("127.0.0.1") &&
    !host.startsWith("localhost")
  ) {
    return `https://${host}`;
  }
  return "http://localhost:3000";
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  const site = await getSiteUrl();

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${site}${next}`);
    }
  }

  return NextResponse.redirect(`${site}/login?error=auth`);
}
