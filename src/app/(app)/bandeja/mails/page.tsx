import Link from 'next/link'
import { MAILS_INTERNO } from '@/lib/mock-data'
import { formatFecha } from '@/lib/utils'

export default function BandejaMails() {
  const noLeidos = MAILS_INTERNO.filter(m => !m.leido).length

  return (
    <div className="p-6">
      <div className="mb-6">
        <p className="text-[11px] text-gray-400 mb-0.5">
          <Link href="/dashboard" className="hover:underline">Bandeja de entrada</Link> / Mails
        </p>
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold text-foreground">Mails</h1>
          {noLeidos > 0 && (
            <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{noLeidos} nuevos</span>
          )}
        </div>
        <p className="text-sm text-gray-400 mt-0.5">{MAILS_INTERNO.length} mensajes</p>
      </div>

      <div className="space-y-2">
        {MAILS_INTERNO.map(m => (
          <div
            key={m.id}
            className={`bg-white border rounded-xl p-4 transition-colors ${m.leido ? 'border-gray-200' : 'border-amber-200 bg-amber-50/30'}`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {!m.leido && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />}
                  <p className={`text-[13.5px] ${m.leido ? 'text-gray-700' : 'font-semibold text-gray-900'}`}>{m.asunto}</p>
                </div>
                {m.preview && <p className="text-[12px] text-gray-400 line-clamp-2 mt-1">{m.preview}</p>}
                {m.organismo && (
                  <p className="text-[11px] text-gray-400 mt-1.5">
                    Organismo: <span className="font-medium text-gray-600">{m.organismo}</span>
                  </p>
                )}
              </div>
              <div className="shrink-0 text-right">
                <p className="text-[11.5px] text-gray-400">{formatFecha(m.fecha)}</p>
                <p className="text-[11px] text-gray-400 mt-0.5">De: {m.de}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
