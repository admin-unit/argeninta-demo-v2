-- =============================================================================
-- 0007_seed_members_demo.sql — Asignar usuarios a áreas internas y organismos
-- =============================================================================
-- - Asignaciones de internal_area_members basadas en inferencias razonables:
--   * Clarisa, Gerardo, Manu, Luki → Dirección Ejecutiva (admin)
--   * Ernesto Fernandez → Área Internacional (admin)
--   * Rene Vicens → Administración (jefe)
--   * Ramiro Flores → Tesorería (jefe)
--   * Resto @argeninta.org.ar distribuido en áreas operativas
-- - organism_members: Manu + Luki como solicitantes de INTA para poder
--   navegar el flujo "externo" en la demo.
-- =============================================================================

-- --- Admins de raíz ---
insert into internal_area_members (area_id, user_id, role, is_primary, added_at)
select
  '11111111-1111-1111-1111-111111111111'::uuid,  -- Dirección Ejecutiva
  p.id,
  'admin'::area_role,
  true,
  now()
from profiles p
where p.email in (
  'marconi.clarisa@inta.gob.ar',
  'garcuri@argeninta.org.ar',
  'manucorcos@gmail.com',
  'lucaspignataro@proton.me'
)
on conflict (area_id, user_id) do nothing;

-- --- Gerencia de Administración (Gerardo también la administra de hecho) ---
insert into internal_area_members (area_id, user_id, role, is_primary, added_at)
select
  '22222222-2222-2222-2222-222222222222'::uuid,
  p.id,
  'admin'::area_role,
  false,
  now()
from profiles p
where p.email = 'garcuri@argeninta.org.ar'
on conflict (area_id, user_id) do nothing;

-- --- Mesa de Entrada ---
insert into internal_area_members (area_id, user_id, role, is_primary, added_at)
select
  '33333333-3333-3333-3333-333333333333'::uuid,
  p.id,
  case when p.email = 'samper.sergio@inta.gob.ar' then 'jefe'::area_role else 'miembro'::area_role end,
  true,
  now()
from profiles p
where p.email in (
  'samper.sergio@inta.gob.ar',
  'cburman@argeninta.org.ar',
  'tlazarte@argeninta.org.ar',
  'evescovi@argeninta.org.ar'
)
on conflict (area_id, user_id) do nothing;

-- --- Administración ---
insert into internal_area_members (area_id, user_id, role, is_primary, added_at)
select
  '44444444-4444-4444-4444-444444444444'::uuid,
  p.id,
  case when p.email = 'rvicens@argeninta.org.ar' then 'jefe'::area_role else 'miembro'::area_role end,
  true,
  now()
from profiles p
where p.email in (
  'rvicens@argeninta.org.ar',
  'rramoa@argeninta.org.ar',
  'lfilippetti@argeninta.org.ar',
  'anunez@argeninta.org.ar',
  'cpulido@argeninta.org.ar',
  'asaindin@argeninta.org.ar'
)
on conflict (area_id, user_id) do nothing;

-- --- Tesorería ---
insert into internal_area_members (area_id, user_id, role, is_primary, added_at)
select
  '55555555-5555-5555-5555-555555555555'::uuid,
  p.id,
  case when p.email = 'rflores@argeninta.org.ar' then 'jefe'::area_role else 'miembro'::area_role end,
  true,
  now()
from profiles p
where p.email in (
  'rflores@argeninta.org.ar',
  'sgallur@argeninta.org.ar',
  'gantognini@argeninta.org.ar',
  'mgeorges@argeninta.org.ar'
)
on conflict (area_id, user_id) do nothing;

-- --- Compras y Contrataciones ---
insert into internal_area_members (area_id, user_id, role, is_primary, added_at)
select
  '66666666-6666-6666-6666-666666666666'::uuid,
  p.id,
  case when p.email = 'mrodriguez@argeninta.org.ar' then 'jefe'::area_role else 'miembro'::area_role end,
  true,
  now()
from profiles p
where p.email in (
  'mrodriguez@argeninta.org.ar',
  'nporta@argeninta.org.ar',
  'pgomez@argeninta.org.ar',
  'mshaieb@argeninta.org.ar'
)
on conflict (area_id, user_id) do nothing;

-- --- Área Internacional ---
insert into internal_area_members (area_id, user_id, role, is_primary, added_at)
select
  '77777777-7777-7777-7777-777777777777'::uuid,
  p.id,
  case when p.email = 'efernandez@argeninta.org.ar' then 'admin'::area_role else 'miembro'::area_role end,
  true,
  now()
from profiles p
where p.email in (
  'efernandez@argeninta.org.ar',
  'sestrella@argeninta.org.ar',
  'mbasail@argeninta.org.ar',
  'egomezcastanon@argeninta.org.ar',
  'matiasrisso3@gmail.com'
)
on conflict (area_id, user_id) do nothing;

-- --- Asuntos Jurídicos ---
insert into internal_area_members (area_id, user_id, role, is_primary, added_at)
select
  '88888888-8888-8888-8888-888888888888'::uuid,
  p.id,
  'jefe'::area_role,
  true,
  now()
from profiles p
where p.email = 'lcalo@argeninta.org.ar'
on conflict (area_id, user_id) do nothing;

-- --- Capital Humano ---
insert into internal_area_members (area_id, user_id, role, is_primary, added_at)
select
  '99999999-9999-9999-9999-999999999999'::uuid,
  p.id,
  'jefe'::area_role,
  true,
  now()
from profiles p
where p.email = 'dbartolotta@argeninta.org.ar'
on conflict (area_id, user_id) do nothing;

-- =============================================================================
-- organism_members — Manu + Luki como solicitantes de INTA para demo "externo"
-- =============================================================================
insert into organism_members (organism_id, user_id, role, added_at)
select
  (select id from organisms where short_name = 'INTA'),
  p.id,
  'solicitante'::organism_role,
  now()
from profiles p
where p.email in ('manucorcos@gmail.com', 'lucaspignataro@proton.me')
on conflict (organism_id, user_id) do nothing;

insert into organism_members (organism_id, user_id, role, added_at)
select
  (select id from organisms where short_name = 'SENASA'),
  p.id,
  'referente'::organism_role,
  now()
from profiles p
where p.email = 'manucorcos@gmail.com'
on conflict (organism_id, user_id) do nothing;
