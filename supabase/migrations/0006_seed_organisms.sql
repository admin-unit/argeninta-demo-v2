-- =============================================================================
-- 0006_seed_organisms.sql — Seed de los organismos cliente principales
-- =============================================================================
-- Los IDs de partner se obtuvieron de la exploración de odoo_partners (12/05).
-- Hay duplicados en Odoo (ej. SENASA con CUIT viejo y nuevo) — elegimos el ID
-- más reciente / consistente.
-- =============================================================================

insert into organisms (name, short_name, cuit, odoo_partner_id, email_domain, active, notes) values
  (
    'Instituto Nacional de Tecnología Agropecuaria',
    'INTA',
    '30-54667918-3',
    196746,
    'inta.gob.ar',
    true,
    'Cliente principal. Mayoría de proyectos 5.2.X son via INTA.'
  ),
  (
    'Servicio Nacional de Sanidad y Calidad Agroalimentaria',
    'SENASA',
    '30-68838454-7',
    195843,
    'senasa.gob.ar',
    true,
    'CUIT viejo: 30-68838454-7 (partner 140) y nuevo (partner 195843).'
  ),
  (
    'Instituto Nacional del Agua',
    'INA',
    '30-57191182-1',
    28898,
    'ina.gob.ar',
    true,
    null
  ),
  (
    'Instituto Nacional de Investigación y Desarrollo Pesquero',
    'INIDEP',
    null,
    null,
    'inidep.edu.ar',
    true,
    'No tiene partner empresa directo en Odoo, los pagos se hacen a personas/proveedores con INIDEP en el nombre.'
  ),
  (
    'MAABA',
    'MAABA',
    null,
    197079,
    null,
    true,
    'Sin CUIT cargado en Odoo, partner 197079.'
  ),
  (
    'Organización de las Naciones Unidas para la Alimentación y la Agricultura',
    'FAO',
    '33-70902466-9',
    197087,
    'fao.org',
    true,
    'Organismo internacional, financia proyectos varios.'
  ),
  (
    'CONICET',
    'CONICET',
    null,
    23497,
    'conicet.gov.ar',
    true,
    'Hay varios CCTs (Centros Científico Tecnológicos) — usamos el de Tucumán como representativo.'
  ),
  (
    'Consejo Federal de Inversiones',
    'CFI',
    '30-54665967-0',
    24216,
    'cfi.gob.ar',
    true,
    null
  ),
  (
    'Banco Interamericano de Desarrollo',
    'BID',
    '30-68305990-7',
    22330,
    'iadb.org',
    true,
    'Financiador internacional (proyectos 10.BID.*).'
  ),
  (
    'FONTAGRO',
    'FONTAGRO',
    null,
    null,
    null,
    true,
    'Fondo Regional de Tecnología Agropecuaria. No es un partner directo en Odoo — los proyectos FONTAGRO se imputan al INTA como organismo ejecutor.'
  );

-- =============================================================================
-- Notas operativas:
-- - organism_members se llena al onboardear usuarios externos (en Sprint 2).
-- - organism_convenios se auto-popula con un script de matching que cruza:
--     a) convenios con partner_id de Odoo → matchea con organism.odoo_partner_id
--     b) convenios cuyo código empieza con "10.BID.X" → BID
--     c) convenios marcados con fuente FONTAGRO → FONTAGRO (etc.)
-- =============================================================================
