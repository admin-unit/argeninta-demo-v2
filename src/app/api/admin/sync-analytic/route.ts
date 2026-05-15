import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { syncAnalyticAccounts } from "@/lib/odoo/sync-analytic";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

async function isAuthorized(request: Request): Promise<boolean> {
  // 1. Cron secret (Vercel) o Bearer manual
  const cronSecret = process.env.CRON_SECRET;
  const vercelSig = request.headers.get("x-vercel-cron-signature");
  if (vercelSig) return true;
  if (cronSecret) {
    const auth = request.headers.get("authorization") ?? "";
    if (auth === `Bearer ${cronSecret}`) return true;
  }

  // 2. Super admin logueado
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return false;
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_super_admin")
    .eq("id", auth.user.id)
    .maybeSingle();
  return profile?.is_super_admin === true;
}

export async function POST(request: Request) {
  if (!(await isAuthorized(request))) {
    return NextResponse.json(
      { ok: false, error: "unauthorized" },
      { status: 401 }
    );
  }
  try {
    const result = await syncAnalyticAccounts();
    if (result.errors.length > 0) {
      console.error("[sync-analytic] errors", result.errors);
    }
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[sync-analytic] fatal", message);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export const GET = POST;
