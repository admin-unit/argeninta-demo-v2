import Link from 'next/link'
import { SOLICITUDES } from '@/lib/mock-data'
import { EstadoBadge } from '@/components/solicitudes/estado-badge'
import { TIPO_LABEL } from '@/types'

// En demo: el técnico es siempre de INTA Castelar
const ORGANISMO_TECNICO = 'INTA'

function formatImporte(importe: number, moneda: string) {
  const fmt = new Intl.NumberFormat('es-AR', { minimumFractionDigits: 0 })
  return `${moneda === 'ARS' ? '$' : moneda + ' '}${fmt.format(importe)}`
}

function formatFecha(fecha: string) {
  return new Date(fecha).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function MisSolicitudes() {
  const solicitudes = SOLICITUDES.filter(s => s.organismo === ORGANISMO_TECNICO)
  const pendientes = solicitudes.filter(s => ['pendiente', 'en_gestion', 'en_tesoreria'].includes(s.estado))
  const completadas = solicitudes.filter(s => s.estado === 'pagado')

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Mis solicitudes</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {solicitudes.length} solicitudes enviadas · {ORGANISMO_TECNICO}
          </p>
        </div>
        <Link
          href="/solicitudes/nueva"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:opacity-90 transition-opacity shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nueva solicitud
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-card border border-border rounded-xl p-5">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-2">En proceso</p>
          <p className="text-3xl font-bold text-amber-500 tabular-nums">{pendientes.length}</p>
          <p className="text-xs text-muted-foreground mt-1">gestiones activas</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-2">Completadas</p>
          <p className="text-3xl font-bold text-emerald-600 tabular-nums">{completadas.length}</p>
          <p className="text-xs text-muted-foreground mt-1">pagadas</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-2">Total</p>
          <p className="text-3xl font-bold text-foreground tabular-nums">{solicitudes.length}</p>
          <p className="text-xs text-muted-foreground mt-1">solicitudes</p>
        </div>
      </div>

      {/* Lista */}
      <div className="space-y-2.5">
        {solicitudes.length === 0 ? (
          <div className="bg-card border border-border rounded-xl py-16 text-center">
            <p className="text-muted-foreground text-sm">Todavía no enviaste solicitudes.</p>
            <Link href="/solicitudes/nueva" className="mt-3 inline-flex text-sm text-primary font-medium hover:underline">
              Crear tu primera solicitud →
            </Link>
          </div>
        ) : (
          solicitudes.map(s => (
            <Link
              key={s.id}
              href={`/solicitudes/${s.id}`}
              className="flex items-center gap-4 bg-card border border-border rounded-xl px-5 py-4 hover:border-primary/30 hover:bg-primary/[0.015] transition-all group"
            >
              {/* Tipo icon */}
              <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-mono text-[11.5px] font-semibold text-muted-foreground">{s.nro}</span>
                  <span className="text-[11.5px] text-muted-foreground/60">·</span>
                  <span className="text-[12px] text-muted-foreground">{TIPO_LABEL[s.tipo]}</span>
                </div>
                <p className="text-[14px] font-medium text-foreground leading-snug line-clamp-1 group-hover:text-primary transition-colors">
                  {s.concepto}
                </p>
                <p className="text-[12px] text-muted-foreground mt-0.5">{formatFecha(s.fecha_solicitud)}</p>
              </div>

              <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                <EstadoBadge estado={s.estado} />
                <span className="text-[13px] font-semibold text-foreground tabular-nums">
                  {formatImporte(s.importe, s.moneda)}
                </span>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}
