import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeftIcon } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { getCurrentProfileWithContext } from "@/lib/data";
import { getOrganismRow } from "@/lib/views/data-organisms";
import { MiembrosManager } from "@/components/organismos/miembros-manager";

export const dynamic = "force-dynamic";

type Row = {
  user_id: string;
  role: "solicitante" | "referente" | "admin_org";
  added_at: string;
  profile: {
    id: string;
    email: string;
    full_name: string | null;
    active: boolean;
    last_seen_at: string | null;
  } | null;
};

export default async function MiembrosOrganismo({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ctx = await getCurrentProfileWithContext();
  if (!ctx.profile) redirect("/login");

  const row = await getOrganismRow(id);
  if (!row) notFound();

  // Permisos: super_admin O admin_org/referente del organismo
  const supabase = await createClient();
  let canManage = ctx.profile.is_super_admin === true;
  if (!canManage) {
    const { data: myMembership } = await supabase
      .from("organism_members")
      .select("role")
      .eq("organism_id", id)
      .eq("user_id", ctx.profile.id)
      .maybeSingle();
    canManage =
      myMembership?.role === "admin_org" || myMembership?.role === "referente";
  }

  if (!canManage) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <Link
          href={`/organismos/${id}`}
          className="inline-flex items-center gap-1.5 text-[12.5px] text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeftIcon className="w-3.5 h-3.5" />
          Volver al organismo
        </Link>
        <h1 className="text-xl font-semibold text-foreground mb-2">
          Miembros — {row.short_name ?? row.name}
        </h1>
        <p className="text-sm text-muted-foreground">
          No tenés permisos para ver o gestionar los miembros de este organismo.
          Pedile a un super-admin o referente que te dé acceso.
        </p>
      </div>
    );
  }

  const { data: rawMembers } = await supabase
    .from("organism_members")
    .select(
      `user_id, role, added_at, profile:profiles!organism_members_user_id_fkey(id, email, full_name, active, last_seen_at)`
    )
    .eq("organism_id", id)
    .order("added_at", { ascending: true });

  const members: Row[] = (rawMembers ?? []).map((m) => ({
    user_id: m.user_id as string,
    role: m.role as Row["role"],
    added_at: m.added_at as string,
    profile: Array.isArray(m.profile)
      ? (m.profile[0] as Row["profile"]) ?? null
      : (m.profile as Row["profile"]) ?? null,
  }));

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <Link
        href={`/organismos/${id}`}
        className="inline-flex items-center gap-1.5 text-[12.5px] text-muted-foreground hover:text-foreground transition-colors mb-4"
      >
        <ArrowLeftIcon className="w-3.5 h-3.5" />
        Volver al organismo
      </Link>

      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground leading-tight">
          Miembros — {row.short_name ?? row.name}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Usuarios que pueden ver y operar el organismo desde la app. Los
          externos solo acceden a los datos de su organismo.
        </p>
      </header>

      <MiembrosManager organismId={id} initialMembers={members} />
    </div>
  );
}
