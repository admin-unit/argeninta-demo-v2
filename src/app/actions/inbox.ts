"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { AREA_IDS } from "@/lib/data";

type Result = { ok: true } | { ok: false; error: string };

type MailCtx = {
  supabase: Awaited<ReturnType<typeof createClient>>;
  user: { id: string };
  mail: {
    id: string;
    status: string;
    current_area_id: string | null;
    subject: string;
    from_email: string;
    received_at: string;
  };
};

async function getUserAndMail(
  emailId: string,
): Promise<MailCtx | { error: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No estás autenticado." };
  const { data: mail } = await supabase
    .from("inbox_emails")
    .select("id, status, current_area_id, subject, from_email, received_at")
    .eq("id", emailId)
    .maybeSingle();
  if (!mail) return { error: "No se encontró el mail (o no tenés permisos)." };
  return { supabase, user, mail: mail as MailCtx["mail"] };
}

/** Deriva el mail a otra área interna. Queda en bandeja y registra evento. */
export async function derivarMailAArea(
  emailId: string,
  targetAreaId: string,
  motivo?: string,
): Promise<Result> {
  const ctx = await getUserAndMail(emailId);
  if ("error" in ctx) return { ok: false, error: ctx.error };
  const { supabase, user, mail } = ctx;

  if (mail.current_area_id === targetAreaId) {
    return { ok: false, error: "El mail ya está en esa área." };
  }
  const { data: targetArea } = await supabase
    .from("internal_areas")
    .select("name")
    .eq("id", targetAreaId)
    .maybeSingle();
  if (!targetArea) return { ok: false, error: "Área destino no encontrada." };

  const { error: updErr } = await supabase
    .from("inbox_emails")
    .update({
      current_area_id: targetAreaId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", emailId);
  if (updErr) return { ok: false, error: `No se pudo derivar: ${updErr.message}` };

  const { error: auditErr } = await supabase.from("audit_log").insert({
    user_id: user.id,
    inbox_email_id: emailId,
    area_id: targetAreaId,
    event_type: "mail_routed",
    description: `Derivado a ${targetArea.name}`,
    metadata: {
      from_area_id: mail.current_area_id,
      to_area_id: targetAreaId,
      ...(motivo ? { motivo } : {}),
    },
  });
  if (auditErr) return { ok: false, error: `Derivado pero falló audit log: ${auditErr.message}` };

  revalidatePath(`/bandeja/mails/${emailId}`);
  revalidatePath("/bandeja/mails");
  return { ok: true };
}

export async function marcarMailLeido(emailId: string): Promise<Result> {
  const ctx = await getUserAndMail(emailId);
  if ("error" in ctx) return { ok: false, error: ctx.error };
  const { supabase, user, mail } = ctx;
  if (mail.status === "processed") {
    return { ok: false, error: "El mail ya está procesado." };
  }

  const { error: updErr } = await supabase
    .from("inbox_emails")
    .update({ status: "read", updated_at: new Date().toISOString() })
    .eq("id", emailId);
  if (updErr) return { ok: false, error: updErr.message };

  await supabase.from("audit_log").insert({
    user_id: user.id,
    inbox_email_id: emailId,
    area_id: mail.current_area_id,
    event_type: "mail_marked_read",
    description: "Mail marcado como leído",
    metadata: { from: mail.status },
  });

  revalidatePath(`/bandeja/mails/${emailId}`);
  revalidatePath("/bandeja/mails");
  return { ok: true };
}

export async function descartarMail(emailId: string, motivo: string): Promise<Result> {
  const text = motivo.trim();
  if (!text) return { ok: false, error: "Indicá un motivo para descartar." };
  const ctx = await getUserAndMail(emailId);
  if ("error" in ctx) return { ok: false, error: ctx.error };
  const { supabase, user, mail } = ctx;

  const { error: updErr } = await supabase
    .from("inbox_emails")
    .update({
      status: "discarded",
      discarded_reason: text,
      updated_at: new Date().toISOString(),
    })
    .eq("id", emailId);
  if (updErr) return { ok: false, error: updErr.message };

  await supabase.from("audit_log").insert({
    user_id: user.id,
    inbox_email_id: emailId,
    area_id: mail.current_area_id,
    event_type: "mail_discarded",
    description: `Mail descartado: ${text}`,
    metadata: { motivo: text, from: mail.status },
  });

  revalidatePath(`/bandeja/mails/${emailId}`);
  revalidatePath("/bandeja/mails");
  return { ok: true };
}

export async function agregarNotaMail(emailId: string, note: string): Promise<Result> {
  const text = note.trim();
  if (!text) return { ok: false, error: "La nota está vacía." };
  const ctx = await getUserAndMail(emailId);
  if ("error" in ctx) return { ok: false, error: ctx.error };
  const { supabase, user, mail } = ctx;

  const { error } = await supabase.from("audit_log").insert({
    user_id: user.id,
    inbox_email_id: emailId,
    area_id: mail.current_area_id,
    event_type: "note_added",
    description: "Nota interna agregada",
    metadata: { note: text },
  });
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/bandeja/mails/${emailId}`);
  return { ok: true };
}

/**
 * Vincula adjuntos del inbox a una solicitud existente. NO cambia el status
 * del mail (sigue disponible para ser convertido o vinculado de nuevo).
 */
export async function vincularMailASolicitud(
  emailId: string,
  solicitudId: string,
  attachmentIds: string[],
): Promise<{ ok: true; vinculados: number } | { ok: false; error: string }> {
  if (attachmentIds.length === 0) {
    return { ok: false, error: "Seleccioná al menos un adjunto." };
  }
  const ctx = await getUserAndMail(emailId);
  if ("error" in ctx) return { ok: false, error: ctx.error };
  const { supabase, user, mail } = ctx;

  // Verificar solicitud (RLS valida que el user pueda verla)
  const { data: sol } = await supabase
    .from("solicitudes")
    .select("id, numero_expediente, current_area_id")
    .eq("id", solicitudId)
    .maybeSingle();
  if (!sol) return { ok: false, error: "No se encontró la solicitud destino." };

  const rows = attachmentIds.map((aid) => ({
    solicitud_id: solicitudId,
    inbox_attachment_id: aid,
  }));
  const { data: inserted, error: insErr } = await supabase
    .from("solicitud_inbox_attachments")
    .upsert(rows, { onConflict: "solicitud_id,inbox_attachment_id", ignoreDuplicates: true })
    .select("id");
  if (insErr) return { ok: false, error: insErr.message };

  await supabase.from("audit_log").insert({
    user_id: user.id,
    inbox_email_id: emailId,
    area_id: mail.current_area_id,
    event_type: "mail_linked_to_solicitud",
    description: `Adjuntos vinculados a ${sol.numero_expediente ?? "solicitud"}`,
    metadata: {
      solicitud_id: solicitudId,
      attachment_ids: attachmentIds,
    },
  });

  // También audita del lado de la solicitud (visible en su trazabilidad)
  await supabase.from("audit_log").insert({
    user_id: user.id,
    solicitud_id: solicitudId,
    area_id: sol.current_area_id,
    event_type: "inbox_attachments_linked",
    description: `Vinculados ${attachmentIds.length} adjunto${attachmentIds.length !== 1 ? "s" : ""} del mail "${mail.subject}"`,
    metadata: {
      inbox_email_id: emailId,
      attachment_ids: attachmentIds,
      from_email: mail.from_email,
    },
  });

  revalidatePath(`/bandeja/mails/${emailId}`);
  revalidatePath(`/solicitudes/${solicitudId}`);
  return { ok: true, vinculados: inserted?.length ?? attachmentIds.length };
}

/**
 * Crea una nueva solicitud (status="draft") a partir del mail, vincula
 * los adjuntos seleccionados y marca el mail como "processed".
 */
export async function convertirMailASolicitud(
  emailId: string,
  attachmentIds: string[],
  tipoSlug: string,
): Promise<{ ok: true; solicitudId: string } | { ok: false; error: string }> {
  if (!tipoSlug) return { ok: false, error: "Elegí un tipo de gestión." };
  const ctx = await getUserAndMail(emailId);
  if ("error" in ctx) return { ok: false, error: ctx.error };
  const { supabase, user, mail } = ctx;

  const { data: tipo } = await supabase
    .from("tipos_gestion")
    .select("id, slug")
    .eq("slug", tipoSlug)
    .eq("active", true)
    .maybeSingle();
  if (!tipo) return { ok: false, error: "Tipo de gestión inválido." };

  const initialAreaId = mail.current_area_id ?? AREA_IDS.MESA_ENTRADA;

  const { data: created, error: insErr } = await supabase
    .from("solicitudes")
    .insert({
      tipo_gestion_id: tipo.id,
      status: "draft",
      created_by_user_id: user.id,
      current_area_id: initialAreaId,
      inbox_email_id: emailId,
      concepto: mail.subject,
      data: {
        from_email: mail.from_email,
        subject: mail.subject,
        received_at: mail.received_at,
        inbox_email_id: emailId,
      },
    })
    .select("id, numero_expediente")
    .single();
  if (insErr || !created) {
    return { ok: false, error: `No se pudo crear la solicitud: ${insErr?.message ?? "sin datos"}` };
  }
  const solicitudId = created.id as string;

  if (attachmentIds.length > 0) {
    const rows = attachmentIds.map((aid) => ({
      solicitud_id: solicitudId,
      inbox_attachment_id: aid,
    }));
    const { error: linkErr } = await supabase
      .from("solicitud_inbox_attachments")
      .insert(rows);
    if (linkErr) {
      // No rollback (mantenemos la solicitud), pero reportamos
      console.warn("[convertirMailASolicitud] link attachments error", linkErr.message);
    }
  }

  await supabase
    .from("inbox_emails")
    .update({ status: "processed", updated_at: new Date().toISOString() })
    .eq("id", emailId);

  await supabase.from("audit_log").insert({
    user_id: user.id,
    inbox_email_id: emailId,
    area_id: initialAreaId,
    event_type: "mail_converted_to_solicitud",
    description: `Convertido a expediente ${created.numero_expediente ?? "(sin nro)"}`,
    metadata: {
      solicitud_id: solicitudId,
      attachment_ids: attachmentIds,
      tipo_slug: tipoSlug,
    },
  });

  await supabase.from("audit_log").insert({
    user_id: user.id,
    solicitud_id: solicitudId,
    area_id: initialAreaId,
    event_type: "solicitud_created",
    description: `Creada desde mail "${mail.subject}"`,
    metadata: {
      inbox_email_id: emailId,
      from_email: mail.from_email,
      attachment_ids: attachmentIds,
    },
  });

  revalidatePath(`/bandeja/mails/${emailId}`);
  revalidatePath("/bandeja/mails");
  revalidatePath(`/solicitudes/${solicitudId}`);
  return { ok: true, solicitudId };
}

/** Dispara un sync IMAP on-demand desde el browser. Valida acceso primero. */
export async function syncInboxNow(): Promise<
  { ok: true; synced: number; skipped: number } | { ok: false; error: string }
> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "No autenticado." };

  const { canAccessInbox } = await import("@/lib/data");
  if (!(await canAccessInbox())) {
    return { ok: false, error: "Sin permisos para sincronizar la bandeja." };
  }

  try {
    const { syncImapInbox } = await import("@/lib/imap/sync");
    const result = await syncImapInbox();
    if (result.synced > 0) {
      revalidatePath("/bandeja/mails");
    }
    return { ok: true, synced: result.synced, skipped: result.skipped };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
