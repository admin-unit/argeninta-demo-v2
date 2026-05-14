import { NextResponse } from "next/server";
import { canAccessInbox, searchSolicitudesParaVincular } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const access = await canAccessInbox();
  if (!access) {
    return NextResponse.json({ results: [] }, { status: 403 });
  }
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";
  const results = await searchSolicitudesParaVincular(q, 20);
  return NextResponse.json({ results });
}
