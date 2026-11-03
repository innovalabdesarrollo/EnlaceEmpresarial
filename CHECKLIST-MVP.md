# Enlace Empresarial — Checklist MVP

> Marca con `[x]` conforme se complete cada ítem.  
> Fuente: `enlace-empresarial-spec-mvp.md` + reglas de alcance del MVP (Innovalab).  
> Actualizado: 2 nov 2026 (México).

---

## Cómo usar

- `[ ]` pendiente · `[x]` terminado · `[~]` parcial / en progreso
- Solo lo de **Dentro del MVP** cuenta para entrega.
- Lo de **Fuera de alcance** no se implementa en esta fase.

---

## Infraestructura base

- [x] Conexión MongoDB Atlas verificada (DB del proyecto en la URI)
- [x] Monorepo pnpm: `apps/web` (SvelteKit) + `apps/api` (Node)
- [x] `.env` / `.env.example` con `MONGODB_URI` (nombre de DB del proyecto)
- [x] API en puerto dedicado `4710` (sin matar procesos si está ocupado)
- [x] Web en puerto dedicado `5710` (sin matar procesos si está ocupado)
- [x] Seed de usuarios demo (cliente + contable) y clientes de prueba
- [x] UI Tailwind responsive (prioridad móvil)
- [x] Auth email/password (JWT) — **sin Google**

---

## Dentro del MVP

### A. Cliente

- [x] **Depositar documentos** — seleccionar/cargar uno o varios archivos, progreso y confirmación de recepción
- [x] **Consultar estado** — recibido / en revisión / clasificado / procesado (+ aviso si requiere revisión manual)
- [x] **Confirmación de recepción** — confirmación **en la app** (pantalla + registro/notificación interna; sin correo SMTP)
- [x] **Historial de documentos y envíos** — documento, fecha, estado, destinatario; fallidos visibles
- [x] **Notificaciones de errores/revisiones** — avisos **in-app** con motivo, documento afectado e instrucción
- [x] **Acceso seguro** — login; ver/descargar solo documentos del propio cliente

### B. Personal contable

- [x] **Consultar documentos clasificados** — archivo, cliente, fecha, confianza, estado; filtros por cliente/fecha/estado
- [x] **Bandeja baja confianza** — solo pendientes de revisión; ver sugerencia y descargar archivo
- [x] **Confirmar o corregir clasificación** — aceptar sugerencia o elegir cliente/carpeta; registrar decisión
- [x] **Historial de procesamiento** — archivo, acción, actor, fecha, estado, errores; búsqueda
- [x] **Corregir errores de procesamiento** — lista con causa; reintentar o descargar / asignar manual
- [x] **Depositar / marcar listo para envío** — validar destinatario; entrar a cola de envíos
- [x] **Validar antes de envío** — cola con destinatario, asunto, adjunto, fecha, estado; bloquear si falta correo/archivo/cliente
- [x] **Estado de envíos** — pendiente / preparado / enviado / fallido / bloqueado; reintento cuando aplique  
  _(en MVP: marcar “enviado” en sistema; **sin SMTP**)_
- [x] **Observaciones de revisión** — agregar / editar / consultar con fecha y autor

### C. Clasificación automática (mínima)

- [x] Reglas simples (nombre de archivo, RFC, patrones) + nivel de confianza
  - Score RFC/razón social + reglas persistidas (`ReglaClasificacion`) para carpeta/patrones.
- [x] Umbral configurable → baja confianza va a bandeja de revisión
- [x] Modelos Mongo necesarios: Cliente, Cuenta, Documento, Clasificación, Procesamiento, Revisión, Incidencia, Envío, Confirmación, Notificación, Carpeta, Observación, Historial, ReglaClasificación
  - Catálogo `Carpeta`; `Procesamiento` al clasificar; `Revision` al pendientes/confirmar.

### D. Adaptaciones MVP vs spec (correo)

El spec habla de correo. En este MVP se cubre así:

- [x] Confirmaciones y avisos como **notificaciones in-app** (no email)
- [x] Cola de envíos + estados + “marcar enviado” **simulado** (trazabilidad sin SMTP)
- [x] Historial de envíos visible para cliente y contable (con destinatario configurado)

---

## Fuera de alcance (no integrar en este MVP)

### Excluido por decisión de producto / prompt

- [ ] ~~Auth con Google (OAuth)~~
- [ ] ~~Envío real de correo (SMTP / proveedor)~~
- [ ] ~~Confirmación de recepción por email~~
- [ ] ~~Notificaciones push/email externas~~
- [ ] ~~Features no listadas en el spec MVP~~

### Fase posterior / visión del spec (no MVP)

- [ ] ~~IA / NLP real para leer e interpretar contenido del documento~~
- [ ] ~~OCR / reconocimiento de estructura y metadatos avanzados~~
- [ ] ~~Entrenamiento / ajuste del modelo con histórico por cliente~~
- [ ] ~~Módulo de redacción automática de correos con IA~~
- [ ] ~~Detección automática por filesystem de carpetas “procesado” (watchers externos)~~
- [ ] ~~Integraciones con Drive / OneDrive / WhatsApp / otros canales~~
- [ ] ~~Multi-tenant avanzado, billing, roles granulares más allá de cliente/contable~~
- [ ] ~~App móvil nativa~~
- [ ] ~~Almacenamiento cloud tipo S3 (MVP: disco local / uploads)~~

### Fuera de operación local

- [ ] ~~Matar procesos de otras apps si el puerto está ocupado~~ — si el puerto falla, cambiar `PORT` / sugerir libre

---

## Criterio de “hecho”

Una fila se marca `[x]` solo si:

1. Backend + UI usable en móvil/desktop  
2. Datos en la DB Atlas del proyecto (`EnlaceEmpresarial` / la del `.env`)  
3. Criterios de aceptación de la HU cubiertos **dentro** de las adaptaciones MVP (sin correo real)

---

## Progreso rápido

| Bloque | Hecho | Total |
| --- | ---: | ---: |
| Infraestructura | 8 | 8 |
| Cliente | 6 | 6 |
| Contable | 9 | 9 |
| Clasificación + modelos | 3 | 3 |
| Adaptaciones correo→in-app | 3 | 3 |

**MVP dentro de alcance: completo (29/29).**  
Lo pendiente del archivo está en **Fuera de alcance** (Google, SMTP real, IA, etc.) a propósito.  
Solo falta que configures credenciales en `.env` (`MONGODB_URI`, `JWT_SECRET`; umbral `CONFIDENCE_THRESHOLD`).
