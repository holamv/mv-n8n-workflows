# Catálogo de Workflows — Manzana Verde n8n

> Inventario **completo** de workflows activos en las dos instancias n8n de MV, con su uso.
> Generado desde el estado vivo de la API el **2026-07-22**. Para el detalle profundo de los 5 workflows conversacionales core (ATC, Bridge, PCL, PCP, Seguimiento 14d) ver **[MANUAL.md](MANUAL.md)**.

## Las dos instancias

| Instancia | URL | Rol |
|---|---|---|
| **A** (principal) | `n8n.manzanaverde.la` | Bot ATC, outbound de tráfico externo (ManyChat), RRHH/reclutamiento, tickets, compras, utilidades. |
| **B** (secundaria) | `n8n2.manzanaverde.la` | Pipeline de leads (Bridge→PCL), analítica de marketing → datalake, operaciones y mantenimiento. Montada may-2026 para descargar A. |

**Totales activos: A = 47 · B = 18 · (65 en total).** Además hay sub-workflows y flujos on-demand que no cuentan como "activos" pero se usan (ver §Relacionados).

Detalle de la migración A→B: `memory/project_n8n2_migration.md`. Credenciales/endpoints de API: `memory/reference_n8n_api.md`.

---

# Instancia A — `n8n.manzanaverde.la`

## 1. Bot conversacional ATC (+ sub-workflows)

El núcleo: bot WhatsApp que atiende Ventas / ATC / Reconsumos en PE·CO·MX. Detalle completo en [MANUAL.md §2](MANUAL.md#2-agente-atc-el-corazón).

| Workflow | ID | Trigger | Qué hace |
|---|---|---|---|
| **Agente ATC** | `R81I6h5KWtyNaDAy` | webhook `/be54a501-…` (+ `/e2bf7451-…`) | 155 nodos. Recibe WhatsApp vía ManyChat, clasifica intención, rutea a Ventas/ATC/Reconsumos, dedup Redis, tools de planes y pagos. |
| **Wallet** | `Il7WWfAJCElkQx3d` | sub-workflow | Sub-flujo de saldos/recargas del wallet; consulta backend + Redis lock anti-recarga. Llamado por ATC. |
| **Crear Pedido** | `74K3pRrvutW2gwtX` | sub-workflow | Crea el pedido en backend (HTTP) + Redis. Llamado por ATC. |
| **Obtener dirección** | `2BqhLRHKtIgshEDy` | sub-workflow | Geocoding: resuelve/normaliza dirección del cliente. Llamado por ATC. |
| **Crear Dirección** | `zMYV36UQHOAQcg2h` | sub-workflow | Registra dirección nueva del cliente. |
| **Registro** | `OwHnfNmR2dz6vknj` | sub-workflow | Registro del cliente (Redis + IA + backend). |
| **Nota** | `ph0RiOaa7iCB4qsC` | sub-workflow | Asigna cada pedido al Base de Operaciones (BO) más cercano con cupo (`bo_asignado`). |
| **My workflow 23** | `Sq9xKd89ybWHMk8k` | sub-workflow | Sub-agente IA (Gemini) con output estructurado, usado por ATC. |

> **Anti-recarga, anti-resaludo, dirección verbatim, GATE plan activo** y demás reglas de negocio: ver el listado extenso en [MANUAL.md §2](MANUAL.md#2-agente-atc-el-corazón). El bot es la fuente #1 de regresiones.

## 2. Outbound / plantillas ManyChat

| Workflow | ID | Trigger | Qué hace |
|---|---|---|---|
| **Contacto Primer Pedido (PCP)** | `s37SLqGFljbf08Js` | webhook `/a6ba5a8a-…` | Saluda al cliente tras su primer pedido (espera a 3pm Lima + valida entrega real). Dedup Redis compartido con Seguimiento. Ver [MANUAL §5](MANUAL.md#5-pcp--contacto-primer-pedido). |
| **Seguimiento 14 días - Sin Pedir** | `FS68xVacNF1DN9cd` | webhook `/1a176766-…` + `/699e7b91-…` | Re-engagement: 4 ramas por `Condición` (sin pedir / 4to pedido / primer pedido / motivar carga). Ver [MANUAL §6](MANUAL.md#6-seguimiento-14-días). |
| **Referidos** | `4g14aSPGtVfvGvqU` | webhook `/34c80e5a-…` | Programa de referidos: recibe evento, consulta backend, manda plantilla WhatsApp. |

## 3. Tickets / soporte (integración Laravel)

| Workflow | ID | Trigger | Qué hace |
|---|---|---|---|
| **tickets-created v10** | `8sqaRkhwKTY0IAEd` | webhook `/tickets-soporte` | Ticket nuevo: postea al canal Discord, crea thread, notifica al responsable y al lead por Gmail, guarda `thread_id`+lead+líder en Postgres. |
| **tickets-resueltos v3** | `DHVrxbujjfikNHG0` | webhook `/tickets-resueltos` | Ticket resuelto: descarga evidencia, notifica al lead por Gmail. |
| **tickets-sla-extendido** | `38UWwiLnJ0UdBNok` | webhook `/tickets-sla-extendido` | Extiende SLA en Postgres, avisa en el thread de Discord y por Gmail al lead. |

## 4. RRHH / reclutamiento / onboarding

| Workflow | ID | Trigger | Qué hace |
|---|---|---|---|
| **Base MV** | `7ngi7qZftTp9qzCv` | 9 webhooks | Hub RRHH: registro de personal, vacaciones (con aprobación), contratos, horas extras, bajas → Google Sheets + correos + envío de contrato PDF. |
| **RRHH Admin Notifications** | `zX5SQDc3UfaQzSeD` | webhook `/rrhh-admin-events` | Envía correos de RRHH según evento (welcome, vacaciones aprobada/observada). |
| **Proceso Selección** | `Qd8u6yh1ocACwojB` | webhook `/webhook-candidatos` + `/VacantesMV` | Registra candidatos en Sheet, evalúa aprobado/no y notifica a Discord. |
| **Proceso Onboarding** | `QBwE9Q3viq0cSt57` | form `/Reparto` + webhook `/BACKED-REPARTIDORES` | Onboarding de repartidores: formulario, correo aprobatorio / info pendiente, registro en Sheet. |
| **Embajador Verde (Promotor de Calle)** | `UHg9p4BGBHO36MSV` | webhook/form `/embajador-verde` | Landing + postulación de volanteros: sube CV a Drive, guarda en Sheet, avisa a Melanie. |
| **Filtro de CVs — Analista Crecimiento Orgánico & MarTech** | `2LMFtSoOlClVxhn4` | form `/AnalistaMartech` | Formulario de postulación + calificación IA del CV (PDF/DOCX) → Sheet + Drive + correo. |
| **Filtro de CVs — Analista MKT Performance** | `3fyLwVRBrgexCyOC` | form `/asistentedemktperformance` | Ídem, vacante MKT Performance. |
| **Filtro de CVs — Chef Ejecutivo LATAM** | `kdp16nRANJMtrD1W` | form `/ChefEjecutivo` | Ídem, vacante Chef Ejecutivo. |
| **Filtro de CVs — Líder de Operaciones On Demand** | `lNgkjp3RLeccAQok` | form `/headops` | Ídem, vacante Head de Operaciones. |

> Hay 4 filtros de CV más **inactivos** (vacantes cerradas): ver §Relacionados.

## 5. Oficina / comunicaciones internas

| Workflow | ID | Trigger | Qué hace |
|---|---|---|---|
| **MV - Registro oficina UTEC** | `CdmDIaWhqkVSM8IS` | form | Reserva de cupos de la oficina UTEC: valida ventana y cupos, registra en Sheet, notifica a Discord. |
| **MV - Recordatorio diario oficina UTEC** | `UpSjtOu04XUS9LJa` | cron 9am Lima | Lee reservas del día y las publica en Discord. |
| **MV - Issues a Discord** | `q9K38OEiEju9eazK` | cron 2pm/5pm Lima L-V | Toma issues sin hilo (de Notion), publica en Discord, crea hilo y actualiza la URL en Notion. |

## 6. Compras / órdenes de compra / contabilidad

| Workflow | ID | Trigger | Qué hace |
|---|---|---|---|
| **My workflow 19** | `OEJB3EXBJwRLWrqw` | 4 webhooks + Sheets trigger | Seguimiento de comprobantes de OCs no planificadas y avisos de pagos parciales/totales a owners → Sheets/Drive/Discord. |
| **oc_intake_aprobaciones** | `2vJwqB2BWUrh60dr` | Sheets trigger | Intake de OCs: descarga adjunto, sube a Drive, arma fila `ocs` en Sheet y notifica aprobaciones a Discord. |
| **OC_WSP_DRIVE** | `VsARDDr6zQqfMiZm` | webhook `/apichat-integration`, Drive, Telegram | Intake de órdenes de compra por WhatsApp/Telegram/Drive con IA (Gemini), correlativo de tesorería, memoria Postgres y avisos a Discord. |

## 7. Auditoría catering

| Workflow | ID | Trigger | Qué hace |
|---|---|---|---|
| **Auditoria completada: correo al catering** | `O7QXOAo50uhXdGPD` | webhook `/auditoria-completada` | El SGR (`audit.service.ts`) postea al terminar una auditoría Daily/Franquicias; arma y envía el correo al catering (logo MV embebido, botón "Ver Auditoría"). |
| **Audit ATC - Resumen 12h email** | `jWvc4pnMKMJJmypm` | cron 7:30 y 19:30 Lima | Audita las ejecuciones recientes del Agente ATC y manda resumen por Gmail. Ruteo cross-instancia a workflows de B. |

## 8. Otros bots WhatsApp / pagos

| Workflow | ID | Trigger | Qué hace |
|---|---|---|---|
| **Whatsapp order bot** | `HBtFFz0L5XRpjUUp` | webhook `/b9630b56-…` | Bot de pedidos por WhatsApp **independiente del ATC**: AI Agent con tools (gestionar cliente BBDD, validar cobertura, analizar comprobante, generar link MercadoPago, obtener menú, estado/crear order), memoria Postgres. ⚠️ Referencia un sub-workflow `ISMnhyg3QV651Hkq` que **ya no existe** en la instancia — revisar. |
| **Comparation Pasarelas - Backend** `beta` | `TIxHBC08VyQ5QVi6` | webhook `/backend/{peru,mexico,colombia}` | Backend beta que compara pasarelas de pago (PayU, MercadoPago, Monnet, transferencia) por país; AI Agent (Gemini) + Sheets. |
| **REGISTRO Y VENTAS TOTALES** | `UJXBBdxfrYf407bH` | webhook `/f0bb326f-…` | Registra ventas y registros totales a Sheet vía backend. |
| **RESPUESTA DIRECCIONES** | `uUb3Rnuw2bLZgpX4` | form + webhook `/direccionesventas` | Captura respuestas de dirección para ventas, consulta backend y avisa a Discord. |

## 9. Servicios/utilidades y bots personales

| Workflow | ID | Trigger | Qué hace |
|---|---|---|---|
| **validar_cobertura_geo** | `QtXtjoNcDWHYBYjM` | webhook `/eb28f0b2-…` | Micro-servicio de cobertura: geocoding + chequeo contra `zonas_de_cobertura`. También lo llama *Whatsapp order bot*. |
| **conection_db_mv** | `Py4wuyC0sdwj7RPR` | webhook `/6189aa27-…` | Agente IA que consulta la DB MV y crea/actualiza páginas en Notion (memoria MongoDB). |
| **Send Email On Demand** | `LT3d0qxfiwmrK0Gv` | webhook `/send-email-on-demand` | Endpoint genérico para disparar un correo (Gmail) desde cualquier sistema. |
| **TEST MC FindByPhone** | `Wdc6MA6tPzDNr2Q3` | webhook `/mc-findphone` | Endpoint de prueba para el lookup de ManyChat por teléfono. |
| **Administrador** | `Hz9XSuYMA9jeamBs` | Telegram + webhook | "CasaBot" administrativo por Telegram: registra ingresos/egresos (IA), escanea DNI (`/dniscanner44`) → Sheets. |
| **Chanchito Bot - Finanzas Familia** | `2rVibJXQRaAvNvUS` | Telegram | Bot personal de gastos familiares: parsea el mensaje con IA y lo guarda en Sheet (resumen, hoy, categorías). |
| **Mini Conta** | `DYgdidLnn9lXL7Jr` | Google Drive trigger | Procesa archivos contables que caen en Drive con IA (Gemini) y avisa a Discord. |
| **My workflow 6** | `LMjrZM1MOkPhopJO` | webhook `/chat-in` | Endpoint de chat genérico con IA (Gemini/OpenAI) + memoria. |
| **My workflow 43** | `Nq2Bz5xB6tCKIlSJ` | webhook `/imagenes365` | Endpoint IA que procesa imágenes vía HTTP + OpenAI. |
| **ASISTENTE INTERNO - CLASE IA** | `v6qF8fZXuOigFYNC` | webhook `/ASISTENTE-REPARTO` | Endpoint interno mínimo (5 nodos, sin integraciones) — probablemente demo/clase de IA. Revisar si sigue en uso. |

## 10. Infraestructura / mantenimiento (crons de A)

| Workflow | ID | Trigger | Qué hace |
|---|---|---|---|
| **Watchdog Crons n8n2 v2 (desde A)** | `OfePlGZjSGGSCRiA` | cron 1h + webhook | Vigila desde A que los crons de **B** disparen (Bridge, Lead Asesor, Sheet Worker, Reconciliador). 2 pasadas + auto-fix (deactivate→activate) + email si persiste 15m. A es estable, por eso vigila a B. |
| **Zombie Cleanup Auto (semanal)** | `cP9LAoExTd3Se4MP` | cron domingo 3am Lima | Limpia ejecuciones zombie/colgadas de la instancia A. |

---

# Instancia B — `n8n2.manzanaverde.la`

## 1. Pipeline de leads outbound (Bridge → PCL)

El flujo de leads vive completo en B desde el switch de jun-2026. Detalle en [MANUAL.md §3-4](MANUAL.md#3-discord-bridge) y `memory/project_outbound_and_sheet.md`.

| Workflow | ID | Trigger | Qué hace |
|---|---|---|---|
| **Discord Bridge - Real-time** `[MIGRATED]` | `tLAVt91iWAHsY2eE` | cron 3 min | Lee 8 canales de Discord, normaliza teléfono, dispara los webhooks de PCL (Leads/Recovery). Cursor por canal + filtro de edad 2h. |
| **Primer Contacto Leads (PCL)** `[MIGRATED]` | `AAntaw0Aa0fkDSaR` | webhook `/0fa4fe5c-…` (Leads) + `/48f220d5-…` (Recovery) | Crea el subscriber en ManyChat y manda plantilla de bienvenida/recovery (split por país). Aviso Discord inline al fallar. |
| **Lead Asesor Tracker** `[MIGRATED]` | `8reSZFHPLwDoX4Zh` | cron 3 min | Lee reacciones de asesores en Discord y las registra en Sheet (qué lead tomó quién). |
| **ManyChat → Google Sheet (Leads)** | `QLqa5cXehm10OsYs` | webhook `/manychat-sheet-lead` | Recibe eventos de campaña ManyChat y hace LPUSH a la cola Redis (no escribe el Sheet directo). |
| **ManyChat Sheet Worker v2** | `98aBYpfXavNdE90a` | cron `* * * * *` | Drena la cola Redis (patrón single-worker con lock) y escribe en el Sheet de campañas (envío/click/huérfano/ignorar). ~6000 filas/h. |
| **Reconciliador Leads Discord→PCL v3** | `DgpXwCwdxvgW9LTx` | cron 3h + webhook | Recupera leads que el Bridge dropea por su filtro de edad: lee Discord, deduplica vs PCL y reinyecta los ausentes. |

## 2. Analítica de marketing → datalake

Familia de crons que alimentan el datalake y avisan resúmenes a Discord (canal GEO).

| Workflow | ID | Trigger | Qué hace |
|---|---|---|---|
| **GEO — Monitoreo semanal v4** | `AhwzLvkFYRgM9SFd` | schedule semanal | Consulta 3 motores IA (OpenAI/Gemini/Claude) por queries de marca y mide el % de mención por país → datalake + Discord. |
| **GSC — Semanal** | `W9KexKGzJbKF7SQ7` | schedule semanal | Google Search Console: clics/impresiones por segmento → datalake + Discord. |
| **GSC — Watchdog semanal** | `YP8780y4l7GiKsIR` | schedule viernes | Deadman check: verifica que la data de GSC de la semana se haya cargado. |
| **APPSTORE — Descargas mensuales** | `4fDlPio4BDcMgNTo` | schedule día 10 | Descargas de App Store (orgánico vs campaña) vía API ASC (JWT) → upsert `app_downloads` + Discord. |
| **PLAY — Descargas mensuales** | `CHyXxz4FRknqjUru` | schedule día 10 | Descargas de Google Play desde CSV en GCS (orgánico vs campaña) → `app_downloads` + Discord. |
| **Pauta Meta — Vigía semanal** | `nAW7FXhsscD3eCcj` | schedule semanal | Health check de la pauta de Meta desde el datalake (`marketing-ads`) → Discord. |
| **Panel Influencers — Semanal** | `MwTo7Q9Zvs1XTFCX` | cron lunes 8am | Panel de influencers: ventas por cupón + cupones vigentes + piezas activas (Apify) → Discord. |
| **Radar Influencers — Corrida quincenal** | `QdN8U8xzZWrqug7w` | cron lunes 9am (quincenal) | Barrido de TikTok con Apify, scoring y dedup de candidatos, vetting IG → Sheet. |

## 3. Operaciones

| Workflow | ID | Trigger | Qué hace |
|---|---|---|---|
| **Activación de Comandas (BD real)** | `rCPHiH1ZynAMb4XB` | cron 00-04 Lima | Detecta activación de cocinas del día (MySQL), manda mensaje ManyChat al catering (1×/día), etiqueta y upsert en Supabase `Catering_profile`. |

## 4. Infraestructura / mantenimiento (crons de B)

| Workflow | ID | Trigger | Qué hace |
|---|---|---|---|
| **Núcleo — Error handler compartido (Discord)** | `dcbypiKbFRkgdvnz` | Error Trigger | Handler de errores global: cualquier workflow de B con `errorWorkflow` apuntado aquí avisa el fallo a Discord. |
| **Chat Memoria Cleanup (semanal)** | `QZLF1hBjDgTTRt4v` | cron domingo 3am Lima | Mantiene los últimos 50 mensajes por `session_id` en `n8n_chat_memoria` (Supabase) y borra el resto. Previene egress. |
| **Zombie Cleanup Auto B (semanal)** | `zEU31TyJv1A70t6H` | cron domingo 3am Lima | Limpia ejecuciones zombie/colgadas de la instancia B. |

---

# Relacionados: no activos pero en uso (o de rollback)

## On-demand (se ejecutan a mano, por eso figuran inactivos)

| Workflow | Instancia | ID | Uso |
|---|---|---|---|
| **Procesador de Boletas de Pago (Drive a Sheets)** | A | `CQ7ENaFEWLgdCrGF` | Manual: procesa boletas desde Drive a Sheets cuando se necesita. |
| **Contenidos estáticos con IA para redes sociales** | A | `GdzZADKYqGmPptcD` | Manual: genera contenidos de RRSS con IA bajo demanda. |

## Legacy — reemplazados por su versión en B (se conservan para rollback)

| Workflow (A, inactivo) | ID en A | Reemplazado por (B, activo) |
|---|---|---|
| Discord Bridge - Real-time | `VwG3AgtdDDdjC7xc` | `tLAVt91iWAHsY2eE` |
| Primer Contacto Leads | `9MxNM5byLghh9ky2` | `AAntaw0Aa0fkDSaR` |
| Lead Asesor Tracker | `QPZz35FbARQFm2dI` | `8reSZFHPLwDoX4Zh` |
| Discord Error Notifier | `CI0AVz4vdAumGmuj` | Deprecado (aviso inline en PCL + `dcbypiKbFRkgdvnz`) |

## Superseded en B (versión vieja apagada)

| Workflow (B, inactivo) | ID | Estado |
|---|---|---|
| ManyChat Sheet Worker (v1) | `P1XibxtanFYCKIbm` | Reemplazado por Worker v2 `98aBYpfXavNdE90a`. **No reactivar** sin re-arquitectar (race condition + quota Sheets). |
| GEO — Monitoreo semanal (mención binaria) | `22EOIGf4KhLeGqBU` | Retirado 17/07, reemplazado por v4. |
| PCL Alert ManyChat No Saldo v2 | `51WIn5VD4Xi4Zlv9` | Alerta de saldo ManyChat (cron */30). Actualmente **apagado** — reactivar si se repite el incidente de saldo. |

## Parqueados / sin uso actual (no borrar sin confirmar)

- **A:** 4 Filtros de CV de vacantes cerradas (`E3C4BigACXzyzuSz`, `W1wk2gHhfp52Tuh3`, `nkZyzT9z9KhTee61`, `3YLFYl7ZaYTQDuYa`), `Registro Promoción` (`FBsmSD5kpmpPnaUS`, sub de Promociones Volantes), `Promociones Volantes`, `Nuevos flujos contables [RESTORED]`, `oc-conciliacion_bancaria [RESTORED]`, `Project_Onb A/B`, `sync-datalake v1`, `Meta rc`, `C · Update dealer_profile`, `D · KPI daily snapshot`, `Queue Watchdog n8n B`, `Notificación de Errores Global`, y varios `My workflow 32/44/45/46/47/48`.
- **B:** `Meta Ads Reporte Diario`, `Meta Lead Ads → Sheets`, `MV - Alerta Comandas Activadas`, `My workflow`.

> Para el inventario crudo (todos los IDs, activos e inactivos) ver `MIGRATION_INVENTORY.md`.
