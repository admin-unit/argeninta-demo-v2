import { PorAreaFiltro } from "./por-area-filtro";

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
    porArea: Array<{
      current_area_id: string | null;
      current_area_name: string | null;
      status: string;
    }>;
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

      <PorAreaFiltro
        porArea={summary.porArea}
        solicitudesRecientes={solicitudesRecientes}
      />
    </div>
  );
}
