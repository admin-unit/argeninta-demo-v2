# ArgenINTA Demo v2

## Descripción
Demo application for ArgenINTA built with Next.js 16 and Supabase.

## Stack Tecnológico
- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL 17.6)
- **Authentication**: Supabase Auth
- **Deployment**: Vercel

## Estructura del Proyecto
```
src/
├── app/              # App Router pages and layouts
│   ├── (auth)/      # Authentication routes
│   ├── (dashboard)/ # Dashboard routes
│   ├── layout.tsx   # Root layout
│   └── page.tsx     # Home page
├── components/
│   └── ui/          # Reusable UI components
├── lib/
│   └── supabase/    # Supabase client utilities
│       ├── client.ts    # Browser client
│       ├── server.ts    # Server client
│       └── proxy.ts     # Session management
├── types/
│   ├── database.types.ts  # Auto-generated DB types
│   └── supabase.ts        # Type helpers
└── middleware.ts          # Next.js middleware for Supabase
```

## Configuración de Supabase

### Proyecto
- **Project ID**: imxiufvfhzjkdhinlhst
- **Region**: us-west-1
- **Database Version**: PostgreSQL 17.6
- **URL**: https://imxiufvfhzjkdhinlhst.supabase.co

### Variables de Entorno
Requeridas en `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

### Actualizar Tipos de Base de Datos
```bash
npm run update-types
```

## Scripts Disponibles
- `npm run dev` - Iniciar servidor de desarrollo
- `npm run build` - Construir para producción
- `npm start` - Iniciar servidor de producción
- `npm run lint` - Ejecutar ESLint
- `npm run format` - Formatear código con Prettier
- `npm run update-types` - Actualizar tipos de Supabase

## Convenciones de Código
- Usar Server Components por defecto
- Client Components solo cuando sea necesario (interactividad)
- Usar TypeScript strict mode
- Seguir ESLint y Prettier configuraciones
- Componentes UI en `src/components/ui/`
- Utilidades de Supabase en `src/lib/supabase/`

## Deployment
El proyecto está configurado para desplegarse en Vercel con `npm run dev`.

## Notas Importantes
- El frontend está actualmente en blanco, solo con estructura base
- Sin lógica de negocio implementada aún
- La base de datos está vacía (sin tablas)
- El middleware de Supabase está configurado para gestión de sesiones
