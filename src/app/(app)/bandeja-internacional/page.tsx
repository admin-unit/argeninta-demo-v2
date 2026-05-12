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

export default async function BandejaInternacional({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string; q?: string }>
}) {
  const { estado = 'todos', q = '' } = await searchParams
  const store = await cookies()
  const role = store.get('role')?.value

  const todas = SOLICITUDES.filter(s => s.bandeja === 'internacional')
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

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <h1 className="text-2xl font-semibold text-foreground">Bandeja Internacional</h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[12px] font-medium bg-violet-50 text-violet-700 border border-violet-200 rounded-full">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Control previo requerido
            </span>
          </div>
          <p className="text-sm text-muted-foreground">Gestiones en moneda extranjera — USD, EUR y otras divisas</p>
        </div>
        {role !== 'argeninta' && (
          <Link
            href="/solicitudes/nueva?bandeja=internacional"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-violet-600 text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity shadow-sm"
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
          <p className="text-3xl font-bold text-violet-600 tabular-nums">{enGestion}</p>
          <p className="text-xs text-muted-foreground mt-1">en gestión activa</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-5">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-2">Total</p>
          <p className="text-3xl font-bold text-foreground tabular-nums">{todas.length}</p>
          <p className="text-xs text-muted-foreground mt-1">solicitudes internacionales</p>
        </div>
      </div>

      {/* Filtros + búsqueda */}
      <div className="flex items-center gap-1 mb-5">
        {FILTROS.map(f => (
          <Link
            key={f.key}
            href={`/bandeja-internacional?estado=${f.key}${q ? `&q=${q}` : ''}`}
            className={cn(
              'inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all',
              estado === f.key
                ? 'bg-violet-600 text-white shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent',
            )}
          >
            {f.label}
            {counts[f.key] > 0 && (
              <span className={cn(
                'text-[11px] font-semibold tabular-nums px-1 py-0.5 rounded',
                estado === f.key
                  ? 'text-white/70'
                  : 'text-muted-foreground/60 bg-muted',
              )}>
                {counts[f.key]}
              </span>
            )}
          </Link>
        ))}

        <div className="ml-auto">
          <form method="GET" action="/bandeja-internacional" className="relative">
            {estado !== 'todos' && <input type="hidden" name="estado" value={estado} />}
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/50 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" strokeWidth={2} /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m21 21-4.35-4.35" />
            </svg>
            <input
              name="q"
              defaultValue={q}
              placeholder="Buscar expediente…"
              className="pl-9 pr-4 py-1.5 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-300 w-56 bg-card placeholder:text-muted-foreground/50"
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
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">Control previo</th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">Estado</th>
                <th className="text-right px-5 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">Importe</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {solicitudes.map(s => (
                <tr key={s.id} className="group hover:bg-muted/25 transition-colors">
                  <td className="px-5 py-4">
                    <Link
                      href={`/solicitudes/${s.id}`}
                      className="font-mono text-[12px] font-semibold text-violet-600/80 group-hover:text-violet-700 transition-colors"
                    >
                      {s.nro}
                    </Link>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-[12.5px] text-muted-foreground">{TIPO_LABEL[s.tipo]}</span>
                  </td>
                  <td className="px-5 py-4 max-w-[240px]">
                    <Link
                      href={`/solicitudes/${s.id}`}
                      className="text-[14px] font-medium text-foreground hover:text-violet-700 transition-colors line-clamp-1 leading-snug"
                    >
                      {s.concepto}
                    </Link>
                    <p className="text-[12px] text-muted-foreground mt-0.5 leading-none">{s.solicitante}</p>
                  </td>
                  <td className="px-5 py-4">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-violet-50 text-[12px] font-medium text-violet-700 border border-violet-200/60">
                      {s.organismo}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    {s.estado === 'en_gestion' ? (
                      <span className="inline-flex items-center gap-1.5 text-[12px] text-amber-600 font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                        En revisión
                      </span>
                    ) : s.estado === 'pendiente' ? (
                      <span className="text-[12.5px] text-muted-foreground">Pendiente</span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-[12px] text-emerald-600 font-medium">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                        Aprobado
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <EstadoBadge estado={s.estado} />
                  </td>
                  <td className="px-5 py-4 text-right">
                    <span className="text-[14px] font-semibold text-foreground tabular-nums">
                      {formatImporte(s.importe, s.moneda)}
                    </span>
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
