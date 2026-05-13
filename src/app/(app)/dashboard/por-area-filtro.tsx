"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { cn, formatImporte, formatFecha } from "@/lib/utils";

interface SolicitudReciente {
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

export function PorAreaFiltro({
  porArea,
  solicitudesRecientes,
}: {
  porArea: Array<{ current_area_name: string | null; status: string }>;
  solicitudesRecientes: SolicitudReciente[];
}) {
  const [seleccionada, setSeleccionada] = useState<string | null>(null);

  const conteoPorArea = useMemo(() => {
    const m = new Map<string, number>();
    for (const s of porArea) {
      const a = s.current_area_name || "(sin área)";
      m.set(a, (m.get(a) || 0) + 1);
    }
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [porArea]);

  const filtradas = useMemo(() => {
    if (!seleccionada) return solicitudesRecientes;
    return solicitudesRecientes.filter(
      (s) => (s.current_area_name || "(sin área)") === seleccionada,
    );
  }, [solicitudesRecientes, seleccionada]);

  if (conteoPorArea.length === 0) return null;

  return (
    <>
      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[13px] font-semibold text-gray-800">Por área</h3>
          {seleccionada && (
            <button
              onClick={() => setSeleccionada(null)}
              className="text-[11.5px] text-gray-500 hover:text-gray-800 underline underline-offset-2"
            >
              Limpiar filtro
            </button>
          )}
        </div>
        <p className="text-[11.5px] text-gray-500 mb-3">
          Tocá un área para filtrar las solicitudes recientes que la atraviesan.
        </p>
        <div className="grid grid-cols-3 gap-3">
          {conteoPorArea.map(([area, count]) => {
            const active = seleccionada === area;
            return (
              <button
                key={area}
                onClick={() => setSeleccionada(active ? null : area)}
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
                  {area}
                </p>
                <p
                  className={cn(
                    "text-xl font-semibold tabular-nums",
                    active ? "text-primary" : "text-gray-900",
                  )}
                >
                  {count}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[13px] font-semibold text-gray-800">
            Solicitudes recientes
            {seleccionada && (
              <span className="ml-2 inline-flex items-center gap-1 text-[11px] font-medium text-primary bg-primary/[0.08] border border-primary/15 px-2 py-0.5 rounded-full">
                Filtrado: {seleccionada}
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

        {filtradas.length === 0 ? (
          <p className="text-sm text-gray-500">
            {seleccionada
              ? `Ninguna de las solicitudes recientes está actualmente en ${seleccionada}.`
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
