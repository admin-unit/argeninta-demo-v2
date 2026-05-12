import Link from 'next/link'
import { CONVENIOS } from '@/lib/mock-data'
import { formatImporte, formatFecha } from '@/lib/utils'

const ORG = 'INTA'

export default function Convenios() {
  const convenios = CONVENIOS.filter(c => c.organismo === ORG)

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-[11px] text-gray-400 mb-0.5">
            <Link href="/dashboard" className="hover:underline">Inicio</Link> / Mi Organismo
          </p>
          <h1 className="text-xl font-semibold text-foreground">Convenios — {ORG}</h1>
          <p className="text-sm text-gray-400 mt-0.5">{convenios.length} convenios registrados</p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/60">
              <th className="text-left px-4 py-3 text-[10.5px] font-semibold text-gray-400 uppercase tracking-wider">Código</th>
              <th className="text-left px-4 py-3 text-[10.5px] font-semibold text-gray-400 uppercase tracking-wider">Nombre</th>
              <th className="text-left px-4 py-3 text-[10.5px] font-semibold text-gray-400 uppercase tracking-wider">Estado</th>
              <th className="text-left px-4 py-3 text-[10.5px] font-semibold text-gray-400 uppercase tracking-wider">Inicio</th>
              <th className="text-left px-4 py-3 text-[10.5px] font-semibold text-gray-400 uppercase tracking-wider">Vencimiento</th>
              <th className="text-right px-4 py-3 text-[10.5px] font-semibold text-gray-400 uppercase tracking-wider">Monto</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {convenios.map(c => (
              <tr key={c.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-4 py-3 font-mono text-[11px] text-gray-500">{c.codigo}</td>
                <td className="px-4 py-3 text-gray-700 font-medium">{c.nombre}</td>
                <td className="px-4 py-3">
                  <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                    c.estado === 'vigente' ? 'bg-emerald-50 text-emerald-700' :
                    c.estado === 'vencido' ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-500'
                  }`}>{c.estado.charAt(0).toUpperCase() + c.estado.slice(1)}</span>
                </td>
                <td className="px-4 py-3 text-gray-500 text-[12px]">{formatFecha(c.inicio)}</td>
                <td className="px-4 py-3 text-gray-500 text-[12px]">{formatFecha(c.vencimiento)}</td>
                <td className="px-4 py-3 text-right font-semibold text-gray-700 tabular-nums">{formatImporte(c.monto, c.moneda)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
