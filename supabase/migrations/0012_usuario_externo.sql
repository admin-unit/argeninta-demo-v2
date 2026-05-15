-- =============================================================================
-- 0012_usuario_externo.sql — Habilitar usuario externo end-to-end
-- =============================================================================
-- Cambios:
-- 1. Jerarquía en odoo_analytic_accounts (parent_odoo_id, hierarchy_path, level)
-- 2. Saldos diferenciados: balance_devengado vs balance_financiero
-- 3. Endurecer policy de INSERT en solicitudes (organismo válido para externos)
-- 4. Policy para que admin_org/referente gestionen miembros de su organismo
-- =============================================================================

-- =============================================================================
-- 1. JERARQUÍA Y SALDOS DOBLES EN odoo_analytic_accounts
-- =============================================================================
alter table odoo_analytic_accounts
  add column if not exists parent_odoo_id integer references odoo_analytic_accounts(odoo_id) on delete set null,
  add column if not exists hierarchy_path text,
  add column if not exists hierarchy_level smallint not null default 0,
  add column if not exists balance_devengado numeric(20,2),
  add column if not exists balance_financiero numeric(20,2);

create index if not exists idx_odoo_aa_parent
  on odoo_analytic_accounts(parent_odoo_id)
  where parent_odoo_id is not null;

create index if not exists idx_odoo_aa_hierarchy_path
  on odoo_analytic_accounts(hierarchy_path)
  where hierarchy_path is not null;

-- Backfill: balance histórico = devengado (asunción razonable; el sync lo refina)
update odoo_analytic_accounts
  set balance_devengado = balance
  where balance_devengado is null;

comment on column odoo_analytic_accounts.parent_odoo_id is
  'Self-FK: padre en jerarquía (poblado por sync desde account.analytic.account.parent_id)';
comment on column odoo_analytic_accounts.hierarchy_path is
  'Path denormalizado: "INTA/DEC/4220000" — facilita agrupación y búsqueda';
comment on column odoo_analytic_accounts.hierarchy_level is
  '0 = raíz, 1 = hijo de raíz, etc. Útil para indentación en UI';
comment on column odoo_analytic_accounts.balance_devengado is
  'Saldo devengado: suma de move_lines con state=posted (cash + accruals)';
comment on column odoo_analytic_accounts.balance_financiero is
  'Saldo financiero: solo pagos efectivamente conciliados (cash basis)';

-- =============================================================================
-- 2. POLICY INSERT solicitudes — restringir organismo válido
-- =============================================================================
-- La policy original sólo chequea created_by_user_id = auth.uid().
-- Endurecemos: si organism_id viene seteado, debe ser uno donde el usuario es
-- miembro (externos) o el usuario es interno/super_admin.

drop policy if exists "crear solicitudes propias" on solicitudes;

create policy "crear solicitudes propias" on solicitudes
  for insert to authenticated
  with check (
    created_by_user_id = auth.uid()
    and (
      organism_id is null
      or is_internal()
      or is_super_admin()
      or organism_id in (select organism_id from organismos_de_usuario(auth.uid()))
    )
  );

-- =============================================================================
-- 3. POLICY organism_members — admin_org/referente gestionan su organismo
-- =============================================================================
-- Hoy solo super_admin puede gestionar organism_members. Habilitamos a los
-- referentes y admin_org del organismo. El server action usa service_role
-- igual (bypassea RLS), pero esto es defense-in-depth para queries directas.

create policy "admin_org gestiona miembros propios" on organism_members
  for all to authenticated
  using (
    organism_id in (
      select om.organism_id
      from organism_members om
      where om.user_id = auth.uid()
        and om.role in ('admin_org', 'referente')
    )
  )
  with check (
    organism_id in (
      select om.organism_id
      from organism_members om
      where om.user_id = auth.uid()
        and om.role in ('admin_org', 'referente')
    )
  );

-- =============================================================================
-- 4. POLICY organism_convenios — admin_org/referente pueden gestionar visibilidad
-- =============================================================================
-- Útil para que un admin del organismo decida qué convenios ve su organismo
-- (display_alias, visibilidad). El sync de Odoo sigue siendo super_admin.

create policy "admin_org gestiona convenios visibles" on organism_convenios
  for update to authenticated
  using (
    organism_id in (
      select om.organism_id
      from organism_members om
      where om.user_id = auth.uid()
        and om.role in ('admin_org', 'referente')
    )
  )
  with check (
    organism_id in (
      select om.organism_id
      from organism_members om
      where om.user_id = auth.uid()
        and om.role in ('admin_org', 'referente')
    )
  );

-- =============================================================================
-- LISTO
-- =============================================================================
