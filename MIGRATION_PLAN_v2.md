# Plan de migración revisado (regla: webhooks se quedan)

**Resumen:** 174 workflows analizados
- 🟢 Se quedan en A: **34** (ATC core 5 + subworkflows ATC 2 + con webhook 27)
- 🟡 A mover a B (sin webhooks): **20**
- ⚫ Inactivos (a borrar): **120**

## 🟡 Workflows a mover a n8n2 (solo triggers no-webhook)

| ID | Nombre | Triggers | Creds | Última act |
|---|---|---|---|---|
| `CpRFvTd4FHWBMPs1` | Caja chica |  | 5 | 2025-10-22 |
| `2rVibJXQRaAvNvUS` | Chanchito Bot - Finanzas Familia |  | 2 | 2026-04-22 |
| `VwG3AgtdDDdjC7xc` | Discord Bridge - Real-time | cron, manual | 1 | 2026-05-19 |
| `CI0AVz4vdAumGmuj` | Discord Error Notifier | cron, manual | 0 | 2026-05-06 |
| `QPZz35FbARQFm2dI` | Lead Asesor Tracker | cron | 1 | 2026-05-06 |
| `leifQ3oEKi2Z3LRi` | Linkeado de egresos - BANAMEX |  | 4 | 2025-09-29 |
| `svMhZIAnuLfaT3Jq` | Linkeado de egresos - MP MEXICO |  | 4 | 2025-09-29 |
| `DYgdidLnn9lXL7Jr` | Mini Conta |  | 4 | 2025-10-01 |
| `q9K38OEiEju9eazK` | MV - Issues a Discord | cron | 1 | 2026-05-28 |
| `UpSjtOu04XUS9LJa` | MV - Recordatorio diario oficina UTEC | cron | 2 | 2026-05-15 |
| `CdmDIaWhqkVSM8IS` | MV - Registro oficina UTEC | form | 2 | 2026-05-18 |
| `Sq9xKd89ybWHMk8k` | My workflow 23 | executeWorkflowTrigger | 1 | 2025-10-29 |
| `ph0RiOaa7iCB4qsC` | Nota | executeWorkflowTrigger | 0 | 2025-10-10 |
| `ZvjJbuSRpbvFfIUV` | Notificación de Errores Global |  | 1 | 2025-11-26 |
| `2BqhLRHKtIgshEDy` | Obtener dirección | executeWorkflowTrigger | 0 | 2026-04-21 |
| `2vJwqB2BWUrh60dr` | oc_intake_aprobaciones |  | 4 | 2025-09-19 |
| `ZMTrAWenbUwH1Yho` | Project_Onb · A · Cronograma matutino | cron | 4 | 2026-05-27 |
| `OwHnfNmR2dz6vknj` | Registro | executeWorkflowTrigger | 3 | 2026-02-11 |
| `Il7WWfAJCElkQx3d` | Wallet | executeWorkflowTrigger | 4 | 2026-04-15 |
| `cP9LAoExTd3Se4MP` | Zombie Cleanup Auto (semanal) | cron, manual | 0 | 2026-05-14 |

## 🟢 Workflows que se quedan en A por tener webhook/form

| ID | Nombre | Webhooks/Forms expuestos |
|---|---|---|
| `Hz9XSuYMA9jeamBs` | Administrador | /webhook/9c569951-3d10-4df5-8462-2e49d82d1ac1, /webhook/dniscanner44 |
| `v6qF8fZXuOigFYNC` | ASISTENTE INTERNO - CLASE IA | /webhook/ASISTENTE-REPARTO |
| `7ngi7qZftTp9qzCv` | Base MV | /webhook/bf45eb80-c488-437d-8abf-4700abf48b9a, /webhook/e8bd1395-c776-484a-82cf-3d3a3d99492f, /webhook/965b4856-a32c-4dac-b98f-57fc22273a82 (+6 más) |
| `TIxHBC08VyQ5QVi6` | Comparation Pasarelas - Backend | /webhook/backend/peru, /webhook/backend/mexico, /webhook/backend/colombia (+1 más) |
| `Py4wuyC0sdwj7RPR` | conection_db_mv | /webhook/6189aa27-a24b-4e86-abe6-3bfa24edbc3a |
| `UHg9p4BGBHO36MSV` | Embajador Verde (Promotor de Calle) | /webhook/embajador-verde, /form/embajadorverde |
| `3fyLwVRBrgexCyOC` | Filtro de CVs Analista de MKT Performace | /webhook/asistentedemktperformance, /webhook/bc6e99a9-879f-482e-9527-b63110eb07a5, /form/asistentemarketingperformance |
| `kdp16nRANJMtrD1W` | Filtro de CVs CHEF EJECUTIVO LATAM | /webhook/ChefEjecutivo, /form/chefejecutivo |
| `E3C4BigACXzyzuSz` | Filtro de CVs Coordinador On Demand | /webhook/CoordOnDemand, /webhook/e90acc6c-cc0c-4715-8e33-7e22c80fddb6, /form/coord-ondemand |
| `W1wk2gHhfp52Tuh3` | Filtro de CVs Ejecutivo de Ventas Senior Lima | /webhook/EjecutivoSenior, /webhook/b0258721-3c1a-4ca0-a1e7-33128b392fef, /form/ventassenior |
| `lNgkjp3RLeccAQok` | Filtro de CVs LIDER DE OPERACIONES ON DEMAND | /webhook/headops, /webhook/0124d24f-9fbe-45d2-82d2-1affc9566a2d, /form/lideropsdemand |
| `nkZyzT9z9KhTee61` | Filtro de CVs LIDER DE TRADE | /webhook/trade, /webhook/5b388bcf-9c12-45aa-bbf6-c286ce0ffe06, /form/TRADEMARK |
| `OEJB3EXBJwRLWrqw` | My workflow 19 | /webhook/eca9fc82-ca04-4fc0-90d6-744ab253c95d, /webhook/dc70c47c-ee68-4b7d-b23a-c78fc1df5058, /webhook/50c7a558-ce7e-4cd4-8195-c0df94bd0464 (+1 más) |
| `1Pdbvx0JmFqdroKA` | My workflow 32 | /webhook/8fecafcb-ca71-45ce-b503-a6b58d53fbc8 |
| `Nq2Bz5xB6tCKIlSJ` | My workflow 43 | /webhook/imagenes365 |
| `LMjrZM1MOkPhopJO` | My workflow 6 | /webhook/chat-in |
| `VsARDDr6zQqfMiZm` | OC_WSP_DRIVE | /webhook/apichat-integration, /webhook/respuesta-discord |
| `QBwE9Q3viq0cSt57` | Proceso Onboarding | /webhook/Reparto, /webhook/BACKED-REPARTIDORES |
| `Qd8u6yh1ocACwojB` | Proceso Selección | /webhook/webhook-candidatos, /webhook/VacantesMV |
| `FXTIJEM3XSk4D6AE` | Project_Onb · B · Eventos en vivo (webhook ManyChat) | /webhook/manychat-route |
| `4g14aSPGtVfvGvqU` | Referidos | /webhook/34c80e5a-1d1b-403d-ab70-a33c6a38fb6b |
| `UJXBBdxfrYf407bH` | REGISTRO Y VENTAS TOTALES | /webhook/f0bb326f-86e5-4bbe-97fc-aa0ca7510099 |
| `uUb3Rnuw2bLZgpX4` | RESPUESTA DIRECCIONES | /webhook/direccionesventas |
| `LT3d0qxfiwmrK0Gv` | Send Email On Demand | /webhook/send-email-on-demand |
| `Wdc6MA6tPzDNr2Q3` | TEST MC FindByPhone | /webhook/mc-findphone |
| `QtXtjoNcDWHYBYjM` | validar_cobertura_geo | /webhook/eb28f0b2-c12c-4fa7-8f65-61f855dd21e8 |
| `HBtFFz0L5XRpjUUp` | Whatsapp order bot | /webhook/b9630b56-a061-42b3-bd69-75bb3f1c1bb0 |

## 🔑 Credenciales a crear en n8n2 ANTES de migrar

Crea estas credenciales en `https://n8n2.manzanaverde.la/credentials` con los nombres exactos (para facilitar el mapeo).

| Tipo | Nombre en n8n A | ID en A | Usado por (sample) |
|---|---|---|---|
| discordBotApi | Discord Bot CRS | `6UHwJBZ20k1JzCZ6` | MV - Issues a Discord |
| discordWebhookApi | Discord Webhook account 12 | `7rlE9uIy0EbCPgtg` | Caja chica |
| discordWebhookApi | Discord Webhook account 22 | `wF28ogKd8OgyVFjh` | MV - Registro oficina UTEC, MV - Recordatorio diario oficina UTEC |
| discordWebhookApi | Discord Webhook account 9 | `weJLho462jYzgSTj` | Mini Conta |
| gmailOAuth2 | Gmail account | `9aMJEFavBpG7JhGo` | Discord Bridge - Real-time |
| gmailOAuth2 | Gmail account 5 | `QHSdTJ8Nq4UW7fIj` | Notificación de Errores Global |
| googleDriveOAuth2Api | Google Drive account 12 | `RtxcKh9E1F64WFF7` | Caja chica |
| googleDriveOAuth2Api | Google Drive account 3 | `mG7T7dOY3l795aJO` | oc_intake_aprobaciones |
| googleDriveOAuth2Api | Google Drive account 5 | `q54h8AC4MlprvmOQ` | Mini Conta, Linkeado de egresos - BANAMEX (+1) |
| googlePalmApi | Google Gemini(PaLM) Api account 3 | `Dyou0eRCyB6Bjf4L` | Mini Conta, Linkeado de egresos - BANAMEX (+1) |
| googlePalmApi | Google Gemini(PaLM) Api account 4 | `HTqSQOGlpm3U1DxB` | Caja chica |
| googlePalmApi | Google Gemini(PaLM) Api account 6 | `zoNYiEMmQYvru4zF` | My workflow 23 |
| googleSheetsOAuth2Api | Google Sheets account 10 | `6F9a2ZBLIursJGRZ` | Linkeado de egresos - BANAMEX, Linkeado de egresos - MP MEXICO |
| googleSheetsOAuth2Api | Google Sheets account 18 | `Z1AUcdTGpKT7DTyL` | Wallet, MV - Registro oficina UTEC (+1) |
| googleSheetsOAuth2Api | Google Sheets account 20 | `jfCBhhqh7eivDAEh` | Chanchito Bot - Finanzas Familia |
| googleSheetsOAuth2Api | Google Sheets account 23 | `JjvuK7xK4bnlAfkj` | Caja chica |
| googleSheetsOAuth2Api | Google Sheets account 31 | `row9VuICtimZXQTz` | Lead Asesor Tracker |
| googleSheetsOAuth2Api | Google Sheets account 4 | `QEb2p5Wyr06WZiZa` | oc_intake_aprobaciones |
| googleSheetsTriggerOAuth2Api | Google Sheets Trigger account | `Vt1pxUtAxroGPfJY` | oc_intake_aprobaciones |
| httpHeaderAuth | Backend MV Token | `9Ev1wuR9zcOVaWqk` | Project_Onb · A · Cronograma matutino |
| httpHeaderAuth | ManyChat Token | `PU4wf7dIgtwScu7j` | Project_Onb · A · Cronograma matutino |
| httpHeaderAuth | Pruebas | `0BTbkTyT7hcOdkoF` | Wallet, Registro |
| httpHeaderAuth | Supabase Apikey | `gWDEvwFVMC9pgeiL` | Project_Onb · A · Cronograma matutino |
| httpHeaderAuth | Supabase Service Role | `2MtBT4bNR2m6NNkp` | Project_Onb · A · Cronograma matutino |
| mistralCloudApi | Mistral Cloud account 3 | `vY3Kywz8lJah2dWm` | Mini Conta, Linkeado de egresos - BANAMEX (+1) |
| mistralCloudApi | Mistral Cloud account 4 | `CzsclohuJ4aMQJ7O` | Caja chica |
| openAiApi | OpenAi account 5 | `yMuGyZPknvivZGpS` | oc_intake_aprobaciones |
| openAiApi | Primer Pedido Seguimiento | `tZPRyt9AN5iXl9s3` | Wallet, Registro |
| redis | Redis account | `1fmA2hXucBVKm50U` | Wallet, Registro |
| telegramApi | Telegram account 2 | `xG9g9LnumW6KrS5K` | Chanchito Bot - Finanzas Familia |

## ⚫ Workflows inactivos (candidatos a BORRAR — pendiente confirmación)

| ID | Nombre | Última act |
|---|---|---|
| `CQ7ENaFEWLgdCrGF` | Procesador de Boletas de Pago (Drive a Sheets) | 2026-05-27 |
| `3YLFYl7ZaYTQDuYa` | Filtro de CVs Ventas Senior Piura | 2026-05-22 |
| `HG6pbPJlqizU1nLP` | Project_Onb · 05 · Oferta a Apolos | 2026-05-21 |
| `h1C452ocyxfVQZrM` | Project_Onb · 04 · Cutoff 08:00 | 2026-05-21 |
| `L7THwyfLGnBskuce` | Project_Onb · 03 · Webhook ManyChat | 2026-05-21 |
| `qMPJplYWGwgnaRr4` | Project_Onb · 02 · Reintentos 06:45 y 07:30 | 2026-05-21 |
| `yuynauC00QoIDl6z` | Project_Onb · 01 · Envio inicial 06:00 | 2026-05-21 |
| `Fi2Me0vDrFwxZfk9` | My workflow 47 | 2026-05-13 |
| `M2wSweRu9a87if5b` | Consulta ejecución | 2026-04-21 |
| `GdzZADKYqGmPptcD` | Contenidos estáticos con IA para redes sociales | 2026-03-17 |
| `gW03oyfVCvFKpE5F` | Promociones Volantes | 2026-03-16 |
| `pzb4gJLb6GDI53rl` | Meta rc | 2026-03-10 |
| `NQOuCM9cLcmjnxqr` | My workflow 46 | 2026-03-05 |
| `Y4WSWr6nAByk7lLk` | My workflow 45 | 2026-03-03 |
| `bTYmhGPtnhJC2906` | My workflow 44 | 2026-03-03 |
| `FBsmSD5kpmpPnaUS` | Registro Promoción | 2026-03-03 |
| `HLzb8441NPgcq2yX` | manychat-contacts | 2026-02-20 |
| `P2qvJQY0YlQ1dtRp` | Finanzas_Manzana Verde | 2026-02-16 |
| `nCNNQYei1rCmyri7` | mercadopago | 2026-02-13 |
| `9JYbulDDfMUvtSCb` | My workflow 32 | 2026-02-03 |
| `iDjILqAjlCYZqHZt` | FUENTE 2.0 REGISTROS Y VENTAS | 2026-01-30 |
| `dhIDmGn7k16X8nB6` | BOT PEDIDOS Wsp | 2026-01-16 |
| `sUzubrGWObPemuQH` | Planeación Estratégica de Contenidos + producción audiovisual para redes | 2026-01-04 |
| `sptNeSTH4r50KNwJ` | checklist automatico con google ia | 2026-01-03 |
| `ceAZTGZUiDVt7Lag` | My workflow 42 | 2026-01-02 |
| `PFzg1sDzyI1FcDqj` | Contenidos para stakeholders | 2026-01-01 |
| `Moy6WdSB25dhekbI` | My workflow 31 | 2025-12-31 |
| `dUhvEsoqkC5RPr0W` | Stakeholders | 2025-12-30 |
| `IlSwrJqtbOB9L0QB` | Análisis y Selección de Influencers / Marcas | 2025-12-30 |
| `eZcH2Ewf6Cu3niAR` | My workflow 41 | 2025-12-30 |
| `7Bfyk8rqloyJu9pZ` | MCP MP | 2025-12-29 |
| `9wBU8gBZ9Gc6ZusT` | Agente ATC BETA | 2025-12-26 |
| `vLrigp2Zib4cpyIn` | Filtro de CVs Analista de MKT | 2025-12-24 |
| `qtmxgM8bWVEN4lxj` | My workflow 40 | 2025-12-23 |
| `9yCFtaoegjL28UbF` | My workflow 39 | 2025-12-22 |
| `kbAiIrQt5ZRHImk9` | DASHBORD REPARTIDORES | 2025-12-22 |
| `WHtQGTgPgMe1zhov` | CHECKLIST AUTOMATICO (V2 FINAL) | 2025-12-20 |
| `f8pHY7hDQWZrCqoa` | My workflow 37 | 2025-12-18 |
| `TUuCjF4tfWUaB0QV` | My workflow 38 | 2025-12-18 |
| `1BtHG97jaNxVOF3u` | 💥 Generate AI viral videos with NanoBanana & VEO3, shared on socials via Blotato - vide | 2025-12-17 |
| `rKMwKGuBsXvKnfbe` | My workflow 35 | 2025-12-13 |
| `fJGNsM5q4qcD5fAF` | Agente de Calidad Culinaria (AI Feedback Loop) | 2025-12-13 |
| `YUZ28Kql6kFCVIy9` | MV_Incentivo_Frecuencia_Campanas | 2025-12-13 |
| `o7bQX5l6og8DrVdf` | Precantidades Franquicia | 2025-12-13 |
| `ISMnhyg3QV651Hkq` | gestionar_cliente_bbdd | 2025-12-13 |
| `jWS6p2fgMxMEDOby` | My workflow 36 | 2025-12-13 |
| `2C9s6NCdGq5ulSJC` | My workflow 34 | 2025-12-13 |
| `Ak2j1jH5yMfXiEWS` | My workflow 33 | 2025-12-13 |
| `XLnEw47vxWh5ho9E` | Demo: My first AI Agent in n8n 6 | 2025-12-13 |
| `Qk7HOd3QYApr6niZ` | Workflow - Requerimientos y Pedidos | 2025-12-13 |
| `uj9KnUxeXKcG54Sm` | Agente de Calidad Culinaria (AI Feedback Loop) | 2025-12-13 |
| `43KKoVSzDPjMPqYv` | Agente de Calidad Culinaria (AI Feedback Loop) | 2025-12-13 |
| `MK8xyUqdGz7OmtWk` | My workflow 31 | 2025-12-13 |
| `JSJsM5ZYjpclVO7O` | Calcular Mise en Place y Generar PDF | 2025-12-13 |
| `E1tklAx2bXvkIlKT` | TEST - Manual Trigger + Set | 2025-12-08 |
| `G20vNMLDrFEzyEJC` | internal-asistant-platzi | 2025-12-08 |
| `0TWBaLypXrUx2Z4m` | Automatic Route Bot | 2025-12-02 |
| `9ynitZgjvTLUACic` | My workflow 28 | 2025-11-26 |
| `6zSd7HZphUyp4kQQ` | My workflow 27 | 2025-11-26 |
| `2g591KGW6fwqiRZs` | My workflow 25 | 2025-11-25 |
| `AiBbFiAM1zrcuEYL` | Filtro de CVs Ventas | 2025-11-20 |
| `g9NxoB4Uk7xUndQA` | My workflow 24 | 2025-11-19 |
| `JZGlEVjez8Js9hhh` | Reclamos email | 2025-11-19 |
| `ovWOOkZ0edG9Ezkr` | Reclamos email -> Sheets + respuesta automática | 2025-11-13 |
| `00KpgD5BsJ5WZxbN` | Pedido influencers/ugc DAILY | 2025-11-11 |
| `21jD5ujFAe9pFaDy` | CAC FACEBOOK | 2025-11-07 |
| `pgBgOCHceH495ETx` | Automatic Route Bot | 2025-11-03 |
| `ippZ4KlNrmn5Ue32` | Automatic Route Bot | 2025-11-01 |
| `io373ZcPwrCe6qkk` | Automatic Route Bot | 2025-10-31 |
| `rnbcKxIuJecqLyLF` | Ordenar Ruta con Google Directions | 2025-10-31 |
| `SPMwC8EI9ESnFFK9` | Proceso Selección S | 2025-10-31 |
| `zsCIteSSEWfWfXgi` | datos extra | 2025-10-30 |
| `ZQymm0XoWfDF2ogv` | asistente-interno-flujo-principal | 2025-10-23 |
| `mWRPyD3Dz5Y4l8ES` | My workflow 21 | 2025-10-22 |
| `DIEDfyJ9iSa7YsP8` | My workflow 1 | 2025-10-21 |
| `67sNJiELNEcH3RCr` | Agente: Reminder task "To-do"Notion | 2025-10-17 |
| `IK4N9Rl5JoHVERTa` | My workflow 20 | 2025-10-15 |
| `dplhXlZxbCg6qg9s` | Trebble Agent E2E | 2025-10-06 |
| `RzEc3q4RL6YRpOTQ` | DoneBot | 2025-10-03 |
| `dydjdGzGg646eNeF` | Linkeado de egresos - BCP | 2025-10-03 |
| `xL9XDzLFmC5wKcGP` | My workflow 18 | 2025-10-02 |
| `qkYcDhjbS5g1kJmO` | My workflow 17 | 2025-10-02 |
| `QoGEjRDKk4hELqAA` | Linkeado de egresos - BCP | 2025-10-01 |
| `UfJjCwawfrMdhq45` | My workflow 16 | 2025-10-01 |
| `tQEzyluemWwW1713` | Linkeado de egresos - BCP copy | 2025-10-01 |
| `g10YHgZ62eQgTl6A` | Demo: My first AI Agent in n8n 5 | 2025-10-01 |
| `P2zp6FqutwW3LTah` | WA · Trebble → Pedido + Cuenta + Deeplink (v1) | 2025-09-30 |
| `gAl4Gytammu1tTcz` | WHATSAPP VENTAS | 2025-09-30 |
| `8WtaVYMCONU1RVXn` | My workflow 15 | 2025-09-26 |
| `aLY2ajWQezoMn0G8` | My workflow 14 | 2025-09-25 |
| `moLUchOqWJWVAFdn` | Ale mi agente de reclamos | 2025-09-23 |
| `ai0jMxFpxX6TeE0U` | My workflow 9 | 2025-09-22 |
| `Hyo8xLzLefCnuBF9` | My workflow 11 | 2025-09-22 |
| `jO5veXS5FB27CcRP` | Clase 1 | 2025-09-22 |
| `SSDjEzrNW5dGhwIu` | n8n Jonathan Bernal 1 | 2025-09-20 |
| `yyn5lB7pSeFqdsDD` | Ale mi agente de reclamos copy | 2025-09-20 |
| `k7T7ybbaHbpzhVGq` | My workflow 10 | 2025-09-20 |
| `Ael8OvU6YeNsgrCX` | My workflow 8 | 2025-09-20 |
| `lP0JNgVahouignFO` | Demo: My first AI Agent in n8n 4 | 2025-09-19 |
| `u9LjOKItNGYBhr9x` | Nuevos flujos contables | 2025-09-19 |
| `PkE3Lo2OmvHUkHME` | Intake-OCs | 2025-09-19 |
| `XiKpu6TQ2LhMqFMW` | My workflow 7 | 2025-09-18 |
| `U5ZxHmUGmAB07V6f` | oc-conciliacion_bancaria | 2025-09-15 |
| `dk1ewdXjOeqwCICv` | oc_facturas_email | 2025-09-15 |
| `O2rzcTrAdasHucWu` | WhatsApp SellBot | 2025-07-22 |
| `tUWbi9JR3XWjC4L6` | TALK WITH DB | 2025-07-22 |
| `VZWOWzMvKe1flRls` | Generar videos con IA | 2025-07-22 |
| `xyvvy6HxjT8z4tG4` | Invoice Processor & Validator with OCR, AI & Google Sheets | 2025-07-22 |
| `KRchvMRB1ITTlrlt` | Final Experiment | 2025-07-22 |
| `oIabpizit73WpN2J` | Extract Invoice Data from Google Drive to Sheets with Mistral OCR and Gemini | 2025-07-22 |
| `ed1hZqWWBE0ay40g` | Nightly Discord Channel Cleanup | 2025-07-17 |
| `iEo5qyu95x1KUBvU` | Generate AI Videos with Google Veo3, Save to Google Drive and Upload to YouTube | 2025-07-17 |
| `63fFfWuQ6tJ0upGM` | My workflow 5 | 2025-07-16 |
| `RbzFz4tGdI00g76i` | My workflow 4 | 2025-07-13 |
| `NwLdQPevlfCK9zEN` | Demo: My first AI Agent in n8n 3 | 2025-07-10 |
| `ad2P9DcQeocqresO` | Coneccion BBDD MV 2025 | 2025-07-09 |
| `7KpUbXT6XIFG98BG` | My workflow 3 | 2025-07-09 |
| `IkvMM0beLpMxuuyo` | Demo: My first AI Agent in n8n 2 | 2025-07-04 |
| `2Y7sENQtjae4sQ8c` | My workflow 2 | 2025-07-01 |
| `Zr70YhEynDcXnZsc` | Demo: My first AI Agent in n8n | 2025-06-25 |