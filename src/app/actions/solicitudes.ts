"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { AREA_IDS, getSolicitudes } from "@/lib/data";
import type { EstadoSolicitud } from "@/types";

/** Transición de status + a qué área deriva + qué descripción registra. */
type Transition = {
  next: EstadoSolicitud;
  description: string;
  routeToArea?: string;
  setTimestamp?: "posted_at" | "closed_at";
};

const TRANSITIONS: Partial<Record<EstadoSolicitud, Transition>> = {
  submitted: {
    next: "in_review",
    description: "Solicitud tomada en revisión",
  },
  in_review: {
    next: "in_progress",
    description: "Derivada a Administración para gestión",
    routeToArea: AREA_IDS.ADMINISTRACION,
  },
  in_progress: {
    next: "posted_to_odoo",
    description: "Factura cargada en Odoo",
    setTimestamp: "posted_at",
  },
  posted_to_odoo: {
    next: "in_payment",
    description: "Pago iniciado — derivado a Tesorería",
    routeToArea: AREA_IDS.TESORERIA,
  },
  in_payment: {
    next: "closed",
    description: "Pago conciliado — expediente cerrado",
    setTimestamp: "closed_at",
  },
};

export interface SolicitudListItem {
  id: string;
  numero_expediente: string | null;
  tipo_name: string | null;
  concepto: string | null;
  importe: number | null;
  moneda: string | null;
  status: string;
  organism_short_name: string | null;
  current_area_name: string | null;
  created_at: string;
}

/**
 * Trae todas las solicitudes que actualmente están en un área específica.
 * Usado por el filtro "Por área" del dashboard cuando el usuario
 * selecciona un área distinta de las que se muestran en "recientes".
 */
/**
 * Avanza la solicitud al siguiente estado del flujo según TRANSITIONS.
 * Persiste en `solicitudes` + escribe entrada en `audit_log`. Respeta RLS:
 * solo usuarios autorizados (super admin, asignado, miembro del área actual,
 * o jefe del área) pueden ejecutar.
 */
export async function avanzarSolicitud(
  solicitudId: string,
): Promise<{ ok: true; newStatus: EstadoSolicitud } | { ok: false; error: string }> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "No estás autenticado." };

  const { data: current, error: readErr } = await supabase
    .from("solicitudes")
    .select("id, status, current_area_id")
    .eq("id", solicitudId)
    .maybeSingle();
  if (readErr || !current) {
    return { ok: false, error: "No se encontró la solicitud (o no tenés permisos)." };
  }

  const t = TRANSITIONS[current.status as EstadoSolicitud];
  if (!t) {
    return { ok: false, error: `No hay transición definida desde "${current.status}".` };
  }

  const newAreaId = t.routeToArea ?? current.current_area_id;

  const updatePayload: Record<string, unknown> = {
    status: t.next,
    current_area_id: newAreaId,
    updated_at: new Date().toISOString(),
  };
  if (t.setTimestamp) {
    updatePayload[t.setTimestamp] = new Date().toISOString();
  }

  const { error: updErr } = await supabase
    .from("solicitudes")
    .update(updatePayload)
    .eq("id", solicitudId);
  if (updErr) {
    return { ok: false, error: `No se pudo actualizar la solicitud: ${updErr.message}` };
  }

  const { error: auditErr } = await supabase.from("audit_log").insert({
    user_id: user.id,
    solicitud_id: solicitudId,
    area_id: newAreaId,
    event_type: "state_change",
    description: t.description,
    metadata: { from: current.status, to: t.next },
  });
  if (auditErr) {
    return { ok: false, error: `Estado actualizado pero falló el audit log: ${auditErr.message}` };
  }

  revalidatePath(`/solicitudes/${solicitudId}`);
  return { ok: true, newStatus: t.next };
}

/**
 * Agrega una nota al timeline (audit_log) de una solicitud sin cambiar status.
 */
export async function agregarNotaSolicitud(
  solicitudId: string,
  note: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const text = note.trim();
  if (!text) return { ok: false, error: "La nota está vacía." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "No estás autenticado." };

  // Tomar el area_id actual de la solicitud para registrarlo en el evento
  const { data: sol } = await supabase
    .from("solicitudes")
    .select("current_area_id")
    .eq("id", solicitudId)
    .maybeSingle();

  const { error } = await supabase.from("audit_log").insert({
    user_id: user.id,
    solicitud_id: solicitudId,
    area_id: sol?.current_area_id ?? null,
    event_type: "note",
    description: "Nota interna agregada",
    metadata: { note: text },
  });
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/solicitudes/${solicitudId}`);
  return { ok: true };
}

/**
 * Deshace el último cambio de estado: busca el último evento "state_change"
 * en audit_log, vuelve solicitudes.status a metadata.from y registra el undo.
 */
export async function deshacerUltimoPaso(
  solicitudId: string,
): Promise<{ ok: true; newStatus: EstadoSolicitud } | { ok: false; error: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "No estás autenticado." };

  const { data: lastChange } = await supabase
    .from("audit_log")
    .select("id, metadata, area_id")
    .eq("solicitud_id", solicitudId)
    .eq("event_type", "state_change")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!lastChange) {
    return { ok: false, error: "No hay un cambio de estado previo para deshacer." };
  }

  const meta = (lastChange.metadata ?? {}) as Record<string, unknown>;
  const previousStatus = meta.from as EstadoSolicitud | undefined;
  if (!previousStatus) {
    return { ok: false, error: "El último cambio no registró el estado anterior." };
  }

  // Estado actual + área para ver si tenemos que volver el área también
  const { data: current } = await supabase
    .from("solicitudes")
    .select("status, current_area_id")
    .eq("id", solicitudId)
    .maybeSingle();
  if (!current) return { ok: false, error: "No se encontró la solicitud." };

  // Si la transición original tenía routeToArea, el área anterior se infiere
  // buscando el evento state_change inmediatamente anterior. Si no hay,
  // dejamos el área como está.
  const { data: previousChange } = await supabase
    .from("audit_log")
    .select("area_id, metadata")
    .eq("solicitud_id", solicitudId)
    .eq("event_type", "state_change")
    .order("created_at", { ascending: false })
    .range(1, 1)
    .maybeSingle();

  const restoredAreaId = previousChange?.area_id ?? current.current_area_id;

  const updatePayload: Record<string, unknown> = {
    status: previousStatus,
    current_area_id: restoredAreaId,
    updated_at: new Date().toISOString(),
  };
  // Limpiar timestamps si retrocedemos a un punto antes del posteo / cierre
  if (previousStatus === "in_progress" || previousStatus === "in_review") {
    updatePayload.posted_at = null;
  }
  if (previousStatus !== "closed") {
    updatePayload.closed_at = null;
  }

  const { error: updErr } = await supabase
    .from("solicitudes")
    .update(updatePayload)
    .eq("id", solicitudId);
  if (updErr) return { ok: false, error: `No se pudo deshacer: ${updErr.message}` };

  const { error: auditErr } = await supabase.from("audit_log").insert({
    user_id: user.id,
    solicitud_id: solicitudId,
    area_id: restoredAreaId,
    event_type: "state_undo",
    description: `Revertido: volvió a "${previousStatus}"`,
    metadata: { from: current.status, to: previousStatus, undo_of_event: lastChange.id },
  });
  if (auditErr) {
    return { ok: false, error: `Estado revertido pero falló el audit log: ${auditErr.message}` };
  }

  revalidatePath(`/solicitudes/${solicitudId}`);
  return { ok: true, newStatus: previousStatus };
}

/**
 * Deriva la solicitud manualmente a otra área, sin cambiar status.
 * Útil para mandar a Jurídicos, Capital Humano, etc., fuera del flujo normal.
 */
export async function derivarManualmente(
  solicitudId: string,
  targetAreaId: string,
  motivo?: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "No estás autenticado." };

  const { data: current } = await supabase
    .from("solicitudes")
    .select("current_area_id")
    .eq("id", solicitudId)
    .maybeSingle();
  if (!current) return { ok: false, error: "No se encontró la solicitud." };

  if (current.current_area_id === targetAreaId) {
    return { ok: false, error: "La solicitud ya está en esa área." };
  }

  const { data: targetArea } = await supabase
    .from("internal_areas")
    .select("name")
    .eq("id", targetAreaId)
    .maybeSingle();
  if (!targetArea) return { ok: false, error: "Área destino no encontrada." };

  const { error: updErr } = await supabase
    .from("solicitudes")
    .update({ current_area_id: targetAreaId, updated_at: new Date().toISOString() })
    .eq("id", solicitudId);
  if (updErr) return { ok: false, error: `No se pudo derivar: ${updErr.message}` };

  const { error: auditErr } = await supabase.from("audit_log").insert({
    user_id: user.id,
    solicitud_id: solicitudId,
    area_id: targetAreaId,
    event_type: "manual_routing",
    description: `Derivada manualmente a ${targetArea.name}`,
    metadata: motivo
      ? { from_area_id: current.current_area_id, to_area_id: targetAreaId, motivo }
      : { from_area_id: current.current_area_id, to_area_id: targetAreaId },
  });
  if (auditErr) {
    return { ok: false, error: `Derivada pero falló el audit log: ${auditErr.message}` };
  }

  revalidatePath(`/solicitudes/${solicitudId}`);
  return { ok: true };
}

/**
 * Cancela la solicitud — pone status='cancelled' desde cualquier estado.
 */
export async function cancelarSolicitud(
  solicitudId: string,
  motivo: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const text = motivo.trim();
  if (!text) return { ok: false, error: "Hay que indicar la razón de la cancelación." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "No estás autenticado." };

  const { data: current } = await supabase
    .from("solicitudes")
    .select("status, current_area_id")
    .eq("id", solicitudId)
    .maybeSingle();
  if (!current) return { ok: false, error: "No se encontró la solicitud." };
  if (current.status === "cancelled") {
    return { ok: false, error: "La solicitud ya estaba cancelada." };
  }
  if (current.status === "closed") {
    return { ok: false, error: "No se puede cancelar un expediente cerrado." };
  }

  const { error: updErr } = await supabase
    .from("solicitudes")
    .update({ status: "cancelled", updated_at: new Date().toISOString() })
    .eq("id", solicitudId);
  if (updErr) return { ok: false, error: `No se pudo cancelar: ${updErr.message}` };

  const { error: auditErr } = await supabase.from("audit_log").insert({
    user_id: user.id,
    solicitud_id: solicitudId,
    area_id: current.current_area_id,
    event_type: "cancellation",
    description: `Expediente cancelado: ${text}`,
    metadata: { from: current.status, motivo: text },
  });
  if (auditErr) {
    return { ok: false, error: `Cancelada pero falló el audit log: ${auditErr.message}` };
  }

  revalidatePath(`/solicitudes/${solicitudId}`);
  return { ok: true };
}

export async function getSolicitudesForArea(
  areaId: string,
): Promise<SolicitudListItem[]> {
  const rows = await getSolicitudes({ current_area_id: areaId, limit: 200 });
  return rows.map((r) => ({
    id: r.id,
    numero_expediente: r.numero_expediente,
    tipo_name: r.tipo_name,
    concepto: r.concepto,
    importe: r.importe == null ? null : Number(r.importe),
    moneda: r.moneda,
    status: r.status,
    organism_short_name: r.organism_short_name,
    current_area_name: r.current_area_name,
    created_at: r.created_at,
  }));
}
