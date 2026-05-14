-- =============================================================================
-- 0009_inbox.sql — Bandeja de mails (Módulo 1)
-- =============================================================================
-- Sincronización automática vía IMAP de una casilla compartida.
-- Cada mail entrante con N adjuntos PDF se ingesta como una fila en
-- `inbox_emails` + N filas en `inbox_attachments`. Desde la UI se puede
-- derivar entre áreas, marcar leído, descartar, vincular a solicitud
-- existente, o convertir a una solicitud nueva.
-- =============================================================================

-- =============================================================================
-- TIPOS ENUM
-- =============================================================================
create type inbox_email_status as enum (
  'unprocessed',
  'read',
  'processed',
  'discarded'
);

create type inbox_email_source as enum (
  'imap',
  'manual',
  'forwarded'
);

-- =============================================================================
-- TABLA: inbox_emails
-- =============================================================================
create table inbox_emails (
  id uuid primary key default gen_random_uuid(),
  -- Identidad IMAP — dedupe por Message-Id
  imap_message_id text unique,
  imap_uid integer,
  imap_mailbox text not null default 'INBOX',
  -- Remitente / destinatarios
  from_name text,
  from_email text not null,
  to_emails text[],
  cc_emails text[],
  -- Contenido
  subject text not null,
  body_text text,
  body_html text,
  -- Estado y ruteo interno
  received_at timestamptz not null,
  current_area_id uuid references internal_areas(id) on delete set null,
  status inbox_email_status not null default 'unprocessed',
  discarded_reason text,
  -- Origen
  source inbox_email_source not null default 'imap',
  uploaded_by uuid references profiles(id) on delete set null,
  -- Timestamps
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_inbox_emails_status on inbox_emails(status);
create index idx_inbox_emails_current_area on inbox_emails(current_area_id);
create index idx_inbox_emails_received_at on inbox_emails(received_at desc);
create index idx_inbox_emails_from_email on inbox_emails(from_email);

create trigger inbox_emails_set_updated_at
  before update on inbox_emails
  for each row execute function tg_set_updated_at();

-- =============================================================================
-- TABLA: inbox_attachments
-- =============================================================================
create table inbox_attachments (
  id uuid primary key default gen_random_uuid(),
  email_id uuid not null references inbox_emails(id) on delete cascade,
  filename text not null,
  mime_type text,
  size_bytes bigint,
  storage_path text not null,
  page_count integer,
  created_at timestamptz not null default now()
);
create index idx_inbox_attachments_email on inbox_attachments(email_id);

-- =============================================================================
-- TABLA: solicitud_inbox_attachments
-- Pivote N:M — un adjunto del inbox puede vivir en varias solicitudes
-- =============================================================================
create table solicitud_inbox_attachments (
  id bigserial primary key,
  solicitud_id uuid not null references solicitudes(id) on delete cascade,
  inbox_attachment_id uuid not null references inbox_attachments(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (solicitud_id, inbox_attachment_id)
);
create index idx_sia_solicitud on solicitud_inbox_attachments(solicitud_id);
create index idx_sia_inbox_attachment on solicitud_inbox_attachments(inbox_attachment_id);

-- =============================================================================
-- ALTER: solicitudes → vínculo opcional al mail de origen
-- =============================================================================
alter table solicitudes
  add column inbox_email_id uuid references inbox_emails(id) on delete set null;
create index idx_solicitudes_inbox_email on solicitudes(inbox_email_id)
  where inbox_email_id is not null;

-- =============================================================================
-- ALTER: audit_log → soportar eventos de inbox_emails
-- (la tabla ya usa solicitud_id; sumamos inbox_email_id en el mismo estilo)
-- =============================================================================
alter table audit_log
  add column inbox_email_id uuid references inbox_emails(id) on delete set null;
create index idx_audit_inbox_email on audit_log(inbox_email_id, created_at desc)
  where inbox_email_id is not null;

-- =============================================================================
-- STORAGE: bucket privado para los adjuntos del inbox
-- =============================================================================
insert into storage.buckets (id, name, public)
values ('inbox', 'inbox', false)
on conflict (id) do nothing;

-- =============================================================================
-- HELPER: ¿el user puede ver la bandeja de mails?
-- Mesa de Entrada + Dirección Ejecutiva + super_admins
-- =============================================================================
create or replace function puede_ver_bandeja_mails(p_user_id uuid)
returns boolean
language sql
stable
security definer
as $$
  select exists (
    select 1 from profiles
    where id = p_user_id and is_super_admin = true
  ) or exists (
    select 1
    from internal_area_members iam
    join internal_areas ia on ia.id = iam.area_id
    where iam.user_id = p_user_id
      and ia.name in ('Mesa de Entrada', 'Dirección Ejecutiva')
  );
$$;

-- =============================================================================
-- RLS
-- =============================================================================
alter table inbox_emails enable row level security;
alter table inbox_attachments enable row level security;
alter table solicitud_inbox_attachments enable row level security;

-- inbox_emails — solo MdE + Dir + super_admin pueden ver/actualizar.
-- INSERT lo hace el cron con service_role (bypass RLS).
create policy inbox_emails_select on inbox_emails
  for select
  using (puede_ver_bandeja_mails(auth.uid()));
create policy inbox_emails_update on inbox_emails
  for update
  using (puede_ver_bandeja_mails(auth.uid()))
  with check (puede_ver_bandeja_mails(auth.uid()));

-- inbox_attachments — hereda visibilidad via email_id
create policy inbox_attachments_select on inbox_attachments
  for select
  using (
    exists (
      select 1 from inbox_emails e
      where e.id = inbox_attachments.email_id
        and puede_ver_bandeja_mails(auth.uid())
    )
  );

-- solicitud_inbox_attachments — visible si podés ver la solicitud
-- (reutiliza el patrón de RLS de solicitudes: si alguien ve la solicitud
-- puede ver qué adjuntos del inbox tiene vinculados).
-- Para INSERT, sólo MdE/Dir/super_admin (los que pueden convertir o vincular).
create policy sia_select on solicitud_inbox_attachments
  for select
  using (
    exists (
      select 1 from solicitudes s where s.id = solicitud_inbox_attachments.solicitud_id
    )
  );
create policy sia_insert on solicitud_inbox_attachments
  for insert
  with check (puede_ver_bandeja_mails(auth.uid()));
create policy sia_delete on solicitud_inbox_attachments
  for delete
  using (puede_ver_bandeja_mails(auth.uid()));

-- Storage policy: bucket 'inbox' — solo MdE/Dir/super_admin
create policy "inbox storage select" on storage.objects
  for select
  using (
    bucket_id = 'inbox'
    and puede_ver_bandeja_mails(auth.uid())
  );

-- =============================================================================
-- COMENTARIOS
-- =============================================================================
comment on table inbox_emails is 'Bandeja de mails — sincronizada vía IMAP cada 5 min';
comment on table inbox_attachments is 'Adjuntos del inbox (PDFs en bucket Storage `inbox`)';
comment on table solicitud_inbox_attachments is 'N:M solicitudes ↔ adjuntos del inbox';
comment on function puede_ver_bandeja_mails is 'RLS gate para inbox: MdE + Dirección Ejecutiva + super_admins';
