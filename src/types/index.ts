// =============================================================================
// Tipos del dominio — alineados con la DB de Supabase (enums reales)
// =============================================================================

/** Slugs de `tipos_gestion` (enum `tipo_gestion_slug` en la DB) */
export type TipoGestion =
  | 'pago_factura'
  | 'compra'
  | 'anticipo_rendicion'
  | 'reintegro'
  | 'contrato'
  | 'otro'

/** Estados de una solicitud (enum `solicitud_status` en la DB) */
export type EstadoSolicitud =
  | 'draft'
  | 'submitted'
  | 'in_review'
  | 'in_progress'
  | 'posted_to_odoo'
  | 'in_payment'
  | 'closed'
  | 'cancelled'
  | 'error'

/** Urgencia (enum `solicitud_urgency`) */
export type Urgencia = 'normal' | 'urgente'

/** Bandeja visible en el sidebar — la mapeamos por área en runtime */
export type Bandeja = 'nacional' | 'internacional'

/** Estados de expediente (legacy ESIGA — se mantiene mientras `expedientes` siga en uso) */
export type EstadoExpediente =
  | 'iniciado'
  | 'en_tramitacion'
  | 'completado'
  | 'anulado'

export interface HistorialItem {
  id: string
  fecha: string
  usuario: string
  area: string
  accion: string
  nota?: string
}

/**
 * Solicitud — wrapper del row de `v_solicitudes_full` (vista enriquecida con
 * nombres de tipo/organismo/área/usuarios). Los nombres de campos coinciden
 * con la DB para minimizar mapeo.
 */
export interface Solicitud {
  id: string
  numero_expediente: string | null
  tipo_slug: TipoGestion | null
  tipo_name: string | null
  status: EstadoSolicitud
  urgency: Urgencia
  concepto: string | null
  importe: number | null
  moneda: 'ARS' | 'USD' | 'EUR' | null
  organism_id: string | null
  organism_short_name: string | null
  organism_name: string | null
  current_area_id: string | null
  current_area_name: string | null
  assigned_user_id: string | null
  assigned_user_name: string | null
  created_by_user_id: string
  created_by_name: string | null
  data: Record<string, unknown>
  odoo_move_id: number | null
  odoo_payment_id: number | null
  submitted_at: string | null
  posted_at: string | null
  closed_at: string | null
  created_at: string
  updated_at: string
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
  pago_factura:       'Pago de factura',
  compra:             'Solicitud de compra',
  anticipo_rendicion: 'Anticipo y Rendición',
  reintegro:          'Reintegro',
  contrato:           'Contrato',
  otro:               'Otro',
}

export const ESTADO_LABEL: Record<EstadoSolicitud, string> = {
  draft:          'Borrador',
  submitted:      'Pendiente',
  in_review:      'En revisión',
  in_progress:    'En gestión',
  posted_to_odoo: 'En Odoo',
  in_payment:     'En tesorería',
  closed:         'Pagado',
  cancelled:      'Cancelado',
  error:          'Error',
}

/** Agrupación visual para chips de filtro (matchea bandeja + listados) */
export const ESTADO_GROUPS = {
  pendientes:  ['submitted', 'in_review'] as EstadoSolicitud[],
  en_proceso:  ['in_progress', 'posted_to_odoo', 'in_payment'] as EstadoSolicitud[],
  cerradas:    ['closed'] as EstadoSolicitud[],
  borradores:  ['draft'] as EstadoSolicitud[],
  problemas:   ['cancelled', 'error'] as EstadoSolicitud[],
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
