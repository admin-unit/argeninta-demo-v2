import { notFound } from 'next/navigation'
import Link from 'next/link'
import { cookies } from 'next/headers'
import { SOLICITUDES } from '@/lib/mock-data'
import { EstadoBadge } from '@/components/solicitudes/estado-badge'
import { SolicitudDetalleArgeninta } from '@/components/solicitudes/solicitud-detalle-argeninta'
import { TIPO_LABEL } from '@/types'

const TIPOS_CON_FIRMA = ['pago_factura', 'contrato', 'anticipo']

const FIRMANTES_DEMO = [
  { nombre: 'René Castro', cargo: 'Director — Fundación Argeninta', estado: 'pendiente' as const },
]

function formatImporte(importe: number, moneda: string) {
  const fmt = new Intl.NumberFormat('es-AR', { minimumFractionDigits: 0 })
  return `${moneda === 'ARS' ? '$' : moneda + ' '}${fmt.format(importe)}`
}

const EXPEDIENTE_CODIGO: Record<string, string> = {
  'exp-1': 'FA-2026-00124',
  'exp-2': 'FA-2026-00123',
  'exp-4': 'FA-2026-00108',
  'exp-6': 'FA-2026-I-018',
  'exp-8': 'FA-2026-I-015',
}

export default async function SolicitudDetalle({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const solicitud = SOLICITUDES.find(s => s.id === id)
  if (!solicitud) notFound()

  const store = await cookies()
  const role = store.get('role')?.value ?? 'tecnico'
  const bandeja = solicitud.bandeja === 'nacional' ? 'bandeja-nacional' : 'bandeja-internacional'
  const isIntl = solicitud.bandeja === 'internacional'
  const necesitaFirma = TIPOS_CON_FIRMA.includes(solicitud.tipo)

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-[13px] text-muted-foreground mb-6">
        <Link
          href={role === 'argeninta' ? `/${bandeja}` : '/mis-solicitudes'}
          className="hover:text-foreground transition-colors"
        >
          {role === 'argeninta'
            ? (solicitud.bandeja === 'nacional' ? 'Bandeja Nacional' : 'Bandeja Internacional')
            : 'Mis solicitudes'}
        </Link>
        <svg className="w-3.5 h-3.5 text-muted-foreground/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <span className="font-mono text-foreground font-semibold">{solicitud.nro}</span>
      </div>

      {/* Header */}
      <div className="mb-7">
        <div className="flex items-center gap-3 mb-2">
          <span className="font-mono text-[12px] font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
            {solicitud.nro}
          </span>
          <EstadoBadge estado={solicitud.estado} />
          {isIntl && (
            <span className="inline-flex items-center gap-1 text-[11.5px] font-medium text-violet-600 bg-violet-50 border border-violet-200 px-2 py-0.5 rounded-full">
              Internacional
            </span>
          )}
          {solicitud.odoo_id && (
            <span className="text-[11.5px] text-muted-foreground bg-muted px-2 py-0.5 rounded-md font-mono border border-border/60">
              Odoo #{solicitud.odoo_id}
            </span>
          )}
        </div>
        <h1 className="text-xl font-semibold text-foreground leading-snug max-w-2xl">
          {solicitud.concepto}
        </h1>
      </div>

      {/* ── Técnico: vista simplificada ── */}
      {role === 'tecnico' && (
        <div className="grid grid-cols-3 gap-5">
          <div className="col-span-2 space-y-4">
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              <div className="px-5 py-3.5 border-b border-border/60 bg-muted/20">
                <h2 className="text-[13px] font-semibold text-foreground">Datos de la solicitud</h2>
              </div>
              <div className="p-5 grid grid-cols-2 gap-x-8 gap-y-5">
                <div>
                  <p className="text-[11.5px] text-muted-foreground mb-1 uppercase tracking-wide font-medium">Tipo de gestión</p>
                  <p className="text-[14px] font-medium text-foreground">{TIPO_LABEL[solicitud.tipo]}</p>
                </div>
                <div>
                  <p className="text-[11.5px] text-muted-foreground mb-1 uppercase tracking-wide font-medium">Organismo</p>
                  <p className="text-[14px] font-medium text-foreground">{solicitud.organismo}</p>
                </div>
                <div>
                  <p className="text-[11.5px] text-muted-foreground mb-1 uppercase tracking-wide font-medium">Beneficiario</p>
                  <p className="text-[14px] font-medium text-foreground">{solicitud.beneficiario}</p>
                </div>
                <div>
                  <p className="text-[11.5px] text-muted-foreground mb-1 uppercase tracking-wide font-medium">Cuenta analítica</p>
                  <p className="font-mono text-[12px] text-foreground bg-muted px-2 py-1 rounded-md inline-block border border-border/60">
                    {solicitud.cuenta_analitica}
                  </p>
                </div>
                <div>
                  <p className="text-[11.5px] text-muted-foreground mb-1 uppercase tracking-wide font-medium">Importe</p>
                  <p className="text-[22px] font-bold text-foreground tabular-nums leading-none">
                    {formatImporte(solicitud.importe, solicitud.moneda)}
                  </p>
                </div>
                <div>
                  <p className="text-[11.5px] text-muted-foreground mb-1 uppercase tracking-wide font-medium">Solicitante</p>
                  <p className="text-[14px] font-medium text-foreground">{solicitud.solicitante}</p>
                </div>
              </div>
            </div>

            {/* Estado actual para técnico */}
            <div className="bg-card rounded-xl border border-border p-5">
              <p className="text-[11.5px] text-muted-foreground mb-2 uppercase tracking-wide font-medium">Estado actual</p>
              <EstadoBadge estado={solicitud.estado} />
              <p className="text-[12.5px] text-muted-foreground mt-3">
                Tu solicitud fue recibida por el equipo de Argeninta y está siendo procesada.
                Te notificaremos cuando haya novedades.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {solicitud.expediente_id && (
              <Link
                href="/expedientes"
                className="block bg-card rounded-xl border border-border p-4 hover:border-primary/30 transition-colors group"
              >
                <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
                  </svg>
                  Expediente digital
                </h3>
                <p className="text-[14px] font-mono font-bold text-primary group-hover:underline">
                  {EXPEDIENTE_CODIGO[solicitud.expediente_id] ?? solicitud.expediente_id}
                </p>
                <p className="text-[11.5px] text-muted-foreground mt-0.5">Ver expediente →</p>
              </Link>
            )}

            <div className="bg-card rounded-xl border border-border p-4">
              <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-3">Fechas</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-[11.5px] text-muted-foreground mb-0.5">Solicitud</p>
                  <p className="text-[13px] font-medium text-foreground">
                    {new Date(solicitud.fecha_solicitud).toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })}
                  </p>
                </div>
                <div>
                  <p className="text-[11.5px] text-muted-foreground mb-0.5">Última actualización</p>
                  <p className="text-[13px] font-medium text-foreground">
                    {new Date(solicitud.fecha_actualizacion).toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Argeninta: vista completa con firma + trazabilidad interactiva ── */}
      {role === 'argeninta' && (
        <SolicitudDetalleArgeninta
          solicitud={solicitud}
          firmantesIniciales={necesitaFirma ? FIRMANTES_DEMO : []}
          necesitaFirma={necesitaFirma}
        />
      )}
    </div>
  )
}
