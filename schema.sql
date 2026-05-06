-- =============================================
-- Argeninta — Schema (v2 post-reunión)
-- Entidad principal: Expediente
-- =============================================

-- Organismos (estructuras orgánicas / clientes)
create table organismos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  codigo text unique,
  activo boolean default true,
  created_at timestamptz default now()
);

-- Áreas (subcuentas dentro de un organismo)
create table areas (
  id uuid primary key default gen_random_uuid(),
  organismo_id uuid references organismos(id) on delete cascade,
  nombre text not null,
  activa boolean default true,
  created_at timestamptz default now()
);

-- Usuarios
create table users (
  id uuid primary key references auth.users(id) on delete cascade,
  nombre text not null,
  email text unique not null,
  avatar_url text,
  rol text not null default 'cliente' check (rol in ('admin', 'operador', 'cliente')),
  area_id uuid references areas(id),
  organismo_id uuid references organismos(id),
  activo boolean default true,
  created_at timestamptz default now()
);

-- Tipos de trámite (configurable desde admin — valores exactos pendientes de ESIGA)
create table tipos_tramite (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  activo boolean default true,
  created_at timestamptz default now()
);

-- Expedientes (entidad principal)
create table expedientes (
  id uuid primary key default gen_random_uuid(),
  nro_solicitud text unique not null,   -- generado automáticamente, ej: EXP-2026-0001
  solicitante_id uuid references users(id),
  organismo_id uuid references organismos(id),
  area_id uuid references areas(id),
  tipo_tramite_id uuid references tipos_tramite(id),
  caracter text check (caracter in ('normal', 'urgente')),
  estado text not null default 'borrador' check (estado in (
    'borrador', 'pendiente', 'en_proceso', 'finalizado', 'rechazado'
  )),
  odoo_id text,                          -- ID en Odoo una vez sincronizado
  odoo_synced_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Historial de expediente (trazabilidad completa)
create table historial (
  id uuid primary key default gen_random_uuid(),
  expediente_id uuid references expedientes(id) on delete cascade,
  user_id uuid references users(id),
  area_id uuid references areas(id),
  tipo text not null check (tipo in (
    'cambio_estado', 'subida_archivo', 'eliminacion_archivo',
    'sincronizado_odoo', 'comentario', 'asignacion', 'otro'
  )),
  mensaje text not null,
  detalle jsonb,
  created_at timestamptz default now()
);

-- Archivos adjuntos
create table archivos (
  id uuid primary key default gen_random_uuid(),
  expediente_id uuid references expedientes(id) on delete cascade,
  nombre text not null,
  nombre_odoo text,                      -- formato CUIT+monto+fecha+tipo que espera Odoo
  storage_key text not null,
  tipo_mime text,
  tamaño_original int,
  tamaño_comprimido int,
  subido_por uuid references users(id),
  created_at timestamptz default now()
);

-- Notificaciones
create table notificaciones (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  expediente_id uuid references expedientes(id),
  mensaje text not null,
  leida boolean default false,
  created_at timestamptz default now()
);

-- =============================================
-- Función para generar nro_solicitud automático
-- =============================================
create or replace function generate_nro_solicitud()
returns trigger as $$
declare
  año text;
  seq int;
begin
  año := to_char(now(), 'YYYY');
  select coalesce(max(
    cast(split_part(nro_solicitud, '-', 3) as int)
  ), 0) + 1
  into seq
  from expedientes
  where nro_solicitud like 'EXP-' || año || '-%';

  new.nro_solicitud := 'EXP-' || año || '-' || lpad(seq::text, 4, '0');
  return new;
end;
$$ language plpgsql;

create trigger set_nro_solicitud
  before insert on expedientes
  for each row
  when (new.nro_solicitud is null or new.nro_solicitud = '')
  execute function generate_nro_solicitud();

-- =============================================
-- Trigger: updated_at
-- =============================================
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger expedientes_updated_at
  before update on expedientes
  for each row execute function set_updated_at();

-- =============================================
-- Indexes
-- =============================================
create index on expedientes(estado);
create index on expedientes(organismo_id);
create index on expedientes(solicitante_id);
create index on expedientes(created_at desc);
create index on historial(expediente_id);
create index on historial(created_at desc);
create index on archivos(expediente_id);
create index on notificaciones(user_id) where leida = false;

-- =============================================
-- RLS (Row Level Security)
-- Esqueleto — las políticas exactas dependen
-- de los roles que confirme Argeninta
-- =============================================
alter table expedientes enable row level security;
alter table historial enable row level security;
alter table archivos enable row level security;
alter table notificaciones enable row level security;
alter table users enable row level security;

-- Admins y operadores ven todo
create policy "staff_full_access_expedientes"
  on expedientes for all
  using (
    exists (
      select 1 from users u
      where u.id = auth.uid()
      and u.rol in ('admin', 'operador')
    )
  );

-- Clientes solo ven sus propios expedientes
create policy "clientes_own_expedientes"
  on expedientes for select
  using (solicitante_id = auth.uid());

-- Usuarios ven su propio perfil
create policy "users_own_profile"
  on users for all
  using (id = auth.uid());
