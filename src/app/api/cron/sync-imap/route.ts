import { NextResponse } from "next/server";
import { syncImapInbox } from "@/lib/imap/sync";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function isAuthorized(request: Request): boolean {
  const cronSecret = process.env.CRON_SECRET;
  // Vercel auto-inyecta este header en producción cuando dispara el cron.
  const vercelSig = request.headers.get("x-vercel-cron-signature");
  if (vercelSig) return true;
  if (!cronSecret) return false;
  const auth = request.headers.get("authorization") ?? "";
  return auth === `Bearer ${cronSecret}`;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  try {
    const result = await syncImapInbox();
    if (result.errors.length > 0) {
      console.error("[sync-imap] errors", result.errors);
    }
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[sync-imap] fatal", message);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
