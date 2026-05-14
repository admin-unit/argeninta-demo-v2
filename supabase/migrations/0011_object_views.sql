-- =============================================================================
-- 0011_object_views.sql — Saved Views Attio-style (genéricas por Object)
-- =============================================================================
-- Snapshot del state visual de una vista de listado: tipo (table/kanban),
-- filtros, sort multi-key, visibilidad/orden de columnas, density, groupBy.
--
-- Aplica a todos los listados Attio-style (organismos, convenios, facturas,
-- expedientes, mis-solicitudes, mi-organismo/*). NO aplica a la bandeja —
-- esa sigue usando `user_saved_views` legacy con su propio shape.
--
-- En v1 NO se lee desde la UI — el state activo vive en URL search params.
-- Esta tabla se llena cuando implementemos "Save as view" en v2+.
--
-- Scope:
--   user_id no nulo → vista personal del usuario
--   user_id nulo    → vista compartida (workspace-wide)
--
-- config jsonb tiene la forma de `ViewConfig` (src/lib/views/types.ts):
--   {
--     type: "table" | "kanban",
--     filters: <FilterNode tree con AND/OR>,
--     sort: [{ attribute, direction }, ...],
--     columns: [{ id, visible, order, width? }, ...],
--     density: "compact" | "comfortable",
--     groupBy?: <attribute_id>
--   }
-- =============================================================================

create table object_views (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  object_slug text not null,
  name text not null,
  config jsonb not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_object_views_user on object_views(object_slug, user_id);
create index idx_object_views_shared on object_views(object_slug) where user_id is null;

-- Un usuario solo puede tener UN default por object_slug.
-- Las shared (user_id is null) también: un default workspace-wide por object.
create unique index idx_object_views_one_default_per_user
  on object_views(object_slug, coalesce(user_id::text, '__shared__'))
  where is_default = true;

create trigger object_views_set_updated_at
  before update on object_views
  for each row execute function tg_set_updated_at();

-- =============================================================================
-- RLS
-- =============================================================================
alter table object_views enable row level security;

-- SELECT: mis vistas personales + las compartidas del workspace
create policy "ver mis vistas + compartidas" on object_views
  for select to authenticated using (
    user_id = auth.uid() or user_id is null
  );

-- INSERT: solo puedo crear vistas personales.
-- Las compartidas (user_id is null) se crean server-side con service role.
create policy "crear mis vistas" on object_views
  for insert to authenticated
  with check (user_id = auth.uid());

-- UPDATE: solo dueño de la vista personal.
-- Las compartidas se gestionan server-side.
create policy "editar mis vistas" on object_views
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- DELETE: solo dueño.
create policy "borrar mis vistas" on object_views
  for delete to authenticated
  using (user_id = auth.uid());
