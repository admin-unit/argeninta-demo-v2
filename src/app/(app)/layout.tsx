import { cookies } from "next/headers";
import { AppShell } from "@/components/layout/app-shell";
import type { Role } from "@/types";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const role = (cookieStore.get("role")?.value ?? "externo") as Role;
  return <AppShell role={role}>{children}</AppShell>;
}
