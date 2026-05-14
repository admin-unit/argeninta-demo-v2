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


<!-- end-session 2026-05-14 -->
## Correr la app en local

Una sola terminal — el OCR viejo (doctr local) ya no está; ahora se usa Claude API directo desde el server action.

```bash
cd /home/manuel/proyectos/argeninta/demo
npm run dev
# → http://192.168.0.67:3002
```

Health check: `curl -I http://localhost:3002/login` → 200.

Apagar: Ctrl+C. Cleanup forzado: `pkill -f 'next dev'`.

## Autocompletado de solicitudes con Claude API

- Implementación en `src/lib/ocr/claude-extract.ts` — manda el PDF a `/v1/messages` con visión nativa + `output_config.json_schema` para devolver los 9 campos estructurados.
- Server action: `extraerCamposConClaude` en `src/app/actions/inbox.ts`.
- Componente: `OcrAutofillButton` (botón "Autocompletar con IA" → modal editable → "Aplicar").
- Modelo default: `claude-haiku-4-5` (~$0.004/factura). Override con `ANTHROPIC_MODEL=claude-sonnet-4-6` en `.env.local`.
- Auth: el código detecta si la key arranca con `sk-ant-oat` (OAuth token de Boop/Claude Code subscription) y usa `authToken` en vez de `apiKey`. Para producción en Vercel mejor usar API key real (`sk-ant-api03-...`) — los OAuth tokens rotan.
- **UX rule:** nunca aplicar resultado de IA sin modal de revisión editable + confirmación explícita del usuario (`ReviewModal` cumple esto hoy).
