import Link from 'next/link'
import { SOLICITUDES } from '@/lib/mock-data'
import { EstadoBadge } from '@/components/solicitudes/estado-badge'
import { formatImporte, formatFecha } from '@/lib/utils'
import { TIPO_LABEL } from '@/types'

const ORG = 'INTA'

export default function MisSolicitudesOrg() {
  const solicitudes = SOLICITUDES.filter(s => s.organismo === ORG)

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-[11px] text-gray-400 mb-0.5">
            <Link href="/dashboard" className="hover:underline">Inicio</Link> /{' '}
            <Link href="/mi-organismo" className="hover:underline">Mi Organismo</Link> / Solicitudes
          </p>
          <h1 className="text-xl font-semibold text-foreground">Solicitudes — {ORG}</h1>
          <p className="text-sm text-gray-400 mt-0.5">{solicitudes.length} solicitudes</p>
        </div>
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

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/60">
              <th className="text-left px-4 py-3 text-[10.5px] font-semibold text-gray-400 uppercase tracking-wider">Expediente</th>
              <th className="text-left px-4 py-3 text-[10.5px] font-semibold text-gray-400 uppercase tracking-wider">Tipo</th>
              <th className="text-left px-4 py-3 text-[10.5px] font-semibold text-gray-400 uppercase tracking-wider">Concepto</th>
              <th className="text-left px-4 py-3 text-[10.5px] font-semibold text-gray-400 uppercase tracking-wider">Fecha</th>
              <th className="text-left px-4 py-3 text-[10.5px] font-semibold text-gray-400 uppercase tracking-wider">Estado</th>
              <th className="text-right px-4 py-3 text-[10.5px] font-semibold text-gray-400 uppercase tracking-wider">Importe</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {solicitudes.map(s => (
              <tr key={s.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-4 py-3">
                  <Link href={`/solicitudes/${s.id}`} className="font-mono text-[11px] font-semibold text-gray-500 hover:underline">{s.nro}</Link>
                </td>
                <td className="px-4 py-3 text-gray-400 text-[12px]">{TIPO_LABEL[s.tipo]}</td>
                <td className="px-4 py-3 text-gray-700 max-w-[220px]">
                  <Link href={`/solicitudes/${s.id}`} className="hover:underline line-clamp-1">{s.concepto}</Link>
                </td>
                <td className="px-4 py-3 text-gray-400 text-[12px]">{formatFecha(s.fecha_solicitud)}</td>
                <td className="px-4 py-3"><EstadoBadge estado={s.estado} /></td>
                <td className="px-4 py-3 text-right font-semibold text-gray-700 tabular-nums">{formatImporte(s.importe, s.moneda)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
