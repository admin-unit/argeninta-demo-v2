import Link from 'next/link'
import { cookies } from 'next/headers'
import { SOLICITUDES } from '@/lib/mock-data'
import { EstadoBadge } from '@/components/solicitudes/estado-badge'
import { TIPO_LABEL } from '@/types'
import { cn } from '@/lib/utils'

const FILTROS = [
  { key: 'todos',         label: 'Todos' },
  { key: 'pendiente',     label: 'Pendientes' },
  { key: 'en_gestion',   label: 'En gestión' },
  { key: 'en_tesoreria', label: 'En tesorería' },
  { key: 'pagado',       label: 'Pagados' },
]

function formatImporte(importe: number, moneda: string) {
  const fmt = new Intl.NumberFormat('es-AR', { minimumFractionDigits: 0 })
  return `${moneda === 'ARS' ? '$' : moneda + ' '}${fmt.format(importe)}`
}

function formatFecha(fecha: string) {
  return new Date(fecha).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default async function BandejaNacional({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string; q?: string }>
}) {
  const { estado = 'todos', q = '' } = await searchParams
  const store = await cookies()
  const role = store.get('role')?.value

  const todas = SOLICITUDES.filter(s => s.bandeja === 'nacional')
  const solicitudes = todas.filter(s => {
    if (estado !== 'todos' && s.estado !== estado) return false
    if (q && !s.concepto.toLowerCase().includes(q.toLowerCase()) &&
             !s.nro.toLowerCase().includes(q.toLowerCase()) &&
             !s.organismo.toLowerCase().includes(q.toLowerCase())) return false
    return true
  })

  const counts: Record<string, number> = { todos: todas.length }
  for (const f of FILTROS.slice(1)) {
    counts[f.key] = todas.filter(s => s.estado === f.key).length
  }

  const pendientes = todas.filter(s => s.estado === 'pendiente').length
  const enGestion  = todas.filter(s => s.estado === 'en_gestion').length
  const totalImporte = todas.reduce((sum, s) => sum + s.importe, 0)

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Bandeja Nacional</h1>
          <p className="text-sm text-muted-foreground mt-1">Gestiones de organismos nacionales — INTA, SENASA, INA y otros</p>
        </div>
        {role !== 'argeninta' && (
          <Link
            href="/solicitudes/nueva?bandeja=nacional"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:opacity-90 transition-opacity shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nueva solicitud
          </Link>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-card rounded-xl border border-border p-5">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-2">Pendientes</p>
          <p className="text-3xl font-bold text-amber-500 tabular-nums">{pendientes}</p>
          <p className="text-xs text-muted-foreground mt-1">esperando acción</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-5">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-2">En proceso</p>
          <p className="text-3xl font-bold text-primary tabular-nums">{enGestion}</p>
          <p className="text-xs text-muted-foreground mt-1">en gestión activa</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-5">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-2">Volumen total</p>
          <p className="text-3xl font-bold text-foreground tabular-nums">${new Intl.NumberFormat('es-AR', { notation: 'compact' }).format(totalImporte)}</p>
          <p className="text-xs text-muted-foreground mt-1">{todas.length} solicitudes</p>
        </div>
      </div>

      {/* Filtros + búsqueda */}
      <div className="flex items-center gap-1 mb-5">
        {FILTROS.map(f => (
          <Link
            key={f.key}
            href={`/bandeja-nacional?estado=${f.key}${q ? `&q=${q}` : ''}`}
            className={cn(
              'inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all',
              estado === f.key
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent',
            )}
          >
            {f.label}
            {counts[f.key] > 0 && (
              <span className={cn(
                'text-[11px] font-semibold tabular-nums px-1 py-0.5 rounded',
                estado === f.key
                  ? 'text-primary-foreground/70'
                  : 'text-muted-foreground/60 bg-muted',
              )}>
                {counts[f.key]}
              </span>
            )}
          </Link>
        ))}

        <div className="ml-auto">
          <form method="GET" action="/bandeja-nacional" className="relative">
            {estado !== 'todos' && <input type="hidden" name="estado" value={estado} />}
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/50 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" strokeWidth={2} /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m21 21-4.35-4.35" />
            </svg>
            <input
              name="q"
              defaultValue={q}
              placeholder="Buscar expediente…"
              className="pl-9 pr-4 py-1.5 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring/50 w-56 bg-card placeholder:text-muted-foreground/50"
            />
          </form>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        {solicitudes.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-muted-foreground text-sm">No hay solicitudes con los filtros aplicados.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">Expediente</th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">Tipo</th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">Concepto</th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">Organismo</th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">Estado</th>
                <th className="text-right px-5 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">Importe</th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {solicitudes.map(s => (
                <tr key={s.id} className="group hover:bg-muted/25 transition-colors">
                  <td className="px-5 py-4">
                    <Link
                      href={`/solicitudes/${s.id}`}
                      className="font-mono text-[12px] font-semibold text-muted-foreground group-hover:text-primary transition-colors"
                    >
                      {s.nro}
                    </Link>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-[12.5px] text-muted-foreground">{TIPO_LABEL[s.tipo]}</span>
                  </td>
                  <td className="px-5 py-4 max-w-[260px]">
                    <Link
                      href={`/solicitudes/${s.id}`}
                      className="text-[14px] font-medium text-foreground hover:text-primary transition-colors line-clamp-1 leading-snug"
                    >
                      {s.concepto}
                    </Link>
                    <p className="text-[12px] text-muted-foreground mt-0.5 leading-none">{s.solicitante}</p>
                  </td>
                  <td className="px-5 py-4">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-muted text-[12px] font-medium text-muted-foreground border border-border/60">
                      {s.organismo}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <EstadoBadge estado={s.estado} />
                  </td>
                  <td className="px-5 py-4 text-right">
                    <span className="text-[14px] font-semibold text-foreground tabular-nums">
                      {formatImporte(s.importe, s.moneda)}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-[12.5px] text-muted-foreground">{formatFecha(s.fecha_solicitud)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <p className="mt-3 text-[12.5px] text-muted-foreground">
        {solicitudes.length} solicitud{solicitudes.length !== 1 ? 'es' : ''}
        {estado !== 'todos' && ` · filtrando por "${FILTROS.find(f => f.key === estado)?.label}"`}
      </p>
    </div>
  )
}
