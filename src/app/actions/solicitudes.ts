"use server";

import { getSolicitudes } from "@/lib/data";

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
