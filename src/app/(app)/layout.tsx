import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { getCurrentUser } from "@/lib/data";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentUser();
  if (!profile) redirect("/login");

  const role: "interno" | "externo" =
    profile.user_type === "interno" || profile.is_super_admin ? "interno" : "externo";

  return <AppShell role={role}>{children}</AppShell>;
}
