"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { cn, formatImporte, formatFecha } from "@/lib/utils";
import {
  getSolicitudesForArea,
  type SolicitudListItem,
} from "@/app/actions/solicitudes";

export function PorAreaFiltro({
  porArea,
  solicitudesRecientes,
}: {
  porArea: Array<{
    current_area_id: string | null;
    current_area_name: string | null;
    status: string;
  }>;
  solicitudesRecientes: SolicitudListItem[];
}) {
  // areaId puede ser null para "(sin área)" — entonces filtramos client-side
  const [seleccionada, setSeleccionada] = useState<{
    id: string | null;
    name: string;
  } | null>(null);
  const [cacheByArea, setCacheByArea] = useState<Record<string, SolicitudListItem[]>>({});
  const [isPending, startTransition] = useTransition();

  const conteoPorArea = useMemo(() => {
    const m = new Map<
      string,
      { id: string | null; name: string; count: number }
    >();
    for (const s of porArea) {
      const name = s.current_area_name || "(sin área)";
      const id = s.current_area_id;
      const key = id ?? `__sin__:${name}`;
      const prev = m.get(key);
      if (prev) prev.count += 1;
      else m.set(key, { id, name, count: 1 });
    }
    return [...m.values()].sort((a, b) => b.count - a.count);
  }, [porArea]);

  function pickArea(area: { id: string | null; name: string } | null) {
    if (!area) {
      setSeleccionada(null);
      return;
    }
    setSeleccionada(area);
    if (area.id && !cacheByArea[area.id]) {
      startTransition(async () => {
        const rows = await getSolicitudesForArea(area.id!);
        setCacheByArea((prev) => ({ ...prev, [area.id!]: rows }));
      });
    }
  }

  // Fuente de datos para la tabla:
  //  - sin selección → recientes
  //  - con selección + cache → cache
  //  - con selección sin cache (loading) → recientes filtradas como fallback
  const filtradas: SolicitudListItem[] = useMemo(() => {
    if (!seleccionada) return solicitudesRecientes;
    if (seleccionada.id && cacheByArea[seleccionada.id]) {
      return cacheByArea[seleccionada.id];
    }
    // Fallback mientras carga, o "(sin área)" (no tiene id)
    return solicitudesRecientes.filter(
      (s) => (s.current_area_name || "(sin área)") === seleccionada.name,
    );
  }, [seleccionada, solicitudesRecientes, cacheByArea]);

  const loadingArea =
    !!seleccionada?.id && !cacheByArea[seleccionada.id] && isPending;

  if (conteoPorArea.length === 0) return null;

  return (
    <>
      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[13px] font-semibold text-gray-800">Por área</h3>
          {seleccionada && (
            <button
              onClick={() => pickArea(null)}
              className="text-[11.5px] text-gray-500 hover:text-gray-800 underline underline-offset-2"
            >
              Limpiar filtro
            </button>
          )}
        </div>
        <p className="text-[11.5px] text-gray-500 mb-3">
          Tocá un área para ver las solicitudes que están actualmente en esa instancia.
        </p>
        <div className="grid grid-cols-3 gap-3">
          {conteoPorArea.map((a) => {
            const active = seleccionada?.name === a.name;
            return (
              <button
                key={`${a.id ?? "_"}-${a.name}`}
                onClick={() => pickArea(active ? null : { id: a.id, name: a.name })}
                className={cn(
                  "text-left rounded-lg p-3 border transition-all",
                  active
                    ? "border-primary bg-primary/[0.04] ring-2 ring-primary/15"
                    : "border-gray-100 hover:border-gray-300 hover:bg-gray-50/50",
                )}
              >
                <p
                  className={cn(
                    "text-[12px] transition-colors",
                    active ? "text-primary font-semibold" : "text-gray-600",
                  )}
                >
                  {a.name}
                </p>
                <p
                  className={cn(
                    "text-xl font-semibold tabular-nums",
                    active ? "text-primary" : "text-gray-900",
                  )}
                >
                  {a.count}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[13px] font-semibold text-gray-800">
            {seleccionada ? `Solicitudes en ${seleccionada.name}` : "Solicitudes recientes"}
            {seleccionada && !loadingArea && (
              <span className="ml-2 inline-flex items-center gap-1 text-[11px] font-medium text-primary bg-primary/[0.08] border border-primary/15 px-2 py-0.5 rounded-full">
                {filtradas.length} {filtradas.length === 1 ? "expediente" : "expedientes"}
              </span>
            )}
          </h3>
          <Link
            href="/bandeja-nacional"
            className="text-[11px] text-gray-500 hover:text-gray-700"
          >
            Ir a bandeja →
          </Link>
        </div>

        {loadingArea ? (
          <div className="py-12 flex flex-col items-center justify-center text-gray-500">
            <svg className="animate-spin w-5 h-5 mb-2" fill="none" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
              <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" className="opacity-75" />
            </svg>
            <p className="text-[12.5px]">Cargando expedientes de {seleccionada?.name}…</p>
          </div>
        ) : filtradas.length === 0 ? (
          <p className="text-sm text-gray-500">
            {seleccionada
              ? `No hay solicitudes actualmente en ${seleccionada.name}.`
              : "Todavía no hay solicitudes en el sistema."}
          </p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="text-[10px] text-gray-400 uppercase tracking-wide border-b border-gray-100">
                <th className="text-left pb-2">N°</th>
                <th className="text-left pb-2">Tipo</th>
                <th className="text-left pb-2">Organismo</th>
                <th className="text-left pb-2">Concepto</th>
                <th className="text-left pb-2">Área</th>
                <th className="text-left pb-2">Estado</th>
                <th className="text-right pb-2">Importe</th>
                <th className="text-right pb-2">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {filtradas.map((s) => (
                <tr key={s.id} className="border-t border-gray-50 hover:bg-gray-50/40">
                  <td className="py-2 pr-4 text-[12px] font-mono text-gray-700">
                    <Link href={`/solicitudes/${s.id}`} className="hover:underline">
                      {s.numero_expediente || "(borrador)"}
                    </Link>
                  </td>
                  <td className="py-2 pr-4 text-[12px] text-gray-700">{s.tipo_name || "-"}</td>
                  <td className="py-2 pr-4 text-[11.5px] text-gray-600">
                    {s.organism_short_name || "-"}
                  </td>
                  <td className="py-2 pr-4 text-[12px] text-gray-800">
                    {(s.concepto || "").slice(0, 35)}
                  </td>
                  <td className="py-2 pr-4 text-[11.5px] text-gray-500">
                    {s.current_area_name || "-"}
                  </td>
                  <td className="py-2 pr-4 text-[11px] text-gray-600">{s.status}</td>
                  <td className="py-2 pl-4 text-right text-[12px] text-gray-900">
                    {s.importe ? formatImporte(Number(s.importe), s.moneda || "ARS") : "-"}
                  </td>
                  <td className="py-2 pl-4 text-right text-[11px] text-gray-500">
                    {formatFecha(s.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
