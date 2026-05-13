import { Badge } from '@/components/ui/badge'
import { ESTADO_LABEL, type EstadoSolicitud } from '@/types'
import { cn } from '@/lib/utils'

const CLASSES: Record<EstadoSolicitud, string> = {
  draft:          'bg-gray-100 text-gray-600 border-gray-200',
  submitted:      'bg-amber-50 text-amber-700 border-amber-200',
  in_review:      'bg-orange-50 text-orange-700 border-orange-200',
  in_progress:    'bg-blue-50 text-blue-700 border-blue-200',
  posted_to_odoo: 'bg-violet-50 text-violet-700 border-violet-200',
  in_payment:     'bg-cyan-50 text-cyan-700 border-cyan-200',
  closed:         'bg-green-50 text-green-700 border-green-200',
  cancelled:      'bg-rose-50 text-rose-700 border-rose-200',
  error:          'bg-red-100 text-red-800 border-red-300',
}

export function EstadoBadge({ estado }: { estado: EstadoSolicitud }) {
  const className = CLASSES[estado] ?? CLASSES.draft
  const label = ESTADO_LABEL[estado] ?? estado
  return (
    <Badge variant="outline" className={cn('font-medium text-xs', className)}>
      {label}
    </Badge>
  )
}
