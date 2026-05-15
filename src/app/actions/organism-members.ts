"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/types/database.types";

type OrganismRole = Database["public"]["Enums"]["organism_role"];

const VALID_ROLES: OrganismRole[] = ["solicitante", "referente", "admin_org"];

async function getCallerOrThrow() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error("No autenticado");
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, is_super_admin, user_type, email, full_name")
    .eq("id", auth.user.id)
    .maybeSingle();
  if (!profile) throw new Error("Perfil del usuario no encontrado");
  return { user: auth.user, profile };
}

async function assertCanManageOrganism(organismId: string) {
  const { profile } = await getCallerOrThrow();
  if (profile.is_super_admin) return profile;

  const supabase = await createClient();
  const { data } = await supabase
    .from("organism_members")
    .select("role")
    .eq("organism_id", organismId)
    .eq("user_id", profile.id)
    .maybeSingle();

  const role = data?.role as OrganismRole | undefined;
  if (role !== "admin_org" && role !== "referente") {
    throw new Error(
      "No tenés permisos para gestionar miembros de este organismo"
    );
  }
  return profile;
}

async function getSiteUrl(): Promise<string> {
  if (process.env.NEXT_PUBLIC_SITE_URL)
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  const h = await headers();
  const xfHost = h.get("x-forwarded-host");
  const xfProto = h.get("x-forwarded-proto");
  if (xfHost) return `${xfProto || "https"}://${xfHost}`;
  const host = h.get("host");
  if (host && !host.startsWith("localhost") && !host.startsWith("127."))
    return `https://${host}`;
  return h.get("origin") || "http://localhost:3000";
}

function normalizeEmail(email: string): string {
  const e = email.trim().toLowerCase();
  if (!e || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e))
    throw new Error("Email inválido");
  return e;
}

function ensureRole(role: string): OrganismRole {
  if (!VALID_ROLES.includes(role as OrganismRole))
    throw new Error(`Rol inválido: ${role}`);
  return role as OrganismRole;
}

async function ensureProfileExists(
  admin: ReturnType<typeof createAdminClient>,
  userId: string,
  email: string
) {
  const { error } = await admin.from("profiles").upsert(
    { id: userId, email, user_type: "externo" },
    { onConflict: "id" }
  );
  if (error) throw new Error(`No se pudo crear el profile: ${error.message}`);
}

async function ensureMembership(
  admin: ReturnType<typeof createAdminClient>,
  organismId: string,
  userId: string,
  role: OrganismRole,
  addedBy: string
) {
  const { error } = await admin.from("organism_members").upsert(
    { organism_id: organismId, user_id: userId, role, added_by: addedBy },
    { onConflict: "organism_id,user_id" }
  );
  if (error)
    throw new Error(`No se pudo crear la membresía: ${error.message}`);
}

export async function invitarUsuarioExternoPorMail(input: {
  organismId: string;
  email: string;
  role: string;
}) {
  const caller = await assertCanManageOrganism(input.organismId);
  const email = normalizeEmail(input.email);
  const role = ensureRole(input.role);
  const admin = createAdminClient();
  const site = await getSiteUrl();

  // 1. Invitar (manda magic link). Si el user ya existe, salta a step 2.
  const { data: invite, error: inviteErr } =
    await admin.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${site}/auth/callback`,
      data: { organism_id: input.organismId, role },
    });

  let userId = invite?.user?.id;

  if (inviteErr) {
    // "User already registered" o similar: buscamos el user existente.
    const { data: list } = await admin.auth.admin.listUsers({ perPage: 200 });
    const existing = list?.users.find(
      (u) => u.email?.toLowerCase() === email
    );
    if (!existing)
      throw new Error(`No se pudo invitar: ${inviteErr.message}`);
    userId = existing.id;
  }

  if (!userId) throw new Error("No se obtuvo userId tras la invitación");

  await ensureProfileExists(admin, userId, email);
  await ensureMembership(admin, input.organismId, userId, role, caller.id);

  revalidatePath(`/organismos/${input.organismId}/miembros`);
  return { ok: true, userId, method: "invite" as const };
}

export async function crearUsuarioExternoConPassword(input: {
  organismId: string;
  email: string;
  password: string;
  role: string;
  fullName?: string;
}) {
  const caller = await assertCanManageOrganism(input.organismId);
  const email = normalizeEmail(input.email);
  const role = ensureRole(input.role);
  if (input.password.length < 8)
    throw new Error("La contraseña debe tener al menos 8 caracteres");

  const admin = createAdminClient();
  let userId: string | undefined;

  // 1. Crear user con email_confirm=true (no requiere verificación de mail).
  const { data: created, error: createErr } =
    await admin.auth.admin.createUser({
      email,
      password: input.password,
      email_confirm: true,
      user_metadata: input.fullName ? { full_name: input.fullName } : undefined,
    });

  if (created?.user?.id) {
    userId = created.user.id;
  } else if (createErr) {
    // Usuario ya existe — buscamos su id y opcionalmente actualizamos password.
    const { data: list } = await admin.auth.admin.listUsers({ perPage: 200 });
    const existing = list?.users.find(
      (u) => u.email?.toLowerCase() === email
    );
    if (!existing) throw new Error(`No se pudo crear: ${createErr.message}`);
    userId = existing.id;
    const { error: updErr } = await admin.auth.admin.updateUserById(userId, {
      password: input.password,
      email_confirm: true,
    });
    if (updErr)
      throw new Error(`No se pudo actualizar password: ${updErr.message}`);
  }

  if (!userId) throw new Error("No se obtuvo userId tras crear el usuario");

  await ensureProfileExists(admin, userId, email);
  if (input.fullName) {
    await admin
      .from("profiles")
      .update({ full_name: input.fullName })
      .eq("id", userId);
  }
  await ensureMembership(admin, input.organismId, userId, role, caller.id);

  revalidatePath(`/organismos/${input.organismId}/miembros`);
  return { ok: true, userId, method: "password" as const };
}

export async function cambiarRolMiembro(input: {
  organismId: string;
  userId: string;
  newRole: string;
}) {
  await assertCanManageOrganism(input.organismId);
  const role = ensureRole(input.newRole);
  const admin = createAdminClient();

  const { error } = await admin
    .from("organism_members")
    .update({ role })
    .eq("organism_id", input.organismId)
    .eq("user_id", input.userId);
  if (error) throw new Error(error.message);

  revalidatePath(`/organismos/${input.organismId}/miembros`);
  return { ok: true };
}

export async function revocarMiembro(input: {
  organismId: string;
  userId: string;
}) {
  await assertCanManageOrganism(input.organismId);
  const admin = createAdminClient();

  const { error } = await admin
    .from("organism_members")
    .delete()
    .eq("organism_id", input.organismId)
    .eq("user_id", input.userId);
  if (error) throw new Error(error.message);

  revalidatePath(`/organismos/${input.organismId}/miembros`);
  return { ok: true };
}
