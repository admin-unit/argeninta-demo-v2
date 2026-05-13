"use client";

import { useState } from "react";

const ROLES = ["miembro", "jefe", "admin"] as const;
type Rol = (typeof ROLES)[number];

interface Member {
  user_id: string;
  full_name: string | null;
  email: string;
  role: string;
}

export function AreaMembersTable({
  areaName,
  members,
  currentUserId,
}: {
  areaName: string;
  members: Member[];
  currentUserId: string;
}) {
  const [pendingRoles, setPendingRoles] = useState<Record<string, Rol>>({});
  const [savedToast, setSavedToast] = useState<string | null>(null);

  function changeRole(userId: string, newRole: Rol) {
    setPendingRoles((prev) => ({ ...prev, [userId]: newRole }));
    // Demo: no persiste a DB. Mostramos un toast efímero.
    setSavedToast(userId);
    setTimeout(() => setSavedToast((id) => (id === userId ? null : id)), 1800);
  }

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="px-5 py-3.5 border-b border-border/60 bg-muted/20">
        <h3 className="text-[13px] font-semibold text-foreground">{areaName}</h3>
        <p className="text-[11.5px] text-muted-foreground mt-0.5">
          {members.length} miembro{members.length !== 1 ? "s" : ""}
        </p>
      </div>

      {members.length === 0 ? (
        <div className="p-5 text-[13px] text-muted-foreground">
          No hay miembros cargados en esta área.
        </div>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/10">
              <th className="text-left px-4 py-2 text-[10.5px] font-semibold text-muted-foreground uppercase tracking-wider">
                Persona
              </th>
              <th className="text-left px-4 py-2 text-[10.5px] font-semibold text-muted-foreground uppercase tracking-wider">
                Email
              </th>
              <th className="text-left px-4 py-2 text-[10.5px] font-semibold text-muted-foreground uppercase tracking-wider">
                Rol
              </th>
              <th className="text-right px-4 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {members.map((m) => {
              const currentRole = (pendingRoles[m.user_id] ?? m.role) as Rol;
              const isSelf = m.user_id === currentUserId;
              const justSaved = savedToast === m.user_id;
              return (
                <tr key={m.user_id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 font-medium text-foreground text-[13px]">
                    {m.full_name ?? m.email}
                    {isSelf && (
                      <span className="ml-2 text-[10.5px] uppercase tracking-wider font-bold px-1.5 py-px rounded bg-blue-50 text-blue-700 border border-blue-200">
                        vos
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-[12px] font-mono">
                    {m.email}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={currentRole}
                      onChange={(e) => changeRole(m.user_id, e.target.value as Rol)}
                      disabled={isSelf}
                      className="text-[12.5px] border border-border rounded-md px-2 py-1 bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 disabled:opacity-50 disabled:cursor-not-allowed capitalize"
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-right text-[11.5px]">
                    {justSaved && (
                      <span className="inline-flex items-center gap-1 text-emerald-600 font-medium animate-in fade-in">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                        Rol actualizado
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      <p className="px-5 py-2.5 border-t border-border/60 bg-muted/10 text-[11px] text-muted-foreground">
        Modo demo · los cambios de rol no persisten todavía.
      </p>
    </div>
  );
}
