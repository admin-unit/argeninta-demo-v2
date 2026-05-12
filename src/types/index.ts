export type TipoGestion =
  | 'pago_factura'
  | 'solicitud_compra'
  | 'anticipo'
  | 'rendicion'
  | 'reintegro'
  | 'contrato'

export type EstadoSolicitud =
  | 'borrador'
  | 'pendiente'
  | 'en_gestion'
  | 'en_tesoreria'
  | 'pagado'
  | 'archivado'
  | 'rechazado'

export type EstadoExpediente =
  | 'iniciado'
  | 'en_tramitacion'
  | 'completado'
  | 'anulado'

export type Bandeja = 'nacional' | 'internacional'

export interface HistorialItem {
  id: string
  fecha: string
  usuario: string
  area: string
  accion: string
  nota?: string
}

export interface Solicitud {
  id: string
  nro: string
  tipo: TipoGestion
  bandeja: Bandeja
  estado: EstadoSolicitud
  concepto: string
  importe: number
  moneda: 'ARS' | 'USD' | 'EUR'
  organismo: string
  cuenta_analitica: string
  beneficiario: string
  solicitante: string
  responsable_area?: string
  fecha_solicitud: string
  fecha_actualizacion: string
  odoo_id?: number
  expediente_id?: string
  historial: HistorialItem[]
}

export interface CuentaAnalitica {
  id: string
  codigo: string
  nombre: string
  organismo: string
  saldo_total: number
  saldo_disponible: number
  moneda: 'ARS' | 'USD'
}

export interface Organismo {
  id: string
  nombre: string
  codigo: string
  tipo: 'nacional' | 'internacional'
  referente: string
  email: string
}

/** Expediente digital — campos equivalentes al sistema ESIGA */
export interface Expediente {
  id: string
  codigo_fa: string
  fecha_solicitud: string
  estado: EstadoExpediente
  solicitante: string
  subtitulo_organico: string
  usuario_titular: string
  tipo_tramite: string
  quien_provee?: string
  importe_comprobante?: number
  moneda?: 'ARS' | 'USD' | 'EUR'
  caracter: 'Ordinario' | 'Reservado' | 'Secreto'
  usuario_ultima_modificacion: string
  fecha_ultima_modificacion: string
  motivo_modificacion?: string
  solicitud_id?: string
  odoo_id?: number
}

export const TIPO_LABEL: Record<TipoGestion, string> = {
  pago_factura:    'Pago de factura',
  solicitud_compra:'Solicitud de compra',
  anticipo:        'Anticipo',
  rendicion:       'Rendición',
  reintegro:       'Reintegro',
  contrato:        'Contrato',
}

export const ESTADO_LABEL: Record<EstadoSolicitud, string> = {
  borrador:     'Borrador',
  pendiente:    'Pendiente',
  en_gestion:   'En gestión',
  en_tesoreria: 'En tesorería',
  pagado:       'Pagado',
  archivado:    'Archivado',
  rechazado:    'Rechazado',
}

export const ESTADO_EXP_LABEL: Record<EstadoExpediente, string> = {
  iniciado:       'Iniciado',
  en_tramitacion: 'En tramitación',
  completado:     'Completado',
  anulado:        'Anulado',
}

export interface Convenio {
  id: string
  codigo: string
  nombre: string
  organismo: string
  estado: 'vigente' | 'vencido' | 'suspendido'
  inicio: string
  vencimiento: string
  monto: number
  moneda: 'ARS' | 'USD'
}

export interface Mail {
  id: string
  asunto: string
  de: string
  organismo?: string
  fecha: string
  leido: boolean
  preview?: string
}

export interface UsuarioInterno {
  id: string
  nombre: string
  area: string
  tareasActivas: number
  completadasHoy: number
}

export type Role = 'externo' | 'interno'
