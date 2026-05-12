'use client'

import { useState } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { FirmaPad } from './firma-pad'
import { EstadoBadge } from './estado-badge'
import type { Solicitud, HistorialItem, EstadoSolicitud } from '@/types'
import { TIPO_LABEL } from '@/types'

type Firmante = {
  nombre: string
  cargo: string
  estado: 'pendiente' | 'firmado'
  firma_img?: string
}

const TRANSITIONS: Partial<Record<EstadoSolicitud, {
  label: string
  next: EstadoSolicitud
  accion: string
  color: string
}>> = {
  pendiente:    { label: 'Tomar en gestión',    next: 'en_gestion',   accion: 'Solicitud tomada en gestión', color: 'bg-primary' },
  en_gestion:   { label: 'Derivar a tesorería', next: 'en_tesoreria', accion: 'Derivada a tesorería',        color: 'bg-primary' },
  en_tesoreria: { label: 'Confirmar pago',      next: 'pagado',       accion: 'Pago confirmado y registrado', color: 'bg-emerald-600' },
}

function now() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function formatFechaHora(fecha: string) {
  const [date, time] = fecha.split(' ')
  const d = new Date(date)
  return `${d.toLocaleDateString('es-AR')} ${time ?? ''}`
}

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

export function SolicitudDetalleArgeninta({
  solicitud,
  firmantesIniciales,
  necesitaFirma,
}: {
  solicitud: Solicitud
  firmantesIniciales: Firmante[]
  necesitaFirma: boolean
}) {
  const [estado, setEstado] = useState<EstadoSolicitud>(solicitud.estado)
  const [historial, setHistorial] = useState<HistorialItem[]>(solicitud.historial)
  const [firmantes, setFirmantes] = useState<Firmante[]>(firmantesIniciales)
  const [showFirmaPad, setShowFirmaPad] = useState(false)
  const [firmaTarget, setFirmaTarget] = useState<string | null>(null)
  const [confirming, setConfirming] = useState(false)
  const [nota, setNota] = useState('')
  const [showNota, setShowNota] = useState(false)

  const transition = TRANSITIONS[estado]
  const historialDesc = [...historial].reverse()
  const todasFirmadas = firmantes.length > 0 && firmantes.every(f => f.estado === 'firmado')

  function avanzarEstado() {
    if (!transition) return
    const entry: HistorialItem = {
      id: `h-${Date.now()}`,
      accion: transition.accion,
      usuario: 'René Castro',
      area: 'Equipo Argeninta',
      fecha: now(),
    }
    setEstado(transition.next)
    setHistorial(prev => [...prev, entry])
    setConfirming(false)
  }

  function agregarNota() {
    if (!nota.trim()) return
    const entry: HistorialItem = {
      id: `h-${Date.now()}`,
      accion: 'Nota interna agregada',
      usuario: 'René Castro',
      area: 'Equipo Argeninta',
      fecha: now(),
      nota: nota.trim(),
    }
    setHistorial(prev => [...prev, entry])
    setNota('')
    setShowNota(false)
  }

  function firmarDocumento(nombre: string, dataUrl: string) {
    setFirmantes(prev =>
      prev.map(f => f.nombre === nombre ? { ...f, estado: 'firmado', firma_img: dataUrl } : f)
    )
    const entry: HistorialItem = {
      id: `h-${Date.now()}`,
      accion: `Documento firmado digitalmente por ${nombre}`,
      usuario: 'René Castro',
      area: 'Equipo Argeninta',
      fecha: now(),
    }
    setHistorial(prev => [...prev, entry])
    setShowFirmaPad(false)
    setFirmaTarget(null)
  }

  return (
    <div className="grid grid-cols-3 gap-5">
      {/* Columna principal */}
      <div className="col-span-2 space-y-4">
        {/* Datos */}
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
            {solicitud.responsable_area && (
              <div>
                <p className="text-[11.5px] text-muted-foreground mb-1 uppercase tracking-wide font-medium">Responsable área</p>
                <p className="text-[14px] font-medium text-foreground">{solicitud.responsable_area}</p>
              </div>
            )}
          </div>
        </div>

        {/* Trazabilidad */}
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="px-5 py-3.5 border-b border-border/60 bg-muted/20 flex items-center justify-between">
            <h2 className="text-[13px] font-semibold text-foreground">Trazabilidad</h2>
            <div className="flex items-center gap-3">
              <span className="text-[12px] text-muted-foreground">{historial.length} eventos</span>
              <button
                onClick={() => setShowNota(v => !v)}
                className="text-[12px] font-medium text-primary hover:text-primary/70 transition-colors"
              >
                + Agregar nota
              </button>
            </div>
          </div>

          {showNota && (
            <div className="px-5 py-3.5 border-b border-border/60 bg-muted/20">
              <textarea
                value={nota}
                onChange={e => setNota(e.target.value)}
                placeholder="Escribí una nota interna sobre esta gestión…"
                className="w-full text-[13px] border border-border rounded-lg p-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-ring/50 bg-background"
                rows={2}
              />
              <div className="flex justify-end gap-2 mt-2">
                <button onClick={() => setShowNota(false)} className="text-[12px] text-muted-foreground hover:text-foreground transition-colors">
                  Cancelar
                </button>
                <button onClick={agregarNota} className="text-[12px] font-semibold text-primary hover:text-primary/70 transition-colors">
                  Guardar nota
                </button>
              </div>
            </div>
          )}

          <div className="p-5">
            <div className="relative">
              <div className="absolute left-3 top-4 bottom-2 w-px bg-border" />
              <div className="space-y-5">
                {historialDesc.map((item, idx) => (
                  <div key={item.id} className="flex gap-4 relative">
                    <div className={cn(
                      'w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 z-10 text-[10px] font-bold ring-2 ring-background',
                      idx === 0
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted border border-border text-muted-foreground',
                    )}>
                      {idx === 0
                        ? <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3" strokeWidth={2.5} fill="currentColor" /></svg>
                        : item.usuario.split(' ').map((n: string) => n[0]).join('').slice(0, 2)
                      }
                    </div>
                    <div className="flex-1 pt-0.5 pb-1">
                      <p className="text-[13.5px] font-semibold text-foreground leading-snug">{item.accion}</p>
                      <p className="text-[12px] text-muted-foreground mt-0.5">
                        {item.usuario} · {item.area} · {formatFechaHora(item.fecha)}
                      </p>
                      {item.nota && (
                        <p className="mt-2 text-[12.5px] text-foreground/80 bg-muted rounded-lg px-3 py-2 border border-border/60">
                          {item.nota}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div className="space-y-4">

        {/* Firma digital */}
        {necesitaFirma && (
          <div className={cn(
            'rounded-xl border p-4',
            todasFirmadas ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200',
          )}>
            <h3 className={cn(
              'text-[11px] font-semibold uppercase tracking-widest mb-3 flex items-center gap-1.5',
              todasFirmadas ? 'text-emerald-700' : 'text-amber-700',
            )}>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              {todasFirmadas ? 'Autorizado y firmado' : 'Requiere autorización'}
            </h3>

            <div className="space-y-3 mb-3">
              {firmantes.map(f => (
                <div key={f.nombre}>
                  <div className="flex items-start gap-2">
                    <div className={cn(
                      'w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5',
                      f.estado === 'firmado' ? 'bg-emerald-500' : 'bg-amber-400',
                    )}>
                      {f.estado === 'firmado'
                        ? <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                        : <span className="w-2 h-2 rounded-full bg-white/80" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12.5px] font-semibold text-foreground leading-snug">{f.nombre}</p>
                      <p className="text-[11px] text-muted-foreground">{f.cargo}</p>
                      <p className={cn('text-[11px] font-medium mt-0.5', f.estado === 'firmado' ? 'text-emerald-600' : 'text-amber-600')}>
                        {f.estado === 'firmado' ? 'Firmado' : 'Pendiente de firma'}
                      </p>
                    </div>
                    {f.estado === 'pendiente' && !showFirmaPad && (
                      <button
                        onClick={() => { setFirmaTarget(f.nombre); setShowFirmaPad(true) }}
                        className="text-[11.5px] font-semibold text-white bg-amber-500 hover:bg-amber-600 transition-colors px-2.5 py-1 rounded-lg flex-shrink-0"
                      >
                        Firmar
                      </button>
                    )}
                  </div>
                  {f.firma_img && (
                    <div className="mt-2 ml-7">
                      <img src={f.firma_img} alt="Firma" className="h-10 border border-border/60 rounded-lg bg-white px-2 py-0.5" />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {showFirmaPad && firmaTarget && (
              <div className="bg-white rounded-xl border border-border p-3 mt-2">
                <p className="text-[12px] font-semibold text-foreground mb-2">Firma — {firmaTarget}</p>
                <FirmaPad
                  onSave={(dataUrl) => firmarDocumento(firmaTarget, dataUrl)}
                  onCancel={() => { setShowFirmaPad(false); setFirmaTarget(null) }}
                />
              </div>
            )}
          </div>
        )}

        {/* Avanzar estado */}
        <div className="bg-card rounded-xl border border-border p-4">
          <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-3">Estado de la gestión</h3>
          <div className="mb-3">
            <EstadoBadge estado={estado} />
          </div>
          {transition ? (
            confirming ? (
              <div>
                <p className="text-[12px] text-muted-foreground mb-2">¿Confirmar "{transition.label}"?</p>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => setConfirming(false)}
                    className="flex-1 px-2 py-1.5 text-[12px] border border-border rounded-lg hover:bg-muted transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={avanzarEstado}
                    className={cn('flex-1 px-2 py-1.5 text-[12px] font-semibold text-white rounded-lg hover:opacity-90 transition-opacity', transition.color)}
                  >
                    Confirmar
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setConfirming(true)}
                className={cn('w-full px-3 py-2 text-[12.5px] font-semibold text-white rounded-lg hover:opacity-90 transition-opacity', transition.color)}
              >
                {transition.label} →
              </button>
            )
          ) : (
            <p className="text-[12px] text-emerald-600 font-medium">Gestión completada</p>
          )}
        </div>

        {/* Expediente digital */}
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

        {/* Fechas */}
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

        {/* Acciones */}
        <div className="bg-card rounded-xl border border-border p-4">
          <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-3">Acciones</h3>
          <div className="space-y-0.5">
            {[
              { label: 'Adjuntar comprobante', path: 'M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13' },
              { label: 'Exportar expediente', path: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4' },
            ].map(a => (
              <button key={a.label} className="w-full text-left px-3 py-2 text-[13px] text-foreground hover:bg-muted rounded-lg transition-colors flex items-center gap-2.5 group">
                <svg className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d={a.path} />
                </svg>
                {a.label}
              </button>
            ))}
          </div>
        </div>

        {solicitud.odoo_id && (
          <div className="bg-primary/5 rounded-xl border border-primary/20 p-4">
            <h3 className="text-[11px] font-semibold text-primary/70 uppercase tracking-widest mb-2">Sincronizado con Odoo</h3>
            <p className="text-[14px] text-primary font-mono font-semibold">#{solicitud.odoo_id}</p>
            <p className="text-[12px] text-primary/60 mt-1 hover:text-primary cursor-pointer transition-colors">Ver en Odoo →</p>
          </div>
        )}
      </div>
    </div>
  )
}
