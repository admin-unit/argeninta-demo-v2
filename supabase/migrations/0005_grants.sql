-- =============================================================================
-- 0005_grants.sql — Grants para roles de Supabase
-- =============================================================================
-- Después de un `drop schema public cascade`, los grants estándar se pierden.
-- Este archivo los restablece y establece defaults para tablas futuras.
-- =============================================================================

-- Grants existentes
grant usage on schema public to anon, authenticated, service_role;
grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;
grant all on all functions in schema public to service_role;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant select on all tables in schema public to anon;
grant usage, select on all sequences in schema public to authenticated, anon;
grant execute on all functions in schema public to authenticated, anon;

-- Defaults para tablas futuras (creadas por otros owners, por ejemplo migraciones)
alter default privileges in schema public grant all on tables to service_role;
alter default privileges in schema public grant all on sequences to service_role;
alter default privileges in schema public grant all on functions to service_role;
alter default privileges in schema public grant select, insert, update, delete on tables to authenticated;
alter default privileges in schema public grant select on tables to anon;
alter default privileges in schema public grant usage, select on sequences to authenticated, anon;
alter default privileges in schema public grant execute on functions to authenticated, anon;
