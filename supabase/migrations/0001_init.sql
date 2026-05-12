-- =============================================================================
-- 0001_init.sql — Schema inicial Argeninta Demo v2
-- =============================================================================
-- Documentación: ver "Estructura — Auth, jerarquía, schema y trazabilidad"
-- en Outline → colección Argeninta
-- =============================================================================

-- =============================================================================
-- EXTENSIONES
-- =============================================================================

-- =============================================================================
-- TIPOS ENUM
-- =============================================================================
create type user_type as enum ('interno', 'externo');
create type area_role as enum ('miembro', 'jefe', 'admin');
create type organism_role as enum ('solicitante', 'referente', 'admin_org');
create type tipo_gestion_slug as enum (
  'pago_factura',
  'compra',
  'anticipo_rendicion',
  'reintegro',
  'contrato',
  'otro'
);
create type solicitud_status as enum (
  'draft',
  'submitted',
  'in_review',
  'in_progress',
  'posted_to_odoo',
  'in_payment',
  'closed',
  'cancelled',
  'error'
);
create type solicitud_urgency as enum ('normal', 'urgente');

-- =============================================================================
-- TABLA: profiles
-- Extiende auth.users con datos del perfil
-- =============================================================================
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text,
  avatar_url text,
  user_type user_type not null default 'externo',
  -- Si es interno y tiene cuenta en Odoo:
  odoo_user_id integer,
  odoo_employee_id integer,
  phone text,
  position text,
  active boolean not null default true,
  is_super_admin boolean not null default false,
  last_seen_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_profiles_email on profiles(email);
create index idx_profiles_odoo_user_id on profiles(odoo_user_id) where odoo_user_id is not null;
create index idx_profiles_user_type on profiles(user_type);

-- Trigger para updated_at
create or replace function tg_set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
create trigger profiles_set_updated_at
  before update on profiles
  for each row execute function tg_set_updated_at();

-- =============================================================================
-- TABLA: internal_areas
-- Organigrama jerárquico de Argeninta (lo armamos nosotros, no se hereda de Odoo)
-- =============================================================================
create table internal_areas (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  parent_id uuid references internal_areas(id) on delete restrict,
  sort_order integer not null default 0,
  odoo_department_id integer,  -- opcional, linkeo futuro con hr.department
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_internal_areas_parent on internal_areas(parent_id);
create trigger internal_areas_set_updated_at
  before update on internal_areas
  for each row execute function tg_set_updated_at();

-- =============================================================================
-- TABLA: internal_area_members
-- Quién está en cada área y con qué rol
-- =============================================================================
create table internal_area_members (
  area_id uuid not null references internal_areas(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  role area_role not null default 'miembro',
  is_primary boolean not null default false,
  added_by uuid references profiles(id) on delete set null,
  added_at timestamptz not null default now(),
  primary key (area_id, user_id)
);
create index idx_iam_user on internal_area_members(user_id);
create index idx_iam_area on internal_area_members(area_id);

-- Garantizar UN solo "is_primary=true" por usuario
create unique index idx_iam_one_primary_per_user
  on internal_area_members(user_id)
  where is_primary = true;

-- =============================================================================
-- TABLA: organisms
-- Organismos externos (INTA, SENASA, INA, INIDEP, FAO, etc.)
-- =============================================================================
create table organisms (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  short_name text,
  cuit text,
  odoo_partner_id integer,  -- res.partner de Odoo
  email_domain text,  -- para auto-detect del mail (ej. "senasa.gob.ar")
  contact_email text,
  active boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_organisms_short_name on organisms(short_name);
create index idx_organisms_odoo_partner on organisms(odoo_partner_id) where odoo_partner_id is not null;
create index idx_organisms_email_domain on organisms(email_domain) where email_domain is not null;
create trigger organisms_set_updated_at
  before update on organisms
  for each row execute function tg_set_updated_at();

-- =============================================================================
-- TABLA: organism_members
-- =============================================================================
create table organism_members (
  organism_id uuid not null references organisms(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  role organism_role not null default 'solicitante',
  added_by uuid references profiles(id) on delete set null,
  added_at timestamptz not null default now(),
  primary key (organism_id, user_id)
);
create index idx_om_user on organism_members(user_id);

-- =============================================================================
-- TABLA: organism_convenios
-- Qué cuentas analíticas (convenios) puede ver cada organismo
-- =============================================================================
create table organism_convenios (
  organism_id uuid not null references organisms(id) on delete cascade,
  odoo_analytic_account_id integer not null,
  code text,  -- cacheado de Odoo
  name text,  -- cacheado de Odoo
  display_alias text,  -- nombre amigable opcional
  visible boolean not null default true,
  fuente_financiamiento text,  -- FONTAGRO / EU-H2020 / PROCISUR / AECID / OTROS
  added_at timestamptz not null default now(),
  primary key (organism_id, odoo_analytic_account_id)
);
create index idx_oc_organism on organism_convenios(organism_id) where visible = true;

-- =============================================================================
-- TABLA: tipos_gestion
-- Los 5-6 tipos estandarizados (Pago factura, Compra, Anticipo+Rendición, etc.)
-- =============================================================================
create table tipos_gestion (
  id uuid primary key default gen_random_uuid(),
  slug tipo_gestion_slug not null unique,
  name text not null,
  description text,
  icon text,
  fields_schema jsonb not null default '{}'::jsonb,
  admin_fields_schema jsonb not null default '{}'::jsonb,
  odoo_mapping jsonb not null default '{}'::jsonb,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger tipos_gestion_set_updated_at
  before update on tipos_gestion
  for each row execute function tg_set_updated_at();

-- =============================================================================
-- SECUENCIA: número de expediente por organismo y año
-- =============================================================================
create table expediente_sequence (
  organism_short_name text not null,
  year integer not null,
  last_number integer not null default 0,
  primary key (organism_short_name, year)
);

create or replace function next_expediente_number(p_organism_short_name text, p_year integer)
returns integer language plpgsql as $$
declare
  v_num integer;
begin
  insert into expediente_sequence (organism_short_name, year, last_number)
  values (p_organism_short_name, p_year, 1)
  on conflict (organism_short_name, year)
  do update set last_number = expediente_sequence.last_number + 1
  returning last_number into v_num;
  return v_num;
end;
$$;

-- =============================================================================
-- TABLA: solicitudes
-- El "expediente" en nuestra app (antes de ir a Odoo, y después como espejo)
-- =============================================================================
create table solicitudes (
  id uuid primary key default gen_random_uuid(),
  numero_expediente text unique,  -- EXP-2026-INTA-0001 (se asigna al submit)
  tipo_gestion_id uuid not null references tipos_gestion(id),
  status solicitud_status not null default 'draft',
  urgency solicitud_urgency not null default 'normal',
  -- Quién crea
  created_by_user_id uuid not null references profiles(id),
  organism_id uuid references organisms(id),
  -- Área actual
  current_area_id uuid references internal_areas(id),
  assigned_user_id uuid references profiles(id),
  -- Contenido del formulario (campos varían según tipo_gestion)
  data jsonb not null default '{}'::jsonb,
  -- Datos extraídos del jsonb para indexar/filtrar
  concepto text,
  importe numeric(20,2),
  moneda text default 'ARS',
  -- Refs a Odoo
  odoo_analytic_account_id integer,
  odoo_partner_id integer,
  odoo_move_id integer,  -- account.move cuando se postea
  odoo_payment_id integer,  -- account.payment cuando se concilia
  -- Timestamps
  submitted_at timestamptz,
  posted_at timestamptz,
  closed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_solicitudes_created_by on solicitudes(created_by_user_id);
create index idx_solicitudes_organism on solicitudes(organism_id);
create index idx_solicitudes_status on solicitudes(status);
create index idx_solicitudes_current_area on solicitudes(current_area_id);
create index idx_solicitudes_assigned on solicitudes(assigned_user_id) where assigned_user_id is not null;
create index idx_solicitudes_odoo_move on solicitudes(odoo_move_id) where odoo_move_id is not null;
create index idx_solicitudes_numero on solicitudes(numero_expediente);
create trigger solicitudes_set_updated_at
  before update on solicitudes
  for each row execute function tg_set_updated_at();

-- =============================================================================
-- TABLA: solicitud_attachments
-- =============================================================================
create table solicitud_attachments (
  id uuid primary key default gen_random_uuid(),
  solicitud_id uuid not null references solicitudes(id) on delete cascade,
  storage_path text not null,
  filename_original text not null,
  filename_normalized text,  -- CUIT_monto_fecha_tipo
  mime_type text,
  size_bytes bigint,
  odoo_attachment_id integer,  -- ir.attachment id en Odoo cuando se sube
  uploaded_by uuid references profiles(id),
  uploaded_at timestamptz not null default now()
);
create index idx_attachments_solicitud on solicitud_attachments(solicitud_id);

-- =============================================================================
-- TABLA: user_saved_views
-- Vistas guardadas de la bandeja por usuario (filtros + orden)
-- =============================================================================
create table user_saved_views (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  name text not null,
  filters_json jsonb not null default '{}'::jsonb,
  sort_json jsonb not null default '{}'::jsonb,
  is_shared boolean not null default false,
  area_id uuid references internal_areas(id),  -- si shared, en qué área
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_saved_views_user on user_saved_views(user_id);
create trigger saved_views_set_updated_at
  before update on user_saved_views
  for each row execute function tg_set_updated_at();

-- =============================================================================
-- TABLA: audit_log (INMUTABLE — solo INSERT)
-- =============================================================================
create table audit_log (
  id bigserial primary key,
  user_id uuid references profiles(id) on delete set null,
  solicitud_id uuid references solicitudes(id) on delete set null,
  area_id uuid references internal_areas(id) on delete set null,
  event_type text not null,
  description text,
  metadata jsonb not null default '{}'::jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz not null default now()
);
create index idx_audit_user on audit_log(user_id, created_at desc);
create index idx_audit_solicitud on audit_log(solicitud_id, created_at desc);
create index idx_audit_event_type on audit_log(event_type, created_at desc);
create index idx_audit_created_at on audit_log(created_at desc);

-- Trigger: prohibe UPDATE y DELETE en audit_log (es inmutable)
create or replace function audit_log_immutable()
returns trigger language plpgsql as $$
begin
  raise exception 'audit_log es inmutable: no se permite % en esta tabla', tg_op;
end;
$$;
create trigger audit_log_no_update before update on audit_log
  for each row execute function audit_log_immutable();
create trigger audit_log_no_delete before delete on audit_log
  for each row execute function audit_log_immutable();

-- =============================================================================
-- TABLA: reporting_cache
-- Cache de saldos por convenio, refrescado periódicamente desde Odoo
-- =============================================================================
create table reporting_cache (
  cache_key text primary key,
  data jsonb not null,
  cached_at timestamptz not null default now(),
  expires_at timestamptz not null
);
create index idx_cache_expires on reporting_cache(expires_at);

-- =============================================================================
-- TABLA: app_settings
-- Configuración global de la app (key-value jsonb)
-- =============================================================================
create table app_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  description text,
  updated_at timestamptz not null default now(),
  updated_by uuid references profiles(id) on delete set null
);

-- =============================================================================
-- TABLAS CACHE de datos de Odoo (refrescadas por script de sync)
-- =============================================================================

-- res.partner (proveedores, organismos, personas)
create table odoo_partners (
  odoo_id integer primary key,
  name text not null,
  vat text,  -- CUIT
  email text,
  phone text,
  is_company boolean not null default false,
  parent_id integer,  -- self-ref por id de Odoo (no FK lógico)
  country_code text,
  supplier_rank integer default 0,
  customer_rank integer default 0,
  active boolean not null default true,
  raw_data jsonb,
  synced_at timestamptz not null default now()
);
create index idx_odoo_partners_vat on odoo_partners(vat) where vat is not null;
create index idx_odoo_partners_name on odoo_partners using gin(to_tsvector('spanish', name));
create index idx_odoo_partners_company on odoo_partners(is_company) where is_company = true;

-- account.analytic.account (convenios / proyectos)
create table odoo_analytic_accounts (
  odoo_id integer primary key,
  code text,
  name text not null,
  plan_id integer,
  plan_name text,  -- "Convenios", "Project", "Inversiones"
  balance numeric(20,2) default 0,
  partner_odoo_id integer,
  active boolean not null default true,
  raw_data jsonb,
  synced_at timestamptz not null default now()
);
create index idx_odoo_aa_code on odoo_analytic_accounts(code);
create index idx_odoo_aa_plan on odoo_analytic_accounts(plan_id);
create index idx_odoo_aa_name on odoo_analytic_accounts using gin(to_tsvector('spanish', name));

-- product.product (productos / categorías de gasto)
create table odoo_products (
  odoo_id integer primary key,
  name text not null,
  default_code text,
  product_type text,  -- 'service', 'consu', 'product'
  categ_id integer,
  categ_name text,
  list_price numeric(20,2),
  purchase_ok boolean default true,
  raw_data jsonb,
  synced_at timestamptz not null default now()
);
create index idx_odoo_products_categ on odoo_products(categ_name);

-- account.journal (diarios — cuentas bancarias)
create table odoo_journals (
  odoo_id integer primary key,
  name text not null,
  code text,
  journal_type text,  -- 'bank', 'cash', 'sale', 'purchase', 'general'
  default_account_id integer,
  default_account_name text,
  currency_code text,
  active boolean not null default true,
  raw_data jsonb,
  synced_at timestamptz not null default now()
);

-- account.account (cuentas contables)
create table odoo_accounts (
  odoo_id integer primary key,
  code text not null,
  name text not null,
  account_type text,
  raw_data jsonb,
  synced_at timestamptz not null default now()
);
create index idx_odoo_accounts_code on odoo_accounts(code);
create index idx_odoo_accounts_type on odoo_accounts(account_type);

-- l10n_latam.document.type (tipos de documento argentinos: FA-A, FA-B, etc.)
create table odoo_doc_types (
  odoo_id integer primary key,
  code text,
  name text not null,
  doc_code_prefix text,
  internal_type text,  -- 'invoice', 'debit_note', 'credit_note'
  country_code text default 'AR',
  raw_data jsonb,
  synced_at timestamptz not null default now()
);

-- Log de syncs (cuándo se corrió el último sync de qué)
create table odoo_sync_log (
  id bigserial primary key,
  entity text not null,  -- 'partners', 'analytic_accounts', etc.
  records_synced integer,
  duration_ms integer,
  status text,  -- 'success', 'partial', 'error'
  error_message text,
  started_at timestamptz not null,
  finished_at timestamptz
);
create index idx_sync_log_entity on odoo_sync_log(entity, started_at desc);

-- =============================================================================
-- VISTAS de conveniencia
-- =============================================================================

-- Vista: solicitudes con info enriquecida (organism, tipo_gestion, area, etc.)
create or replace view v_solicitudes_full as
select
  s.*,
  tg.slug as tipo_slug,
  tg.name as tipo_name,
  o.short_name as organism_short_name,
  o.name as organism_name,
  ia.name as current_area_name,
  p_created.full_name as created_by_name,
  p_assigned.full_name as assigned_user_name
from solicitudes s
left join tipos_gestion tg on tg.id = s.tipo_gestion_id
left join organisms o on o.id = s.organism_id
left join internal_areas ia on ia.id = s.current_area_id
left join profiles p_created on p_created.id = s.created_by_user_id
left join profiles p_assigned on p_assigned.id = s.assigned_user_id;

-- =============================================================================
-- COMENTARIOS de tablas (para docs auto-generadas)
-- =============================================================================
comment on table profiles is 'Perfiles extendidos sobre auth.users';
comment on table internal_areas is 'Organigrama jerárquico interno de Argeninta';
comment on table internal_area_members is 'Membresía de usuarios en áreas con rol';
comment on table organisms is 'Organismos externos clientes (INTA, SENASA, etc.)';
comment on table organism_members is 'Usuarios externos pertenecen a 1+ organismos';
comment on table organism_convenios is 'Convenios visibles por organismo';
comment on table tipos_gestion is 'Definición de los 6 tipos de gestión con sus fields_schema';
comment on table solicitudes is 'Expedientes — solicitudes de gestión';
comment on table solicitud_attachments is 'Adjuntos por solicitud';
comment on table audit_log is 'Log inmutable de eventos (INSERT-only)';
comment on table reporting_cache is 'Cache de reportes leídos de Odoo';
comment on table odoo_partners is 'Cache de res.partner de Odoo';
comment on table odoo_analytic_accounts is 'Cache de account.analytic.account (convenios)';
comment on table odoo_products is 'Cache de product.product (categorías de gasto)';
comment on table odoo_journals is 'Cache de account.journal (cuentas bancarias)';
comment on table odoo_accounts is 'Cache de account.account (cuentas contables)';
comment on table odoo_doc_types is 'Cache de tipos de documento argentinos';
