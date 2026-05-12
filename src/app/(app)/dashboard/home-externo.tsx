import Link from 'next/link'
import { SOLICITUDES, CUENTAS_ANALITICAS, CONVENIOS, MAILS_INTA } from '@/lib/mock-data'
import { EstadoBadge } from '@/components/solicitudes/estado-badge'
import { formatImporte, formatFecha } from '@/lib/utils'
import { TIPO_LABEL } from '@/types'

const ORG = 'INTA'

export function HomeExterno() {
  const solicitudes = SOLICITUDES.filter(s => s.organismo === ORG)
  const cuentas = CUENTAS_ANALITICAS.filter(c => c.organismo === ORG)
  const convenios = CONVENIOS.filter(c => c.organismo === ORG)

  const totalSaldo = cuentas.reduce((sum, c) => sum + c.saldo_total, 0)
  const pendienteSaldo = solicitudes
    .filter(s => ['pendiente', 'en_gestion', 'en_tesoreria'].includes(s.estado))
    .reduce((sum, s) => sum + s.importe, 0)
  const enProceso = solicitudes.filter(s => ['pendiente', 'en_gestion', 'en_tesoreria'].includes(s.estado)).length
  const completadas = solicitudes.filter(s => s.estado === 'pagado').length
  const mailsNuevos = MAILS_INTA.filter(m => !m.leido).length

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-foreground">Inicio</h1>
        <Link
          href="/solicitudes/nueva?bandeja=nacional"
          className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nueva solicitud
        </Link>
      </div>

      {/* Card grande: Saldo */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-4">
        {/* Stats row */}
        <div className="grid grid-cols-4 gap-6 pb-5 mb-5 border-b border-gray-100">
          <div>
            <p className="text-[10.5px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Saldo total</p>
            <p className="text-2xl font-bold text-gray-900">${new Intl.NumberFormat('es-AR').format(totalSaldo)}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">{cuentas.length} convenios</p>
          </div>
          <div>
            <p className="text-[10.5px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Saldo pendiente</p>
            <p className="text-2xl font-bold text-amber-600">${new Intl.NumberFormat('es-AR').format(pendienteSaldo)}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">en trámite</p>
          </div>
          <div>
            <p className="text-[10.5px] font-semibold text-gray-400 uppercase tracking-wider mb-1">En proceso</p>
            <p className="text-2xl font-bold text-blue-600">{enProceso}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">solicitudes activas</p>
          </div>
          <div>
            <p className="text-[10.5px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Completadas</p>
            <p className="text-2xl font-bold text-emerald-600">{completadas}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">este año</p>
          </div>
        </div>

        {/* 3 sub-cards */}
        <div className="grid grid-cols-3 gap-4">
          {/* Convenios */}
          <Link href="/mi-organismo" className="block bg-gray-50 border border-gray-200 rounded-lg p-4 hover:border-gray-300 hover:bg-gray-100/60 transition-all group">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[13px] font-semibold text-gray-800">Convenios</h3>
              <span className="text-[10px] text-gray-400 group-hover:text-gray-600">Ver todos →</span>
            </div>
            <div className="space-y-2">
              {convenios.slice(0, 3).map(c => (
                <div key={c.id} className="flex items-center justify-between">
                  <span className="text-[11.5px] text-gray-600 truncate flex-1 mr-2">{c.nombre}</span>
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded shrink-0 ${
                    c.estado === 'vigente' ? 'bg-emerald-50 text-emerald-700' :
                    c.estado === 'vencido' ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-500'
                  }`}>{c.estado}</span>
                </div>
              ))}
            </div>
          </Link>

          {/* Facturas */}
          <Link href="/mi-organismo/facturas" className="block bg-gray-50 border border-gray-200 rounded-lg p-4 hover:border-gray-300 hover:bg-gray-100/60 transition-all group">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[13px] font-semibold text-gray-800">Facturas</h3>
              <span className="text-[10px] text-gray-400 group-hover:text-gray-600">Ver todas →</span>
            </div>
            <table className="w-full">
              <thead>
                <tr className="text-[10px] text-gray-400 uppercase tracking-wide">
                  <th className="text-left pb-1.5">Expediente</th>
                  <th className="text-right pb-1.5">Estado</th>
                </tr>
              </thead>
              <tbody>
                {solicitudes.filter(s => s.tipo === 'pago_factura').slice(0, 3).map(s => (
                  <tr key={s.id} className="border-t border-gray-100">
                    <td className="py-1.5 text-[11px] font-mono text-gray-500">{s.nro.slice(-6)}</td>
                    <td className="py-1.5 text-right">
                      <EstadoBadge estado={s.estado} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Link>

          {/* Solicitudes */}
          <Link href="/mi-organismo/solicitudes" className="block bg-gray-50 border border-gray-200 rounded-lg p-4 hover:border-gray-300 hover:bg-gray-100/60 transition-all group">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[13px] font-semibold text-gray-800">Solicitudes</h3>
              <span className="text-[10px] text-gray-400 group-hover:text-gray-600">Ver todas →</span>
            </div>
            <div className="space-y-2">
              {solicitudes.slice(0, 3).map(s => (
                <div key={s.id} className="flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-[11.5px] text-gray-700 truncate">{s.concepto}</p>
                    <p className="text-[10.5px] text-gray-400">{TIPO_LABEL[s.tipo]} · {formatImporte(s.importe, s.moneda)}</p>
                  </div>
                  <EstadoBadge estado={s.estado} />
                </div>
              ))}
            </div>
          </Link>
        </div>
      </div>

      {/* Card mails */}
      <Link href="/mi-organismo/mails" className="block bg-white border border-gray-200 rounded-xl p-4 hover:border-gray-300 transition-all group">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h3 className="text-[13px] font-semibold text-gray-800">Mails</h3>
            {mailsNuevos > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{mailsNuevos}</span>
            )}
          </div>
          <span className="text-[10px] text-gray-400 group-hover:text-gray-600">Ver todos →</span>
        </div>
        <table className="w-full">
          <thead>
            <tr className="text-[10px] text-gray-400 uppercase tracking-wide border-b border-gray-100">
              <th className="text-left pb-2">Asunto</th>
              <th className="text-left pb-2">De</th>
              <th className="text-left pb-2">Fecha</th>
              <th className="text-right pb-2">Estado</th>
            </tr>
          </thead>
          <tbody>
            {MAILS_INTA.map(m => (
              <tr key={m.id} className="border-t border-gray-50 hover:bg-gray-50/50">
                <td className={`py-2 pr-4 text-[12px] ${m.leido ? 'text-gray-500' : 'font-semibold text-gray-800'}`}>{m.asunto}</td>
                <td className="py-2 pr-4 text-[11.5px] text-gray-400">{m.de}</td>
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
    </div>
  )
}
