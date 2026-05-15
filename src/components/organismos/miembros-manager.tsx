"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  UserPlusIcon,
  Trash2Icon,
  XIcon,
  CheckIcon,
  MailIcon,
  KeyIcon,
} from "lucide-react";

import {
  invitarUsuarioExternoPorMail,
  crearUsuarioExternoConPassword,
  cambiarRolMiembro,
  revocarMiembro,
} from "@/app/actions/organism-members";

type Role = "solicitante" | "referente" | "admin_org";

const ROLE_LABEL: Record<Role, string> = {
  solicitante: "Solicitante",
  referente: "Referente",
  admin_org: "Admin del organismo",
};

const ROLE_DESC: Record<Role, string> = {
  solicitante: "Carga solicitudes en nombre del organismo.",
  referente: "Aprueba solicitudes y gestiona miembros.",
  admin_org: "Control total sobre el organismo dentro de la app.",
};

type Member = {
  user_id: string;
  role: Role;
  added_at: string;
  profile: {
    id: string;
    email: string;
    full_name: string | null;
    active: boolean;
    last_seen_at: string | null;
  } | null;
};

export function MiembrosManager({
  organismId,
  initialMembers,
}: {
  organismId: string;
  initialMembers: Member[];
}) {
  const router = useRouter();
  const [members] = useState<Member[]>(initialMembers);
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSuccess(msg: string) {
    setSuccess(msg);
    setError(null);
    setModalOpen(false);
    router.refresh();
    setTimeout(() => setSuccess(null), 5000);
  }

  function handleChangeRole(userId: string, newRole: Role) {
    setError(null);
    startTransition(async () => {
      try {
        await cambiarRolMiembro({ organismId, userId, newRole });
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error al cambiar rol");
      }
    });
  }

  function handleRevoke(userId: string, email: string) {
    if (!confirm(`¿Revocar acceso de ${email}? Podés volver a invitarlo después.`))
      return;
    setError(null);
    startTransition(async () => {
      try {
        await revocarMiembro({ organismId, userId });
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error al revocar");
      }
    });
  }

  return (
    <div className="space-y-4">
      {/* Banners */}
      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-[13px] text-destructive">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-[13px] text-emerald-700">
          {success}
        </div>
      )}

      {/* Acciones */}
      <div className="flex items-center justify-between">
        <p className="text-[13px] text-muted-foreground">
          {members.length} {members.length === 1 ? "miembro" : "miembros"}
        </p>
        <button
          type="button"
          onClick={() => {
            setError(null);
            setModalOpen(true);
          }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground text-[13px] font-medium rounded-lg hover:opacity-90 transition-opacity shadow-sm"
        >
          <UserPlusIcon className="w-3.5 h-3.5" />
          Agregar miembro
        </button>
      </div>

      {/* Tabla */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left px-4 py-3 text-[10.5px] font-semibold text-muted-foreground uppercase tracking-wider">
                Usuario
              </th>
              <th className="text-left px-4 py-3 text-[10.5px] font-semibold text-muted-foreground uppercase tracking-wider">
                Rol
              </th>
              <th className="text-left px-4 py-3 text-[10.5px] font-semibold text-muted-foreground uppercase tracking-wider">
                Alta
              </th>
              <th className="text-left px-4 py-3 text-[10.5px] font-semibold text-muted-foreground uppercase tracking-wider">
                Último login
              </th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {members.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="py-12 text-center text-muted-foreground text-sm"
                >
                  Este organismo no tiene miembros todavía. Agregá el primero
                  con el botón de arriba.
                </td>
              </tr>
            ) : (
              members.map((m) => (
                <tr key={m.user_id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground">
                      {m.profile?.full_name ?? "—"}
                    </p>
                    <p className="text-[12px] text-muted-foreground font-mono">
                      {m.profile?.email ?? "(perfil no encontrado)"}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={m.role}
                      disabled={isPending}
                      onChange={(e) =>
                        handleChangeRole(m.user_id, e.target.value as Role)
                      }
                      className="text-[12.5px] border border-input rounded-md px-2 py-1 bg-background"
                    >
                      <option value="solicitante">Solicitante</option>
                      <option value="referente">Referente</option>
                      <option value="admin_org">Admin del organismo</option>
                    </select>
                  </td>
                  <td className="px-4 py-3 text-[12.5px] text-muted-foreground">
                    {new Date(m.added_at).toLocaleDateString("es-AR", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-4 py-3 text-[12.5px] text-muted-foreground">
                    {m.profile?.last_seen_at
                      ? new Date(m.profile.last_seen_at).toLocaleDateString(
                          "es-AR",
                          {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          }
                        )
                      : "Nunca"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() =>
                        handleRevoke(m.user_id, m.profile?.email ?? "este usuario")
                      }
                      className="inline-flex items-center gap-1 text-[12px] text-destructive hover:bg-destructive/5 px-2 py-1 rounded transition-colors disabled:opacity-50"
                    >
                      <Trash2Icon className="w-3.5 h-3.5" />
                      Revocar
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <AgregarMiembroModal
          organismId={organismId}
          onClose={() => setModalOpen(false)}
          onSuccess={handleSuccess}
          onError={setError}
        />
      )}
    </div>
  );
}

function AgregarMiembroModal({
  organismId,
  onClose,
  onSuccess,
  onError,
}: {
  organismId: string;
  onClose: () => void;
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
}) {
  const [method, setMethod] = useState<"invite" | "password">("invite");
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("solicitante");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (method === "invite") {
        await invitarUsuarioExternoPorMail({ organismId, email, role });
        onSuccess(`Invitación enviada a ${email}.`);
      } else {
        await crearUsuarioExternoConPassword({
          organismId,
          email,
          password,
          role,
          fullName: fullName.trim() || undefined,
        });
        onSuccess(`Usuario ${email} creado. Compartile email y password.`);
      }
    } catch (err) {
      onError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-card border border-border rounded-2xl shadow-xl max-w-lg w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-base font-semibold text-foreground">
            Agregar miembro al organismo
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <XIcon className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          {/* Switch método */}
          <div className="grid grid-cols-2 gap-2">
            <MethodCard
              icon={<MailIcon className="w-4 h-4" />}
              label="Invitar por mail"
              desc="Magic link al inbox del usuario."
              active={method === "invite"}
              onClick={() => setMethod("invite")}
            />
            <MethodCard
              icon={<KeyIcon className="w-4 h-4" />}
              label="Crear con password"
              desc="Vos elegís el password y se lo compartís."
              active={method === "password"}
              onClick={() => setMethod("password")}
            />
          </div>

          {/* Campos comunes */}
          <div className="space-y-3">
            <Field label="Email">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="usuario@organismo.gob.ar"
                className="w-full px-3 py-2 text-sm border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </Field>

            {method === "password" && (
              <>
                <Field label="Nombre completo (opcional)">
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Nombre y apellido"
                    className="w-full px-3 py-2 text-sm border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </Field>
                <Field label="Password">
                  <input
                    type="text"
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 8 caracteres"
                    className="w-full px-3 py-2 text-sm border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring font-mono"
                  />
                </Field>
              </>
            )}

            <Field label="Rol">
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as Role)}
                className="w-full px-3 py-2 text-sm border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {(Object.keys(ROLE_LABEL) as Role[]).map((r) => (
                  <option key={r} value={r}>
                    {ROLE_LABEL[r]}
                  </option>
                ))}
              </select>
              <p className="text-[11.5px] text-muted-foreground mt-1">
                {ROLE_DESC[role]}
              </p>
            </Field>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity font-medium disabled:opacity-50"
            >
              <CheckIcon className="w-3.5 h-3.5" />
              {submitting
                ? "Procesando…"
                : method === "invite"
                  ? "Enviar invitación"
                  : "Crear usuario"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function MethodCard({
  icon,
  label,
  desc,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  desc: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-left p-3 rounded-lg border transition-colors ${
        active
          ? "border-primary bg-primary/5"
          : "border-border hover:border-border hover:bg-accent/30"
      }`}
    >
      <div className="flex items-center gap-2 mb-1">
        <span
          className={`${active ? "text-primary" : "text-muted-foreground"}`}
        >
          {icon}
        </span>
        <span className="text-[13px] font-medium text-foreground">{label}</span>
      </div>
      <p className="text-[11.5px] text-muted-foreground leading-snug">{desc}</p>
    </button>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-[11.5px] font-medium text-muted-foreground mb-1.5 uppercase tracking-wider">
        {label}
      </label>
      {children}
    </div>
  );
}
