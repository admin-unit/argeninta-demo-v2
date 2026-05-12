import Link from 'next/link'
import { SOLICITUDES } from '@/lib/mock-data'
import { EstadoBadge } from '@/components/solicitudes/estado-badge'
import { formatImporte, formatFecha } from '@/lib/utils'
import { TIPO_LABEL } from '@/types'

export default function Facturas() {
  const facturas = SOLICITUDES.filter(s => s.tipo === 'pago_factura' || s.tipo === 'rendicion')

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-foreground">Facturas y Rendiciones</h1>
        <p className="text-sm text-gray-400 mt-0.5">{facturas.length} registros</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/60">
              <th className="text-left px-4 py-3 text-[10.5px] font-semibold text-gray-400 uppercase tracking-wider">Expediente</th>
              <th className="text-left px-4 py-3 text-[10.5px] font-semibold text-gray-400 uppercase tracking-wider">Tipo</th>
              <th className="text-left px-4 py-3 text-[10.5px] font-semibold text-gray-400 uppercase tracking-wider">Concepto</th>
              <th className="text-left px-4 py-3 text-[10.5px] font-semibold text-gray-400 uppercase tracking-wider">Organismo</th>
              <th className="text-left px-4 py-3 text-[10.5px] font-semibold text-gray-400 uppercase tracking-wider">Fecha</th>
              <th className="text-left px-4 py-3 text-[10.5px] font-semibold text-gray-400 uppercase tracking-wider">Estado</th>
              <th className="text-right px-4 py-3 text-[10.5px] font-semibold text-gray-400 uppercase tracking-wider">Importe</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {facturas.map(s => (
              <tr key={s.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-4 py-3">
                  <Link href={`/solicitudes/${s.id}`} className="font-mono text-[11px] font-semibold text-gray-500 hover:underline">{s.nro}</Link>
                </td>
                <td className="px-4 py-3 text-gray-400 text-[12px]">{TIPO_LABEL[s.tipo]}</td>
                <td className="px-4 py-3 text-gray-700 max-w-[200px]">
                  <Link href={`/solicitudes/${s.id}`} className="hover:underline line-clamp-1">{s.concepto}</Link>
                </td>
                <td className="px-4 py-3 text-gray-500 text-[12px]">{s.organismo}</td>
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
