const MOCK_DOCUMENTOS = [
  {
    id: 1,
    titulo: 'Contrato de consultoría — Dr. Martín García',
    estado: 'PENDING' as const,
    solicitante: 'INTA Castelar',
    creado: '2026-05-08',
    firmantes: [
      { nombre: 'Dr. Martín García', email: 'mgarcia@conicet.gov.ar', estado: 'PENDING' },
      { nombre: 'Luciana Ferreyra', email: 'lferreyra@argeninta.org.ar', estado: 'COMPLETED' },
    ],
  },
  {
    id: 2,
    titulo: 'Acuerdo de confidencialidad — LabSuelos S.A.',
    estado: 'COMPLETED' as const,
    solicitante: 'SENASA',
    creado: '2026-05-02',
    firmantes: [
      { nombre: 'Ing. Roberto Blanco', email: 'rblanco@labsuelos.com', estado: 'COMPLETED' },
      { nombre: 'Luciana Ferreyra', email: 'lferreyra@argeninta.org.ar', estado: 'COMPLETED' },
    ],
  },
  {
    id: 3,
    titulo: 'Autorización de gastos — Anticipo viaje San Juan',
    estado: 'DRAFT' as const,
    solicitante: 'INA',
    creado: '2026-05-09',
    firmantes: [
      { nombre: 'Ing. Pablo Vega', email: 'pvega@ina.gob.ar', estado: 'PENDING' },
    ],
  },
]

const ESTADO_CONFIG = {
  DRAFT:     { label: 'Borrador',    cls: 'bg-gray-100 text-gray-500' },
  PENDING:   { label: 'Pendiente',   cls: 'bg-amber-50 text-amber-700' },
  COMPLETED: { label: 'Completado',  cls: 'bg-green-50 text-green-700' },
  DECLINED:  { label: 'Rechazado',   cls: 'bg-red-50 text-red-600' },
}

const FIRMANTE_CONFIG = {
  PENDING:   { label: 'Pendiente', dot: 'bg-amber-400' },
  COMPLETED: { label: 'Firmado',   dot: 'bg-green-500' },
}

export default function FirmaDigital() {
  const pendientes = MOCK_DOCUMENTOS.filter(d => d.estado === 'PENDING')
  const completados = MOCK_DOCUMENTOS.filter(d => d.estado === 'COMPLETED')

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-foreground tracking-tight">Firma digital</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Documentos para firmar y gestionar. Powered by{' '}
            <a
              href="https://documenso.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline font-medium"
            >
              Documenso
            </a>
          </p>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:opacity-90 transition-opacity">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nuevo documento
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">Pendientes</p>
          <p className="text-2xl font-bold text-amber-600">{pendientes.length}</p>
          <p className="text-xs text-muted-foreground mt-0.5">esperando firma</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">Completados</p>
          <p className="text-2xl font-bold text-green-600">{completados.length}</p>
          <p className="text-xs text-muted-foreground mt-0.5">firmados</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">Total</p>
          <p className="text-2xl font-bold text-foreground">{MOCK_DOCUMENTOS.length}</p>
          <p className="text-xs text-muted-foreground mt-0.5">este mes</p>
        </div>
      </div>

      {/* Documentos pendientes */}
      {pendientes.length > 0 && (
        <section className="mb-6">
          <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            Requieren atención
          </h2>
          <div className="space-y-2.5">
            {pendientes.map(doc => (
              <DocumentCard key={doc.id} doc={doc} />
            ))}
          </div>
        </section>
      )}

      {/* Todos */}
      <section>
        <h2 className="text-sm font-semibold text-foreground mb-3">Todos los documentos</h2>
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Documento</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Solicitante</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Estado</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Fecha</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {MOCK_DOCUMENTOS.map(doc => {
                const cfg = ESTADO_CONFIG[doc.estado]
                return (
                  <tr key={doc.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <svg className="w-3.5 h-3.5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <span className="font-medium text-foreground text-[13px] leading-snug max-w-[220px] truncate">
                          {doc.titulo}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{doc.solicitante}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold ${cfg.cls}`}>
                        {cfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {new Date(doc.creado).toLocaleDateString('es-AR')}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button className="text-xs text-primary hover:underline">Ver →</button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Nota de integración */}
      <div className="mt-6 flex items-start gap-3 bg-primary/[0.04] border border-primary/15 rounded-xl p-4">
        <svg className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div>
          <p className="text-sm font-medium text-foreground">Integración con Documenso</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Configurá las variables <code className="font-mono bg-muted px-1 py-0.5 rounded text-[11px]">DOCUMENSO_URL</code> y{' '}
            <code className="font-mono bg-muted px-1 py-0.5 rounded text-[11px]">DOCUMENSO_API_KEY</code> en{' '}
            <code className="font-mono bg-muted px-1 py-0.5 rounded text-[11px]">.env.local</code> para conectar con tu instancia de Documenso.
          </p>
        </div>
      </div>
    </div>
  )
}

type DocType = typeof MOCK_DOCUMENTOS[number]

function DocumentCard({ doc }: { doc: DocType }) {
  const pendientesFirmantes = doc.firmantes.filter(f => f.estado === 'PENDING')

  return (
    <div className="bg-card border border-amber-200 rounded-xl p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0 mt-0.5">
            <svg className="w-4.5 h-4.5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-foreground text-[13.5px] leading-snug truncate">{doc.titulo}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{doc.solicitante} · {new Date(doc.creado).toLocaleDateString('es-AR')}</p>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              {doc.firmantes.map(f => {
                const cfg = FIRMANTE_CONFIG[f.estado as keyof typeof FIRMANTE_CONFIG] ?? FIRMANTE_CONFIG.PENDING
                return (
                  <span key={f.email} className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-full">
                    <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                    {f.nombre.split(' ')[0]} — {cfg.label}
                  </span>
                )
              })}
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-1.5 flex-shrink-0">
          <button className="px-3 py-1.5 text-xs bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity font-medium">
            Enviar recordatorio
          </button>
          <button className="px-3 py-1.5 text-xs border border-border text-foreground rounded-lg hover:bg-muted transition-colors">
            Ver documento
          </button>
        </div>
      </div>
      {pendientesFirmantes.length > 0 && (
        <p className="mt-3 text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2 border border-amber-100">
          Esperando firma de: {pendientesFirmantes.map(f => f.nombre).join(', ')}
        </p>
      )}
    </div>
  )
}
