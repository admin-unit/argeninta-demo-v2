# Contexto de trabajo — Demo Argeninta

**Última actualización:** 2026-05-06 15:01:02 (auto)

---

## Estado de la fase actual

**Fase 1 — Demo (hasta 15/05/2026)**

- [x] Definición del producto y módulos
- [x] Stack tecnológico definido
- [x] Arquitectura definida
- [x] Modelo de dominio completo
- [x] Fases de desarrollo divididas
- [x] Estructura de repositorio definida
- [x] Convenciones de trabajo establecidas
- [x] Preguntas de estructura respondidas
- [x] Reunión con Argeninta — dominio y flujo real entendidos
- [ ] Recibir API de Odoo y cuenta de ESIGA (mañana 06/05)
- [ ] Crear proyecto en Supabase Pro
- [ ] Setup del repositorio (Next.js, Docker Compose)
- [ ] Auth con Supabase Auth
- [ ] CRUD proyectos + filtros
- [ ] Formulario técnico
- [ ] Upload + compresión → Supabase Storage
- [ ] Cambio de estado + historial
- [ ] Notificación por mail
- [ ] Seed de datos
- [ ] Deploy en argeninta.teamunit.dev

---

## Resumen de sesiones

### 05/05/2026 — Post-reunión Argeninta

**Qué es la app realmente:**
La app es un **intermediario, traductor y visor** entre los clientes de Argeninta y Odoo. No es una herramienta interna, es para los clientes externos.

**Flujo actual (el problema):**
Un cliente manda un mail con PDFs (factura, pedido de pago, etc.) → un empleado de Argeninta transcribe manualmente todo a Odoo, uno por uno. Esto es lento, propenso a errores y sin trazabilidad.

**Flujo nuevo (la solución):**
El cliente sube todo desde la app (formulario web) → la IA lee los PDFs y pre-carga los campos automáticamente → el empleado verifica y ajusta (drag & drop de PDFs) → los datos se reflejan en Odoo automáticamente. La app muestra a los clientes el estado y trazabilidad de sus expedientes sin que tengan que entrar a Odoo.

**Conceptos de dominio confirmados:**
- La entidad principal es **Expediente** (= solicitud de gestión / trámite dentro de un proyecto), no "Proyecto"
- Campos de un expediente: fecha solicitud (auto), nro. solicitud, solicitante, tipo de trámite (4-5 opciones), carácter, estructura orgánica
- **Estructura orgánica**: organismos con subcuentas, los usuarios pertenecen a áreas, los expedientes se filtran por organismo/estructura
- **Historial**: tabla con fecha, hora, usuario, área y mensaje — trazabilidad completa de quién tocó qué y cuándo
- Fuente de verdad → Odoo. La app es entrada y espejo

**Odoo (confirmado):**
- Versión 18.0e Enterprise, en la nube
- Módulos: gestión, tesorería, administración
- 83 usuarios activos
- Mañana (06/05) recibimos acceso a la API

**ESIGA (sistema viejo):**
- Es el software anterior que hacía básicamente lo mismo que la app nueva pero sin integración con Odoo y mucho menos amigable
- Recibimos cuenta de acceso mañana (06/05) para entender el flujo que los usuarios ya conocen

**Funcionalidades clave:**
- Lector de PDF con IA: drag & drop, auto-rellena campos, usuario verifica y corrige
- Odoo codifica archivos con formato específico (CUIT + monto + fecha + tipo) — la IA también tiene que formatear los nombres
- Trazabilidad completa: historial de estados, archivos, personas que interactúan
- Notificación por mail al finalizar un expediente
- El cliente sube → Argeninta procesa → Odoo se actualiza → cliente ve el estado en la app

**Lo que NO cambia:**
- Documenso para firma digital (confirmar si cloud o self-hosted)
- Supabase como capa de datos para la app
- UI inspirada en Attio

---

### 05/05/2026 — Arquitectura y stack
- Se analizaron tres preguntas de arquitectura importantes:
  1. **Offline support**: usar IndexedDB + Service Worker (Workbox + Dexie.js) para guardar formularios sin conexión y sincronizar automáticamente cuando vuelve el internet. Hay que versionar los drafts offline para manejar conflictos de schema.
  2. **Resilencia ante caída de Supabase**: backup diario automático con `pg_dump` schedulado al server de Unit + `rclone sync` para Storage. Si Supabase muere, se levanta PostgreSQL en el server de Unit, se importa el dump, y la app sigue. Tiempo de recuperación: horas.
  3. **Peso del proyecto**: código/repo ~5 MB sin node_modules, Docker image ~500 MB–1 GB, DB empieza en 10–50 MB. Lo que crece es el storage de archivos (1 GB a 50+ GB según uso).
- Se analizó la pregunta de ownership del Supabase (ver Preguntas abiertas).
- Se confirmó que migrar de Supabase a servidor propio de Argeninta es viable: PostgreSQL + MinIO + PgBouncer reemplazan exactamente las capas de Supabase. Prisma no se entera del cambio.
- **Punto crítico para decidir:** ¿el servidor de Argeninta es accesible desde internet? (necesario si los técnicos usan la app desde el campo)

### 04/05/2026
- Se definió el producto completo: app de gestión de proyectos para Argeninta
- Stack elegido: Next.js 14 + TypeScript + Supabase Pro + Prisma + shadcn/ui
- Se agregaron Documenso y la integración con Odoo
- UI philosophy inspirada en Attio (data-rich tables, filtros como chips)
- Se definieron módulos M1–M9, modelo de dominio, fases y convenciones
- Se respondieron las preguntas de estructura (ver Decisiones tomadas)
- Se creó documento "Preguntas para reunion — Odoo e integracion" en Outline

---

## Decisiones tomadas

| Fecha | Decisión | Detalle |
|---|---|---|
| 04/05 | Supabase Pro como capa de datos | DB managed, pooling incluido, storage CDN, auth con RLS |
| 04/05 | Archivos en Supabase Storage | DB guarda solo metadata (storageKey), binarios en Storage |
| 04/05 | Documenso self-hosted en servidor de Argeninta | Sus datos sensibles (contratos, firmas) viven en su propia infra |
| 04/05 | Documenso en la entrega final | Contratos, firma múltiple, devuelve firmado al emisor y destinatarios elegidos |
| 04/05 | Odoo: flujo unidireccional desde la app | Se crea proyecto en la app → se sincroniza a Odoo automáticamente |
| 04/05 | Attio: solo inspiración de diseño | No se integra como herramienta, es referencia visual/UX |
| 05/05 | Odoo 18.0e Enterprise confirmado | En la nube, módulos: gestión/tesorería/administración, 83 usuarios activos |
| 05/05 | Entidad principal: Expediente, no Proyecto | Expediente = solicitud de gestión/trámite. Tiene tipo, carácter, estructura orgánica, historial |
| 05/05 | La app es para clientes externos | No es herramienta interna — los clientes suben docs, la app los procesa y refleja en Odoo |
| 05/05 | IA lectora de PDF es feature core | Drag & drop de PDFs → IA pre-rellena campos → usuario verifica → va a Odoo |
| 05/05 | Offline support: IndexedDB + Service Worker | Workbox + Dexie.js; drafts offline versionados para manejar conflictos de schema |
| 05/05 | Backup automático de Supabase al server de Unit | `pg_dump` diario schedulado + `rclone sync` del Storage; recuperación en horas si Supabase falla |
| 05/05 | Migración a servidor propio de Argeninta: viable | PostgreSQL + MinIO + PgBouncer reemplazan Supabase; Prisma no cambia; condicionado a que el server sea accesible desde internet |

---

## Preguntas abiertas / Pendientes

- ¿Acceso a la API de Odoo? → recibimos mañana 06/05 (XML-RPC o REST, pendiente confirmar)
- ¿Hay alguien técnico del lado de Argeninta que pueda ayudar con la API?
- ¿Los 83 usuarios de Odoo son los mismos que van a usar la app, o son un subconjunto?
- ¿Qué datos exactamente tiene que recibir Odoo al crear/actualizar un expediente en la app?
- Tipos de trámite exactos (dijeron achicar a 4-5 opciones, pendiente definir cuáles)
- **¿Quién es dueño del proyecto Supabase en producción?** Opciones: (A) Unit crea y opera el Supabase — control total, Argeninta nos paga el servicio o va en contrato de mantenimiento; (B) Argeninta tiene su propia cuenta Supabase — sus datos en su cuenta, menos dependencia de Unit. Para la demo usar cuenta de Unit (gratis).
- **¿El servidor de Argeninta es accesible desde internet?** Determina si se puede migrar la app a su infra. Si es solo LAN interna, los técnicos en campo no podrían usarla sin VPN.
- ¿Los técnicos usan la app desde el campo (celular con datos) o solo en la planta/oficina? → define requisito de conectividad y prioridad del soporte offline.

---

## Próximos pasos

1. Recibir API de Odoo + cuenta de ESIGA (06/05) — explorar el flujo viejo
2. Crear proyecto en Supabase Pro
3. Setup del repositorio: `npx create-next-app`, Docker Compose, entrada en Caddy
4. Auth básica con Supabase Auth (login + roles)
5. CRUD de expedientes con filtros (core de la demo) — renombrar todo de "proyecto" a "expediente"
6. Lector de PDF (feature core): definir si va en la demo o en fase 2

---

## Stack vigente

| Capa | Tecnología |
|---|---|
| Frontend + Backend | Next.js 14 (App Router) + TypeScript |
| UI | Tailwind CSS + shadcn/ui — filosofía Attio |
| Base de datos | Supabase PostgreSQL (Pro) |
| Auth | Supabase Auth + RLS |
| Storage | Supabase Storage (Pro, 100GB, CDN) |
| Connection pooling | Incluido en Supabase |
| Queries / ORM | @supabase/supabase-js (respeta RLS; no Prisma — bypassea RLS por defecto) |
| Firma digital | Documenso (self-hosted en servidor de Argeninta) |
| Integración ERP | Odoo (API XML-RPC / REST, flujo app → Odoo) |
| Compresión archivos | Sharp (imágenes) + Ghostscript (PDFs) |
| Email queue | BullMQ + Redis + Nodemailer |
| Validación | Zod |
| Deploy app | Docker Compose + Caddy en servidor Unit |
| Deploy Documenso | Servidor propio de Argeninta |
