@AGENTS.md


<!-- end-session 2026-05-13 -->
## Deploy en Vercel
- Repo público mirror: https://github.com/admin-unit/argeninta-demo-v2 (cuenta `admin-unit` = manuel@teamunit.dev)
- Proyecto Vercel previsto: `argeninta-demov2` → URL `https://argeninta-demov2.vercel.app`
- Env vars requeridas: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_SITE_URL`
- Post-deploy: actualizar Site URL y Redirect URL en Supabase Auth (proyecto `imxiufvfhzjkdhinlhst`) con el dominio de Vercel


<!-- end-session 2026-05-14 -->
## Bandeja de mails
- pdf.js worker requerido en `public/pdf.worker.min.mjs` (no borrar).
- Detalle: `/bandeja/mails/[id]` usando componente `MailDetalle`.
- Gating: `canAccessInbox` se calcula en el layout y baja como prop al sidebar.
