import { redirect } from "next/navigation";
import {
  getCurrentUser,
  getMyAreaMemberships,
  getAreaMembers,
  getOrganismsForUser,
} from "@/lib/data";
import { AreaMembersTable } from "./area-members-table";

export const dynamic = "force-dynamic";

function initials(name: string | null, email: string) {
  const src = (name?.trim() || email).trim();
  const parts = src.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return src.slice(0, 2).toUpperCase();
}

export default async function PerfilPage() {
  const profile = await getCurrentUser();
  if (!profile) redirect("/login");

  const [areaMemberships, orgMemberships] = await Promise.all([
    getMyAreaMemberships(profile.id),
    getOrganismsForUser(profile.id),
  ]);

  // Áreas que el usuario administra (admin/jefe) o donde es super_admin
  const managedAreas = areaMemberships
    .filter(
      (m) =>
        profile.is_super_admin ||
        m.role === "admin" ||
        m.role === "jefe",
    )
    .map((m) => {
      const a = Array.isArray(m.area) ? m.area[0] : m.area;
      return a ? { id: a.id, name: a.name, role: m.role } : null;
    })
    .filter((x): x is { id: string; name: string; role: string } => x !== null);

  // Para cada área administrada, traemos los miembros
  const areasConMiembros = await Promise.all(
    managedAreas.map(async (a) => {
      const rows = await getAreaMembers(a.id);
      const members = rows
        .map((r) => {
          const u = Array.isArray(r.user) ? r.user[0] : r.user;
          if (!u) return null;
          return {
            user_id: u.id,
            full_name: u.full_name,
            email: u.email,
            role: r.role,
          };
        })
        .filter((x): x is { user_id: string; full_name: string | null; email: string; role: string } => x !== null)
        .sort((a, b) => {
          const ord = { admin: 0, jefe: 1, miembro: 2 } as Record<string, number>;
          return (ord[a.role] ?? 9) - (ord[b.role] ?? 9);
        });
      return { ...a, members };
    }),
  );

  const orgs = orgMemberships
    .flatMap((o) => {
      const x = Array.isArray(o.organism) ? o.organism[0] : o.organism;
      return x ? [{ id: x.id, name: x.name, short_name: x.short_name, role: o.role }] : [];
    });

  const myAreas = areaMemberships
    .map((m) => {
      const a = Array.isArray(m.area) ? m.area[0] : m.area;
      return a ? { id: a.id, name: a.name, role: m.role, is_primary: m.is_primary } : null;
    })
    .filter((x): x is { id: string; name: string; role: string; is_primary: boolean | null } => x !== null);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header del perfil */}
      <div className="bg-card border border-border rounded-2xl p-6 mb-6">
        <div className="flex items-start gap-5">
          <div className="w-16 h-16 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
            <span className="text-primary text-[18px] font-bold">
              {initials(profile.full_name, profile.email)}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-[22px] font-semibold text-foreground tracking-tight">
                {profile.full_name ?? profile.email}
              </h1>
              {profile.is_super_admin && (
                <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 border border-amber-200">
                  Super admin
                </span>
              )}
              <span
                className={`text-[10.5px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${
                  profile.user_type === "interno"
                    ? "bg-blue-50 text-blue-700 border-blue-200"
                    : "bg-violet-50 text-violet-700 border-violet-200"
                }`}
              >
                {profile.user_type}
              </span>
            </div>
            <p className="text-[13px] text-muted-foreground mt-0.5">{profile.email}</p>
            {profile.position && (
              <p className="text-[12.5px] text-muted-foreground mt-0.5">{profile.position}</p>
            )}
          </div>
        </div>
      </div>

      {/* Mis pertenencias */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-3">
            Mis áreas
          </h3>
          {myAreas.length === 0 ? (
            <p className="text-[13px] text-muted-foreground">No estás en ningún área.</p>
          ) : (
            <ul className="space-y-2">
              {myAreas.map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-3">
                  <span className="text-[13px] text-foreground">{a.name}</span>
                  <span
                    className={`text-[10.5px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border capitalize ${
                      a.role === "admin"
                        ? "bg-rose-50 text-rose-700 border-rose-200"
                        : a.role === "jefe"
                          ? "bg-amber-50 text-amber-700 border-amber-200"
                          : "bg-slate-100 text-slate-600 border-slate-200"
                    }`}
                  >
                    {a.role}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-3">
            Mis organismos
          </h3>
          {orgs.length === 0 ? (
            <p className="text-[13px] text-muted-foreground">No tenés organismos asociados.</p>
          ) : (
            <ul className="space-y-2">
              {orgs.map((o) => (
                <li key={o.id} className="flex items-center justify-between gap-3">
                  <span className="text-[13px] text-foreground">
                    {o.short_name ?? o.name}
                  </span>
                  <span className="text-[10.5px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border bg-slate-100 text-slate-600 border-slate-200 capitalize">
                    {o.role}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Gestión de roles */}
      {areasConMiembros.length > 0 ? (
        <div className="space-y-4">
          <div>
            <h2 className="text-[15px] font-semibold text-foreground">
              Gestión de roles
            </h2>
            <p className="text-[12.5px] text-muted-foreground mt-0.5">
              Como {profile.is_super_admin ? "super admin" : "jefe / admin"} podés ajustar los
              roles de los miembros de tus áreas.
            </p>
          </div>
          {areasConMiembros.map((a) => (
            <AreaMembersTable
              key={a.id}
              areaName={a.name}
              members={a.members}
              currentUserId={profile.id}
            />
          ))}
        </div>
      ) : (
        <div className="bg-muted/30 border border-border/60 rounded-xl p-5 text-[13px] text-muted-foreground">
          No administrás áreas. Si fueras jefe o admin de un área, acá verías a los miembros y
          podrías cambiarles el rol.
        </div>
      )}
    </div>
  );
}
