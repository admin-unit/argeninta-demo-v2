import Link from 'next/link'
import { ORGANISMOS, SOLICITUDES } from '@/lib/mock-data'

export default function Organismos() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-foreground">Organismos</h1>
        <p className="text-sm text-gray-400 mt-0.5">{ORGANISMOS.length} organismos registrados</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/60">
              <th className="text-left px-4 py-3 text-[10.5px] font-semibold text-gray-400 uppercase tracking-wider">Organismo</th>
              <th className="text-left px-4 py-3 text-[10.5px] font-semibold text-gray-400 uppercase tracking-wider">Tipo</th>
              <th className="text-left px-4 py-3 text-[10.5px] font-semibold text-gray-400 uppercase tracking-wider">Referente</th>
              <th className="text-left px-4 py-3 text-[10.5px] font-semibold text-gray-400 uppercase tracking-wider">Email</th>
              <th className="text-right px-4 py-3 text-[10.5px] font-semibold text-gray-400 uppercase tracking-wider">Sol. activas</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {ORGANISMOS.map(org => {
              const activas = SOLICITUDES.filter(s => s.organismo === org.nombre && ['pendiente', 'en_gestion', 'en_tesoreria'].includes(s.estado)).length
              return (
                <tr key={org.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="text-primary text-[11px] font-bold">{org.codigo[0]}</span>
                      </div>
                      <span className="font-semibold text-gray-800">{org.nombre}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                      org.tipo === 'nacional' ? 'bg-blue-50 text-blue-700' : 'bg-violet-50 text-violet-700'
                    }`}>{org.tipo.charAt(0).toUpperCase() + org.tipo.slice(1)}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-[12.5px]">{org.referente}</td>
                  <td className="px-4 py-3 text-gray-400 text-[12px]">
                    <a href={`mailto:${org.email}`} className="hover:underline">{org.email}</a>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {activas > 0
                      ? <span className="font-semibold text-amber-600">{activas}</span>
                      : <span className="text-gray-300">—</span>
                    }
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
