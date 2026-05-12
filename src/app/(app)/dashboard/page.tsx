import { redirect } from "next/navigation";
import {
  getCurrentUser,
  getOrganismsForUser,
  getResumenForOrganism,
  getGlobalSummary,
  getSolicitudes,
} from "@/lib/data";
import { HomeExterno } from "./home-externo";
import { HomeInterno } from "./home-interno";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Dashboard() {
  const profile = await getCurrentUser();
  if (!profile) redirect("/login");

  const isInterno = profile.user_type === "interno" || profile.is_super_admin;

  if (isInterno) {
    const [summary, solicitudesRecientes] = await Promise.all([
      getGlobalSummary(),
      getSolicitudes({ limit: 8 }),
    ]);
    return (
      <HomeInterno
        profile={profile}
        summary={summary}
        solicitudesRecientes={solicitudesRecientes}
      />
    );
  }

  // Externo: cargar su organismo principal
  const orgsMembers = await getOrganismsForUser(profile.id);
  // Supabase tipa la relación como array — extraemos el primer elemento si es array
  const rawOrg = orgsMembers[0]?.organism;
  const primaryOrg = Array.isArray(rawOrg) ? rawOrg[0] : rawOrg;

  if (!primaryOrg) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold mb-4">Bienvenido a Argeninta</h1>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-900">
            Tu cuenta aún no está asignada a ningún organismo. Un administrador de Argeninta
            debe asignarte para que puedas operar.
          </p>
        </div>
      </div>
    );
  }

  const [resumen, misSolicitudes] = await Promise.all([
    getResumenForOrganism(primaryOrg.id),
    getSolicitudes({ organism_id: primaryOrg.id, limit: 5 }),
  ]);

  return (
    <HomeExterno
      profile={profile}
      organism={primaryOrg}
      resumen={resumen}
      solicitudes={misSolicitudes}
    />
  );
}
