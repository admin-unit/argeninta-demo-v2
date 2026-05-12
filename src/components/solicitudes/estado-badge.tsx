import { Badge } from '@/components/ui/badge'
import type { EstadoSolicitud } from '@/types'
import { cn } from '@/lib/utils'

const CONFIG: Record<EstadoSolicitud, { label: string; className: string }> = {
  borrador:     { label: 'Borrador',      className: 'bg-gray-100 text-gray-600 border-gray-200' },
  pendiente:    { label: 'Pendiente',     className: 'bg-amber-50 text-amber-700 border-amber-200' },
  en_gestion:   { label: 'En gestión',    className: 'bg-blue-50 text-blue-700 border-blue-200' },
  en_tesoreria: { label: 'En tesorería',  className: 'bg-violet-50 text-violet-700 border-violet-200' },
  pagado:       { label: 'Pagado',        className: 'bg-green-50 text-green-700 border-green-200' },
  archivado:    { label: 'Archivado',     className: 'bg-gray-100 text-gray-500 border-gray-200' },
  rechazado:    { label: 'Rechazado',     className: 'bg-red-50 text-red-700 border-red-200' },
}

export function EstadoBadge({ estado }: { estado: EstadoSolicitud }) {
  const { label, className } = CONFIG[estado]
  return (
    <Badge variant="outline" className={cn('font-medium text-xs', className)}>
      {label}
    </Badge>
  )
}
