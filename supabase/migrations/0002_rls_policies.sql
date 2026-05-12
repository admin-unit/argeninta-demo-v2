-- =============================================================================
-- 0002_rls_policies.sql — Row Level Security
-- =============================================================================
-- Regla central: "cada admin puede modificar a todos sus allegados, de arriba
-- hacia abajo". Implementado con función recursiva areas_administradas_por.
-- =============================================================================

-- =============================================================================
-- FUNCIONES HELPER (security definer = corren con privilegios del owner)
-- =============================================================================

-- ¿El usuario actual es super-admin?
create or replace function is_super_admin()
returns boolean
language sql security definer stable
set search_path = public, auth
as $$
  select coalesce((select is_super_admin from profiles where id = auth.uid()), false);
$$;

-- ¿El usuario actual es interno?
create or replace function is_internal()
returns boolean
language sql security definer stable
set search_path = public, auth
as $$
  select coalesce(
    (select user_type = 'interno' from profiles where id = auth.uid()),
    false
  );
$$;

-- Áreas en las que el usuario es miembro/jefe/admin (sin recursión)
create or replace function areas_de_usuario(p_user_id uuid)
returns table(area_id uuid)
language sql security definer stable
set search_path = public, auth
as $$
  select iam.area_id
  from internal_area_members iam
  where iam.user_id = p_user_id;
$$;

-- Áreas administradas por el usuario (recursivo descendente)
-- Devuelve todas las áreas donde el usuario es admin + todas las subáreas
create or replace function areas_administradas_por(p_user_id uuid)
returns table(area_id uuid)
language sql security definer stable
set search_path = public, auth
as $$
  with recursive admin_roots as (
    -- áreas donde el user es admin directo
    select iam.area_id as id
    from internal_area_members iam
    where iam.user_id = p_user_id and iam.role = 'admin'
    union
    -- bajamos recursivamente
    select ia.id
    from internal_areas ia
    join admin_roots ar on ia.parent_id = ar.id
  )
  select id from admin_roots;
$$;

-- ¿El usuario A puede administrar al usuario B?
-- (A es admin de alguna área donde B es miembro, en su árbol descendente)
create or replace function puede_administrar_a(p_admin uuid, p_target uuid)
returns boolean
language sql security definer stable
set search_path = public, auth
as $$
  select exists (
    select 1
    from areas_administradas_por(p_admin) aa
    join internal_area_members iam on iam.area_id = aa.area_id
    where iam.user_id = p_target
  );
$$;

-- Organismos del usuario
create or replace function organismos_de_usuario(p_user_id uuid)
returns table(organism_id uuid)
language sql security definer stable
set search_path = public, auth
as $$
  select om.organism_id from organism_members om where om.user_id = p_user_id;
$$;

-- =============================================================================
-- ACTIVAR RLS en todas las tablas (deny by default)
-- =============================================================================
alter table profiles enable row level security;
alter table internal_areas enable row level security;
alter table internal_area_members enable row level security;
alter table organisms enable row level security;
alter table organism_members enable row level security;
alter table organism_convenios enable row level security;
alter table tipos_gestion enable row level security;
alter table solicitudes enable row level security;
alter table solicitud_attachments enable row level security;
alter table user_saved_views enable row level security;
alter table audit_log enable row level security;
alter table reporting_cache enable row level security;
alter table app_settings enable row level security;
alter table odoo_partners enable row level security;
alter table odoo_analytic_accounts enable row level security;
alter table odoo_products enable row level security;
alter table odoo_journals enable row level security;
alter table odoo_accounts enable row level security;
alter table odoo_doc_types enable row level security;
alter table odoo_sync_log enable row level security;
alter table expediente_sequence enable row level security;

-- =============================================================================
-- POLICIES: profiles
-- =============================================================================
-- Todos los autenticados ven todos los perfiles (para mostrar nombres)
create policy "auth users can read profiles" on profiles
  for select to authenticated using (true);

-- Usuario puede editar SU propio perfil
create policy "user updates own profile" on profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- Super-admin puede insertar/borrar perfiles
create policy "super admin manages profiles" on profiles
  for all to authenticated
  using (is_super_admin())
  with check (is_super_admin());

-- =============================================================================
-- POLICIES: internal_areas y internal_area_members
-- =============================================================================
-- Todos los internos pueden leer el organigrama
create policy "internal users read areas" on internal_areas
  for select to authenticated using (is_internal() or is_super_admin());

create policy "internal users read area members" on internal_area_members
  for select to authenticated using (is_internal() or is_super_admin());

-- Super-admin: full access
create policy "super admin manages areas" on internal_areas
  for all to authenticated
  using (is_super_admin()) with check (is_super_admin());

create policy "super admin manages area members" on internal_area_members
  for all to authenticated
  using (is_super_admin()) with check (is_super_admin());

-- Admin de un área: puede crear/modificar subáreas
create policy "admin modifica subareas" on internal_areas
  for update to authenticated
  using (
    parent_id in (select area_id from areas_administradas_por(auth.uid()))
    or id in (select area_id from areas_administradas_por(auth.uid()))
  );

create policy "admin crea subarea" on internal_areas
  for insert to authenticated
  with check (
    parent_id in (select area_id from areas_administradas_por(auth.uid()))
  );

-- Admin de un área: puede agregar/quitar miembros de su rama
create policy "admin manages members in his branch" on internal_area_members
  for all to authenticated
  using (area_id in (select area_id from areas_administradas_por(auth.uid())))
  with check (area_id in (select area_id from areas_administradas_por(auth.uid())));

-- =============================================================================
-- POLICIES: organisms y organism_members
-- =============================================================================
-- Internos pueden ver todos los organismos
create policy "internos ven organismos" on organisms
  for select to authenticated using (is_internal() or is_super_admin());

-- Externos ven solo los organismos donde son miembros
create policy "externos ven sus organismos" on organisms
  for select to authenticated using (
    id in (select organism_id from organismos_de_usuario(auth.uid()))
  );

-- Super-admin: manages organisms
create policy "super admin manages organisms" on organisms
  for all to authenticated
  using (is_super_admin()) with check (is_super_admin());

-- Internos ven todos los organism_members
create policy "internos ven organism members" on organism_members
  for select to authenticated using (is_internal() or is_super_admin());

-- Externos ven sus propias membresías
create policy "externos ven sus organism members" on organism_members
  for select to authenticated using (user_id = auth.uid());

create policy "super admin manages organism members" on organism_members
  for all to authenticated
  using (is_super_admin()) with check (is_super_admin());

-- =============================================================================
-- POLICIES: organism_convenios
-- =============================================================================
create policy "ver convenios de mis organismos" on organism_convenios
  for select to authenticated using (
    is_internal() or
    organism_id in (select organism_id from organismos_de_usuario(auth.uid()))
  );

create policy "super admin manages convenios" on organism_convenios
  for all to authenticated
  using (is_super_admin()) with check (is_super_admin());

-- =============================================================================
-- POLICIES: tipos_gestion
-- =============================================================================
-- Todos los autenticados pueden leer (necesario para los formularios)
create policy "todos leen tipos_gestion" on tipos_gestion
  for select to authenticated using (active = true or is_super_admin());

create policy "super admin manages tipos" on tipos_gestion
  for all to authenticated
  using (is_super_admin()) with check (is_super_admin());

-- =============================================================================
-- POLICIES: solicitudes
-- Regla clave: ver una solicitud si la creé YO, o si soy miembro del área que
-- la tiene, o si soy admin de alguna área de su rama, o si es de mi organismo.
-- =============================================================================
create policy "ver mis solicitudes" on solicitudes
  for select to authenticated using (
    created_by_user_id = auth.uid()
    or assigned_user_id = auth.uid()
    or organism_id in (select organism_id from organismos_de_usuario(auth.uid()))
    or current_area_id in (select area_id from areas_de_usuario(auth.uid()))
    or current_area_id in (select area_id from areas_administradas_por(auth.uid()))
    or is_super_admin()
  );

create policy "crear solicitudes propias" on solicitudes
  for insert to authenticated
  with check (created_by_user_id = auth.uid());

create policy "editar solicitudes en mi alcance" on solicitudes
  for update to authenticated using (
    created_by_user_id = auth.uid()
    or assigned_user_id = auth.uid()
    or current_area_id in (select area_id from areas_de_usuario(auth.uid()))
    or current_area_id in (select area_id from areas_administradas_por(auth.uid()))
    or is_super_admin()
  );

create policy "super admin manages solicitudes" on solicitudes
  for all to authenticated
  using (is_super_admin()) with check (is_super_admin());

-- =============================================================================
-- POLICIES: solicitud_attachments
-- Hereda permisos de la solicitud padre
-- =============================================================================
create policy "ver attachments de solicitudes accesibles" on solicitud_attachments
  for select to authenticated using (
    solicitud_id in (select id from solicitudes)  -- usa la RLS de solicitudes
  );

create policy "insertar attachments en mis solicitudes" on solicitud_attachments
  for insert to authenticated
  with check (solicitud_id in (select id from solicitudes));

-- =============================================================================
-- POLICIES: user_saved_views
-- =============================================================================
create policy "ver mis vistas + compartidas de mi área" on user_saved_views
  for select to authenticated using (
    user_id = auth.uid()
    or (is_shared = true and area_id in (select area_id from areas_de_usuario(auth.uid())))
  );

create policy "manage mis vistas" on user_saved_views
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- =============================================================================
-- POLICIES: audit_log
-- INSERT permitido para todos los autenticados (la app loguea sus acciones)
-- SELECT: super-admin ve todo, admins ven su rama, user ve los suyos
-- UPDATE/DELETE bloqueado por triggers (sec. 0001)
-- =============================================================================
create policy "insert audit log" on audit_log
  for insert to authenticated
  with check (user_id = auth.uid() or user_id is null);

create policy "ver mi audit log" on audit_log
  for select to authenticated using (
    user_id = auth.uid()
    or is_super_admin()
    or (area_id is not null and area_id in (select area_id from areas_administradas_por(auth.uid())))
  );

-- =============================================================================
-- POLICIES: tablas cache de Odoo y settings (lectura amplia para internos)
-- =============================================================================
do $$ begin
  -- Para todas las tablas de cache Odoo: lectura por internos
  execute 'create policy "internos leen odoo_partners" on odoo_partners for select to authenticated using (is_internal() or is_super_admin())';
  execute 'create policy "internos leen analytic_accounts" on odoo_analytic_accounts for select to authenticated using (is_internal() or is_super_admin())';
  execute 'create policy "internos leen products" on odoo_products for select to authenticated using (is_internal() or is_super_admin())';
  execute 'create policy "internos leen journals" on odoo_journals for select to authenticated using (is_internal() or is_super_admin())';
  execute 'create policy "internos leen accounts" on odoo_accounts for select to authenticated using (is_internal() or is_super_admin())';
  execute 'create policy "internos leen doc_types" on odoo_doc_types for select to authenticated using (is_internal() or is_super_admin())';
  execute 'create policy "internos leen sync log" on odoo_sync_log for select to authenticated using (is_internal() or is_super_admin())';
  execute 'create policy "internos leen seq" on expediente_sequence for select to authenticated using (is_internal() or is_super_admin())';
  -- Externos: lectura restringida a sus convenios visibles (vía organism_convenios)
  execute 'create policy "externos leen sus analytic" on odoo_analytic_accounts for select to authenticated using (odoo_id in (select odoo_analytic_account_id from organism_convenios where visible = true))';
end $$;

-- Settings: lectura solo super-admin, escritura solo super-admin
create policy "super admin manages settings" on app_settings
  for all to authenticated
  using (is_super_admin()) with check (is_super_admin());

-- Reporting cache: lectura amplia
create policy "internos leen reporting cache" on reporting_cache
  for select to authenticated using (is_internal() or is_super_admin());

-- =============================================================================
-- LISTO
-- =============================================================================
