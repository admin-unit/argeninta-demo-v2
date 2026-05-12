import React from 'react'
import { CUENTAS_ANALITICAS } from '@/lib/mock-data'
import type { TipoGestion } from '@/types'

const TIPOS: { key: TipoGestion; label: string; desc: string; icon: React.ReactNode }[] = [
  {
    key: 'pago_factura',
    label: 'Pago de factura',
    desc: 'Tenés una factura de un proveedor y necesitás que Argeninta la pague',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    key: 'solicitud_compra',
    label: 'Solicitud de compra',
    desc: 'Necesitás comprar bienes o contratar un servicio con fondos del proyecto',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
  {
    key: 'anticipo',
    label: 'Anticipo de fondos',
    desc: 'Necesitás fondos por adelantado para gastos que vas a rendir después',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    key: 'rendicion',
    label: 'Rendición de cuentas',
    desc: 'Tenés un anticipo previo y querés presentar los comprobantes de los gastos',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
  },
  {
    key: 'reintegro',
    label: 'Reintegro de gastos',
    desc: 'Pagaste de tu bolsillo un gasto del proyecto y querés que te lo devuelvan',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
      </svg>
    ),
  },
  {
    key: 'contrato',
    label: 'Alta de contrato',
    desc: 'Necesitás contratar a una persona (consultor, RRHH u otro servicio profesional)',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
]

const MONEDAS = ['ARS', 'USD', 'EUR']

export default async function NuevaSolicitud({
  searchParams,
}: {
  searchParams: Promise<{ tipo?: string; bandeja?: string }>
}) {
  const { tipo: tipoParam, bandeja = 'nacional' } = await searchParams
  const tipoSeleccionado = TIPOS.find(t => t.key === tipoParam)

  const cuentasFiltradas = CUENTAS_ANALITICAS.filter(c =>
    bandeja === 'internacional' ? c.moneda !== 'ARS' : c.moneda === 'ARS',
  )

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
            bandeja === 'internacional'
              ? 'bg-violet-50 text-violet-700 border border-violet-200'
              : 'bg-primary/8 text-primary border border-primary/15'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${bandeja === 'internacional' ? 'bg-violet-500' : 'bg-primary'}`} />
            Bandeja {bandeja === 'nacional' ? 'Nacional' : 'Internacional'}
          </span>
        </div>
        <h1 className="text-2xl font-semibold text-foreground tracking-tight">
          {tipoSeleccionado ? tipoSeleccionado.label : '¿Qué necesitás gestionar?'}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {tipoSeleccionado
            ? tipoSeleccionado.desc
            : 'Seleccioná el tipo de gestión que querés iniciar. Argeninta recibirá tu solicitud y la procesará.'}
        </p>
      </div>

      {!tipoSeleccionado ? (
        /* Paso 1: elegir tipo */
        <div className="grid grid-cols-1 gap-2.5">
          {TIPOS.map(t => (
            <a
              key={t.key}
              href={`/solicitudes/nueva?tipo=${t.key}&bandeja=${bandeja}`}
              className="group flex items-center gap-4 bg-card border border-border rounded-xl px-5 py-4 hover:border-primary/30 hover:bg-primary/[0.02] transition-all"
            >
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                {t.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground text-[14px] leading-snug">{t.label}</p>
                <p className="text-[12.5px] text-muted-foreground mt-0.5 leading-relaxed">{t.desc}</p>
              </div>
              <svg className="w-4 h-4 text-muted-foreground/40 flex-shrink-0 group-hover:text-primary/60 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </a>
          ))}
        </div>
      ) : (
        /* Paso 2: formulario */
        <div>
          <a href={`/solicitudes/nueva?bandeja=${bandeja}`} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Cambiar tipo de gestión
          </a>

          <form className="bg-card rounded-xl border border-border divide-y divide-border/60">
            {/* Información general */}
            <div className="p-5">
              <h3 className="text-sm font-semibold text-foreground mb-4">Información del proyecto</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                      Cuenta analítica / Convenio <span className="text-destructive">*</span>
                    </label>
                    <select className="w-full px-3 py-2 text-sm border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring bg-background">
                      <option value="">Seleccionar…</option>
                      {cuentasFiltradas.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.codigo} — {c.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                      Organismo <span className="text-destructive">*</span>
                    </label>
                    <select className="w-full px-3 py-2 text-sm border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring bg-background">
                      <option value="">Seleccionar…</option>
                      {[...new Set(cuentasFiltradas.map(c => c.organismo))].map(org => (
                        <option key={org} value={org}>{org}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                    Descripción / Concepto <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder={
                      tipoSeleccionado.key === 'pago_factura'
                        ? 'Ej: Análisis de suelos — LabSuelos S.A.'
                        : tipoSeleccionado.key === 'anticipo'
                        ? 'Ej: Anticipo viaje técnico — jornadas San Juan'
                        : tipoSeleccionado.key === 'contrato'
                        ? 'Ej: Consultoría estadística temporal — Dr. García'
                        : tipoSeleccionado.key === 'rendicion'
                        ? 'Ej: Rendición anticipo viaje San Juan — marzo 2026'
                        : tipoSeleccionado.key === 'reintegro'
                        ? 'Ej: Reintegro materiales de laboratorio comprados en campo'
                        : 'Descripción breve de la solicitud'
                    }
                    className="w-full px-3 py-2 text-sm border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring bg-background"
                  />
                </div>
              </div>
            </div>

            {/* Importe y beneficiario */}
            <div className="p-5">
              <h3 className="text-sm font-semibold text-foreground mb-4">
                {tipoSeleccionado.key === 'contrato' ? 'Contratado y condiciones' : 'Importe y beneficiario'}
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                      Importe <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="number"
                      placeholder="0,00"
                      min="0"
                      step="0.01"
                      className="w-full px-3 py-2 text-sm border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring bg-background"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">Moneda</label>
                    <select className="w-full px-3 py-2 text-sm border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring bg-background">
                      {MONEDAS.map(m => (
                        <option key={m} value={m} selected={m === (bandeja === 'internacional' ? 'USD' : 'ARS')}>{m}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                    {tipoSeleccionado.key === 'contrato'
                      ? 'Nombre del contratado'
                      : tipoSeleccionado.key === 'anticipo' || tipoSeleccionado.key === 'rendicion' || tipoSeleccionado.key === 'reintegro'
                      ? 'Tu nombre completo (quien recibe el pago)'
                      : 'Proveedor / Razón social'}
                    {' '}<span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Nombre completo o razón social"
                    className="w-full px-3 py-2 text-sm border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring bg-background"
                  />
                </div>

                {(tipoSeleccionado.key === 'pago_factura' || tipoSeleccionado.key === 'solicitud_compra') && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1.5">N° de factura / comprobante</label>
                      <input
                        type="text"
                        placeholder="Ej: 0001-00004892"
                        className="w-full px-3 py-2 text-sm border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring bg-background"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1.5">Fecha de la factura</label>
                      <input
                        type="date"
                        className="w-full px-3 py-2 text-sm border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring bg-background"
                      />
                    </div>
                  </div>
                )}

                {tipoSeleccionado.key === 'contrato' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1.5">Fecha de inicio</label>
                      <input
                        type="date"
                        className="w-full px-3 py-2 text-sm border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring bg-background"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1.5">Fecha de finalización</label>
                      <input
                        type="date"
                        className="w-full px-3 py-2 text-sm border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring bg-background"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Documentación */}
            <div className="p-5">
              <h3 className="text-sm font-semibold text-foreground mb-1">Documentación</h3>
              <p className="text-xs text-muted-foreground mb-3">
                {tipoSeleccionado.key === 'pago_factura'
                  ? 'Adjuntá la factura PDF y la nota de autorización del responsable del organismo.'
                  : tipoSeleccionado.key === 'rendicion'
                  ? 'Adjuntá todos los comprobantes de los gastos realizados (tickets, facturas, recibos).'
                  : tipoSeleccionado.key === 'reintegro'
                  ? 'Adjuntá los comprobantes de los gastos que querés que te reintegren.'
                  : 'Adjuntá la documentación de respaldo de la solicitud.'}
              </p>
              <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/30 hover:bg-primary/[0.02] transition-colors cursor-pointer group">
                <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center mx-auto mb-3 group-hover:bg-primary/10 transition-colors">
                  <svg className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <p className="text-sm text-foreground font-medium">Arrastrá archivos aquí</p>
                <p className="text-xs text-muted-foreground mt-0.5">o <span className="text-primary underline-offset-2 underline cursor-pointer">buscalos en tu computadora</span></p>
                <p className="text-xs text-muted-foreground/60 mt-2">PDF, imágenes — máx. 20 MB por archivo</p>
              </div>
            </div>

            {/* Nota */}
            <div className="p-5">
              <h3 className="text-sm font-semibold text-foreground mb-1">Información adicional</h3>
              <p className="text-xs text-muted-foreground mb-3">Cualquier dato extra que ayude a Argeninta a procesar tu solicitud más rápido.</p>
              <textarea
                rows={3}
                placeholder="Contexto, urgencias, o cualquier detalle relevante…"
                className="w-full px-3 py-2 text-sm border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring bg-background resize-none"
              />
            </div>

            {/* Acciones */}
            <div className="px-5 py-4 bg-muted/30 flex items-center justify-between rounded-b-xl">
              <a href={`/solicitudes/nueva?bandeja=${bandeja}`} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Cancelar
              </a>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="px-4 py-2 text-sm border border-border rounded-lg text-foreground hover:bg-accent transition-colors"
                >
                  Guardar borrador
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity font-medium inline-flex items-center gap-1.5"
                >
                  Enviar solicitud
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
