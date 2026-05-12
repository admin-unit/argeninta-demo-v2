import Link from "next/link";
import { formatImporte, formatFecha } from "@/lib/utils";

interface Props {
  profile: { id: string; full_name: string | null; email: string };
  organism: { id: string; name: string; short_name: string | null };
  resumen: {
    convenios: Array<{
      odoo_analytic_account_id: number;
      code: string | null;
      name: string;
      fuente_financiamiento: string | null;
      analytic: { balance: number } | { balance: number }[] | null;
    }>;
    totalSaldo: number;
    enProceso: number;
    completadas: number;
    cancelled: number;
    pendienteSaldo: number;
    totalSolicitudes: number;
  };
  solicitudes: Array<{
    id: string;
    numero_expediente: string | null;
    tipo_name: string | null;
    concepto: string | null;
    importe: number | null;
    moneda: string | null;
    status: string;
    created_at: string;
  }>;
}

export function HomeExterno({ profile, organism, resumen, solicitudes }: Props) {
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-foreground">
            Hola, {profile.full_name || profile.email}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Organismo: <span className="font-medium">{organism.short_name || organism.name}</span>
          </p>
        </div>
        <Link
          href="/solicitudes/nueva"
          className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nueva solicitud
        </Link>
      </div>

      {/* Stats */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-4">
        <div className="grid grid-cols-4 gap-6 pb-5 mb-5 border-b border-gray-100">
          <div>
            <p className="text-[11px] uppercase text-gray-400 tracking-wide mb-1">Saldo total</p>
            <p className="text-xl font-semibold text-gray-900">{formatImporte(resumen.totalSaldo, "ARS")}</p>
            <p className="text-[11px] text-gray-500 mt-0.5">{resumen.convenios.length} convenios</p>
          </div>
          <div>
            <p className="text-[11px] uppercase text-gray-400 tracking-wide mb-1">En proceso</p>
            <p className="text-xl font-semibold text-gray-900">{resumen.enProceso}</p>
            <p className="text-[11px] text-gray-500 mt-0.5">{formatImporte(resumen.pendienteSaldo, "ARS")}</p>
          </div>
          <div>
            <p className="text-[11px] uppercase text-gray-400 tracking-wide mb-1">Completadas</p>
            <p className="text-xl font-semibold text-gray-900">{resumen.completadas}</p>
            <p className="text-[11px] text-gray-500 mt-0.5">cerradas</p>
          </div>
          <div>
            <p className="text-[11px] uppercase text-gray-400 tracking-wide mb-1">Total</p>
            <p className="text-xl font-semibold text-gray-900">{resumen.totalSolicitudes}</p>
            <p className="text-[11px] text-gray-500 mt-0.5">solicitudes</p>
          </div>
        </div>
      </div>

      {/* Mis convenios */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[13px] font-semibold text-gray-800">Mis convenios</h3>
          <Link href="/convenios" className="text-[11px] text-gray-500 hover:text-gray-700">
            Ver todos →
          </Link>
        </div>
        {resumen.convenios.length === 0 ? (
          <p className="text-sm text-gray-500">Todavía no tenés convenios asignados.</p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="text-[10px] text-gray-400 uppercase tracking-wide border-b border-gray-100">
                <th className="text-left pb-2">Código</th>
                <th className="text-left pb-2">Nombre</th>
                <th className="text-left pb-2">Fuente</th>
                <th className="text-right pb-2">Saldo</th>
              </tr>
            </thead>
            <tbody>
              {resumen.convenios.slice(0, 8).map((c) => {
                const balance = Array.isArray(c.analytic)
                  ? c.analytic[0]?.balance || 0
                  : c.analytic?.balance || 0;
                return (
                  <tr key={c.odoo_analytic_account_id} className="border-t border-gray-50">
                    <td className="py-2 pr-4 text-[12px] font-mono text-gray-700">
                      {c.code || "-"}
                    </td>
                    <td className="py-2 pr-4 text-[12px] text-gray-800">
                      {c.name.slice(0, 60)}
                    </td>
                    <td className="py-2 pr-4 text-[11.5px] text-gray-500">
                      {c.fuente_financiamiento || "-"}
                    </td>
                    <td className="py-2 pl-4 text-right text-[12px] font-semibold text-gray-900">
                      {formatImporte(Number(balance), "ARS")}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Mis solicitudes recientes */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[13px] font-semibold text-gray-800">Mis solicitudes recientes</h3>
          <Link href="/mis-solicitudes" className="text-[11px] text-gray-500 hover:text-gray-700">
            Ver todas →
          </Link>
        </div>
        {solicitudes.length === 0 ? (
          <p className="text-sm text-gray-500">
            Todavía no creaste ninguna solicitud. <Link href="/solicitudes/nueva" className="text-blue-600 hover:underline">Crear una</Link>
          </p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="text-[10px] text-gray-400 uppercase tracking-wide border-b border-gray-100">
                <th className="text-left pb-2">N°</th>
                <th className="text-left pb-2">Tipo</th>
                <th className="text-left pb-2">Concepto</th>
                <th className="text-left pb-2">Estado</th>
                <th className="text-right pb-2">Importe</th>
                <th className="text-right pb-2">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {solicitudes.map((s) => (
                <tr key={s.id} className="border-t border-gray-50">
                  <td className="py-2 pr-4 text-[12px] font-mono text-gray-700">
                    {s.numero_expediente || "(borrador)"}
                  </td>
                  <td className="py-2 pr-4 text-[12px] text-gray-700">{s.tipo_name || "-"}</td>
                  <td className="py-2 pr-4 text-[12px] text-gray-800">
                    {(s.concepto || "").slice(0, 40)}
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
