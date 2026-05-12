import Link from 'next/link'
import { SOLICITUDES, MAILS_INTERNO, USUARIOS_INTERNOS } from '@/lib/mock-data'
import { EstadoBadge } from '@/components/solicitudes/estado-badge'
import { formatImporte, formatFecha } from '@/lib/utils'

export function HomeInterno() {
  const pendientes = SOLICITUDES.filter(s => ['pendiente', 'en_gestion'].includes(s.estado))
  const mailsNuevos = MAILS_INTERNO.filter(m => !m.leido).length

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold text-foreground mb-6">Bandeja de entrada</h1>

      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-3">

        {/* Mails */}
        <Link href="/bandeja/mails" className="block bg-gray-50 border border-gray-200 rounded-lg p-4 hover:border-gray-300 hover:bg-gray-100/60 transition-all group">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <h3 className="text-[13px] font-semibold text-gray-800">Mails</h3>
              {mailsNuevos > 0 && (
                <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{mailsNuevos} nuevos</span>
              )}
            </div>
            <span className="text-[10px] text-gray-400 group-hover:text-gray-600">Ver todos →</span>
          </div>
          <table className="w-full">
            <thead>
              <tr className="text-[10px] text-gray-400 uppercase tracking-wide border-b border-gray-100">
                <th className="text-left pb-2">Asunto</th>
                <th className="text-left pb-2">Organismo</th>
                <th className="text-left pb-2">Fecha</th>
                <th className="text-right pb-2">Estado</th>
              </tr>
            </thead>
            <tbody>
              {MAILS_INTERNO.map(m => (
                <tr key={m.id} className="border-t border-gray-50">
                  <td className={`py-2 pr-4 text-[12px] ${m.leido ? 'text-gray-500' : 'font-semibold text-gray-800'}`}>{m.asunto}</td>
                  <td className="py-2 pr-4 text-[11.5px] text-gray-400">{m.organismo ?? m.de}</td>
                  <td className="py-2 pr-4 text-[11.5px] text-gray-400">{formatFecha(m.fecha)}</td>
                  <td className="py-2 text-right">
                    {m.leido
                      ? <span className="text-[11px] text-gray-400">Leído</span>
                      : <span className="text-[11px] font-semibold text-amber-600">● Nuevo</span>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Link>

        {/* Solicitudes */}
        <Link href="/bandeja-nacional" className="block bg-gray-50 border border-gray-200 rounded-lg p-4 hover:border-gray-300 hover:bg-gray-100/60 transition-all group">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <h3 className="text-[13px] font-semibold text-gray-800">Solicitudes</h3>
              {pendientes.length > 0 && (
                <span className="bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{pendientes.length} pendientes</span>
              )}
            </div>
            <span className="text-[10px] text-gray-400 group-hover:text-gray-600">Ver todas →</span>
          </div>
          <table className="w-full">
            <thead>
              <tr className="text-[10px] text-gray-400 uppercase tracking-wide border-b border-gray-100">
                <th className="text-left pb-2">Nro</th>
                <th className="text-left pb-2">Concepto</th>
                <th className="text-left pb-2">Organismo</th>
                <th className="text-left pb-2">Importe</th>
                <th className="text-right pb-2">Estado</th>
              </tr>
            </thead>
            <tbody>
              {SOLICITUDES.slice(0, 4).map(s => (
                <tr key={s.id} className="border-t border-gray-50">
                  <td className="py-2 pr-3 font-mono text-[11px] text-gray-400">{s.nro.slice(-4)}</td>
                  <td className="py-2 pr-3 text-[12px] text-gray-700 max-w-[200px] truncate">{s.concepto}</td>
                  <td className="py-2 pr-3 text-[11.5px] text-gray-400">{s.organismo}</td>
                  <td className="py-2 pr-3 text-[11.5px] text-gray-600 tabular-nums">{formatImporte(s.importe, s.moneda)}</td>
                  <td className="py-2 text-right"><EstadoBadge estado={s.estado} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Link>

        {/* Actividades por usuario (jefe) */}
        <Link href="/organismos" className="block bg-blue-50 border border-blue-100 rounded-lg p-4 hover:border-blue-200 hover:bg-blue-50/80 transition-all group">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[13px] font-semibold text-gray-800">Actividades por usuario</h3>
            <span className="text-[10px] text-gray-400 group-hover:text-gray-600">Ver detalle →</span>
          </div>
          <table className="w-full">
            <thead>
              <tr className="text-[10px] text-gray-400 uppercase tracking-wide border-b border-blue-100">
                <th className="text-left pb-2">Usuario</th>
                <th className="text-left pb-2">Área</th>
                <th className="text-center pb-2">Tareas activas</th>
                <th className="text-center pb-2">Completadas hoy</th>
                <th className="text-right pb-2">Estado</th>
              </tr>
            </thead>
            <tbody>
              {USUARIOS_INTERNOS.map(u => (
                <tr key={u.id} className="border-t border-blue-100">
                  <td className="py-2 pr-3 text-[12px] font-medium text-gray-700">{u.nombre}</td>
                  <td className="py-2 pr-3 text-[11.5px] text-gray-400">{u.area}</td>
                  <td className="py-2 pr-3 text-center text-[12px] font-semibold text-gray-700">{u.tareasActivas}</td>
                  <td className="py-2 pr-3 text-center text-[12px] font-semibold text-gray-700">{u.completadasHoy}</td>
                  <td className="py-2 text-right">
                    {u.tareasActivas > 0
                      ? <span className="text-[11px] font-semibold text-emerald-600">● Activo</span>
                      : <span className="text-[11px] text-gray-400">Sin actividad</span>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Link>

      </div>
    </div>
  )
}
