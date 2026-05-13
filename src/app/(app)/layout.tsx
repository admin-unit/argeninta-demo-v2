import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import type { SidebarUser } from "@/components/layout/sidebar";
import { getCurrentProfileWithContext } from "@/lib/data";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function computeInitials(name: string, email: string): string {
  const source = name?.trim() || email;
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return (parts[0]?.[0] ?? "?").toUpperCase();
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { profile, primary_organism, primary_area } = await getCurrentProfileWithContext();
  if (!profile) redirect("/login");

  // Super admins ven la vista interna (Argeninta). Externos puros ven "mi organismo".
  const role: "interno" | "externo" =
    profile.user_type === "interno" || profile.is_super_admin ? "interno" : "externo";

  const fullName = profile.full_name?.trim() || profile.email;

  const user: SidebarUser = {
    full_name: fullName,
    initials: computeInitials(profile.full_name ?? "", profile.email),
    subtitle:
      role === "externo"
        ? primary_organism?.name ?? "Sin organismo asignado"
        : primary_area?.name ?? (profile.is_super_admin ? "Super admin" : "Sin área asignada"),
    organization_short:
      role === "externo"
        ? primary_organism?.short_name ?? primary_organism?.name?.slice(0, 6) ?? "ORG"
        : "Argeninta",
    organization_long:
      role === "externo"
        ? primary_organism?.name ?? "Organismo cliente"
        : "Fundación Argeninta",
  };

  return (
    <AppShell role={role} user={user} isSuperAdmin={profile.is_super_admin}>
      {children}
    </AppShell>
  );
}
