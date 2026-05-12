import Link from "next/link";
import { formatImporte, formatFecha } from "@/lib/utils";

interface Props {
  profile: {
    id: string;
    full_name: string | null;
    email: string;
    is_super_admin: boolean;
  };
  summary: {
    totalSolicitudes: number;
    enProceso: number;
    completadas: number;
    porArea: Array<{ current_area_name: string | null; status: string }>;
  };
  solicitudesRecientes: Array<{
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
  }>;
}

export function HomeInterno({ profile, summary, solicitudesRecientes }: Props) {
  // Contar por área
  const porArea = new Map<string, number>();
  for (const s of summary.porArea) {
    const a = s.current_area_name || "(sin área)";
    porArea.set(a, (porArea.get(a) || 0) + 1);
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-foreground">
            Hola, {profile.full_name || profile.email}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {profile.is_super_admin ? "Super-admin · Argeninta" : "Personal interno · Argeninta"}
          </p>
        </div>
      </div>

      {/* Stats globales */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <p className="text-[11px] uppercase text-gray-400 tracking-wide mb-1">Total solicitudes</p>
          <p className="text-2xl font-semibold text-gray-900">{summary.totalSolicitudes}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <p className="text-[11px] uppercase text-gray-400 tracking-wide mb-1">En proceso</p>
          <p className="text-2xl font-semibold text-blue-700">{summary.enProceso}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <p className="text-[11px] uppercase text-gray-400 tracking-wide mb-1">Completadas</p>
          <p className="text-2xl font-semibold text-green-700">{summary.completadas}</p>
        </div>
      </div>

      {/* Por área */}
      {porArea.size > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
          <h3 className="text-[13px] font-semibold text-gray-800 mb-3">Por área</h3>
          <div className="grid grid-cols-3 gap-4">
            {[...porArea.entries()].map(([area, count]) => (
              <div key={area} className="border border-gray-100 rounded-lg p-3">
                <p className="text-[12px] text-gray-600">{area}</p>
                <p className="text-xl font-semibold text-gray-900">{count}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Solicitudes recientes */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[13px] font-semibold text-gray-800">Solicitudes recientes</h3>
          <Link href="/bandeja-nacional" className="text-[11px] text-gray-500 hover:text-gray-700">
            Ir a bandeja →
          </Link>
        </div>
        {solicitudesRecientes.length === 0 ? (
          <p className="text-sm text-gray-500">
            Todavía no hay solicitudes en el sistema. Las nuevas aparecerán acá.
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
              {solicitudesRecientes.map((s) => (
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
    </div>
  );
}
