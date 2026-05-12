-- =============================================================================
-- 0004_seed_areas.sql — Áreas iniciales del organigrama de Argeninta
-- =============================================================================
-- Estructura inicial razonable, basada en la transcript de la reunión 09/05.
-- Se va a refinar desde Settings cuando los super-admins arranquen a usarlo.
-- =============================================================================

-- Para insertar el organigrama con IDs estables (UUID derivados de nombres),
-- usamos CTE con valores explícitos.

with new_areas as (
  insert into internal_areas (id, name, description, parent_id, sort_order) values
    ('11111111-1111-1111-1111-111111111111', 'Dirección Ejecutiva', 'Cabeza de la fundación', null, 1),
    ('22222222-2222-2222-2222-222222222222', 'Gerencia de Administración', 'Gestión administrativa nacional', '11111111-1111-1111-1111-111111111111', 2),
    ('33333333-3333-3333-3333-333333333333', 'Mesa de Entrada', 'Recibe y rutea las solicitudes', '22222222-2222-2222-2222-222222222222', 1),
    ('44444444-4444-4444-4444-444444444444', 'Administración', 'Carga facturas y gestiona pagos', '22222222-2222-2222-2222-222222222222', 2),
    ('55555555-5555-5555-5555-555555555555', 'Tesorería', 'Ejecuta los pagos', '22222222-2222-2222-2222-222222222222', 3),
    ('66666666-6666-6666-6666-666666666666', 'Compras y Contrataciones', 'Compras, licitaciones, contratos', '22222222-2222-2222-2222-222222222222', 4),
    ('77777777-7777-7777-7777-777777777777', 'Área Internacional', 'Proyectos internacionales (FAO, BID, FONTAGRO, EU, etc.)', '11111111-1111-1111-1111-111111111111', 3),
    ('88888888-8888-8888-8888-888888888888', 'Área de Asuntos Jurídicos', 'Legales', '11111111-1111-1111-1111-111111111111', 4),
    ('99999999-9999-9999-9999-999999999999', 'Área de Capital Humano', 'RRHH', '11111111-1111-1111-1111-111111111111', 5)
  returning id
)
select count(*) as areas_creadas from new_areas;

-- =============================================================================
-- Notas:
-- - Manu y Luki se cargan como super-admin manualmente (is_super_admin=true)
--   desde el sync de Odoo o un seed posterior una vez que existan en profiles.
-- - Cuando Argeninta empiece a usar la app, los admins reales (Gerardo, Clarisa)
--   asignan miembros desde Settings.
-- =============================================================================
