# Inventario migración n8n → n8n2

Total workflows: **174** · Se quedan: **5** · A mover (activos): **49** · Inactivos (candidatos a borrar): **120**

## 🟢 Se quedan en n8n.manzanaverde.la (ATC stack)

| Activo | ID | Nombre | Triggers | Webhooks/Forms |
|---|---|---|---|---|
| ON  | `R81I6h5KWtyNaDAy` | Agente ATC | webhook | e2bf7451-e407-4b6d-9d25-13359fbfc2ba, be54a501-5cad-4d1f-b835-70ba8c6c0a9c |
| ON  | `9MxNM5byLghh9ky2` | Primer Contacto Leads | webhook | 0fa4fe5c-a553-4b33-98d3-96b406572118, 48f220d5-0af8-4b6a-ae25-077d9f0c5d0a |
| ON  | `jWvc4pnMKMJJmypm` | Audit ATC - Resumen 12h email | cron, manual | - |
| ON  | `FS68xVacNF1DN9cd` | Seguimiento 14 días - Sin Pedir | webhook | 1a176766-3314-43e7-874d-13fbbd68e78a, 699e7b91-0070-40d6-93ef-26fcf03b5baf |
| ON  | `s37SLqGFljbf08Js` | Contacto Primer Pedido | webhook | a6ba5a8a-89a9-4ff3-ba7f-54a4dedd11e3 |

## 🟡 A mover a n8n2.manzanaverde.la (workflows activos)

| ID | Nombre | Triggers | Webhooks públicos | Creds | Invoca / Invocado por |
|---|---|---|---|---|---|
| `Hz9XSuYMA9jeamBs` | Administrador | webhook | webhook/9c569951-3d10-4df5-8462-2e49d82d1ac1, webhook/dniscanner44 | 3 | - |
| `v6qF8fZXuOigFYNC` | ASISTENTE INTERNO - CLASE IA | webhook | webhook/ASISTENTE-REPARTO | 0 | - |
| `7ngi7qZftTp9qzCv` | Base MV | webhook | webhook/bf45eb80-c488-437d-8abf-4700abf48b9a, webhook/e8bd1395-c776-484a-82cf-3d3a3d99492f, webhook/965b4856-a32c-4dac-b98f-57fc22273a82, webhook/840b7de2-3be5-4971-b874-16054f69882b, webhook/c05a7ad4-7bdc-4491-b28d-83a36ba594ff, webhook/765d5991-a708-41f0-8e71-90166359e963, webhook/b28d670c-9cd2-4327-b316-0fc18f87d2ea, webhook/7a1d1f9a-0229-433d-8dc6-c24e97bb8f66, webhook/8abb85df-35eb-4d24-b5a0-c9a7287f46e4 | 3 | - |
| `CpRFvTd4FHWBMPs1` | Caja chica |  | - | 5 | - |
| `2rVibJXQRaAvNvUS` | Chanchito Bot - Finanzas Familia |  | - | 2 | - |
| `TIxHBC08VyQ5QVi6` | Comparation Pasarelas - Backend | webhook | webhook/backend/peru, webhook/backend/mexico, webhook/backend/colombia, webhook/87632911-abc0-45cc-a140-a8826dba2f00 | 2 | - |
| `Py4wuyC0sdwj7RPR` | conection_db_mv | webhook | webhook/6189aa27-a24b-4e86-abe6-3bfa24edbc3a | 3 | - |
| `zMYV36UQHOAQcg2h` | Crear Dirección | executeWorkflowTrigger | - | 0 | - |
| `74K3pRrvutW2gwtX` | Crear Pedido | executeWorkflowTrigger | - | 2 | - |
| `VwG3AgtdDDdjC7xc` | Discord Bridge - Real-time | cron, manual | - | 1 | - |
| `CI0AVz4vdAumGmuj` | Discord Error Notifier | cron, manual | - | 0 | - |
| `UHg9p4BGBHO36MSV` | Embajador Verde (Promotor de Calle) | webhook, form | webhook/embajador-verde, form/embajadorverde | 3 | - |
| `3fyLwVRBrgexCyOC` | Filtro de CVs Analista de MKT Performace | webhook, form | webhook/asistentedemktperformance, webhook/bc6e99a9-879f-482e-9527-b63110eb07a5, form/asistentemarketingperformance | 4 | - |
| `kdp16nRANJMtrD1W` | Filtro de CVs CHEF EJECUTIVO LATAM | webhook, form | webhook/ChefEjecutivo, form/chefejecutivo | 4 | - |
| `E3C4BigACXzyzuSz` | Filtro de CVs Coordinador On Demand | webhook, form | webhook/CoordOnDemand, webhook/e90acc6c-cc0c-4715-8e33-7e22c80fddb6, form/coord-ondemand | 4 | - |
| `W1wk2gHhfp52Tuh3` | Filtro de CVs Ejecutivo de Ventas Senior Lima | webhook, form | webhook/EjecutivoSenior, webhook/b0258721-3c1a-4ca0-a1e7-33128b392fef, form/ventassenior | 4 | - |
| `lNgkjp3RLeccAQok` | Filtro de CVs LIDER DE OPERACIONES ON DEMAND | webhook, form | webhook/headops, webhook/0124d24f-9fbe-45d2-82d2-1affc9566a2d, form/lideropsdemand | 4 | - |
| `nkZyzT9z9KhTee61` | Filtro de CVs LIDER DE TRADE | webhook, form | webhook/trade, webhook/5b388bcf-9c12-45aa-bbf6-c286ce0ffe06, form/TRADEMARK | 4 | - |
| `QPZz35FbARQFm2dI` | Lead Asesor Tracker | cron | - | 1 | - |
| `leifQ3oEKi2Z3LRi` | Linkeado de egresos - BANAMEX |  | - | 4 | - |
| `svMhZIAnuLfaT3Jq` | Linkeado de egresos - MP MEXICO |  | - | 4 | - |
| `DYgdidLnn9lXL7Jr` | Mini Conta |  | - | 4 | - |
| `q9K38OEiEju9eazK` | MV - Issues a Discord | cron | - | 1 | - |
| `UpSjtOu04XUS9LJa` | MV - Recordatorio diario oficina UTEC | cron | - | 2 | - |
| `CdmDIaWhqkVSM8IS` | MV - Registro oficina UTEC | form | - | 2 | - |
| `OEJB3EXBJwRLWrqw` | My workflow 19 | webhook | webhook/eca9fc82-ca04-4fc0-90d6-744ab253c95d, webhook/dc70c47c-ee68-4b7d-b23a-c78fc1df5058, webhook/50c7a558-ce7e-4cd4-8195-c0df94bd0464, webhook/599aef00-535e-45be-9a30-f40062611452 | 6 | - |
| `Sq9xKd89ybWHMk8k` | My workflow 23 | executeWorkflowTrigger | - | 1 | - |
| `1Pdbvx0JmFqdroKA` | My workflow 32 | webhook | webhook/8fecafcb-ca71-45ce-b503-a6b58d53fbc8 | 1 | - |
| `Nq2Bz5xB6tCKIlSJ` | My workflow 43 | webhook | webhook/imagenes365 | 1 | - |
| `LMjrZM1MOkPhopJO` | My workflow 6 | webhook | webhook/chat-in | 1 | - |
| `ph0RiOaa7iCB4qsC` | Nota | executeWorkflowTrigger | - | 0 | - |
| `ZvjJbuSRpbvFfIUV` | Notificación de Errores Global |  | - | 1 | - |
| `2BqhLRHKtIgshEDy` | Obtener dirección | executeWorkflowTrigger | - | 0 | - |
| `2vJwqB2BWUrh60dr` | oc_intake_aprobaciones |  | - | 4 | - |
| `VsARDDr6zQqfMiZm` | OC_WSP_DRIVE | webhook | webhook/apichat-integration, webhook/respuesta-discord | 7 | - |
| `QBwE9Q3viq0cSt57` | Proceso Onboarding | webhook, form | webhook/Reparto, webhook/BACKED-REPARTIDORES | 2 | - |
| `Qd8u6yh1ocACwojB` | Proceso Selección | webhook | webhook/webhook-candidatos, webhook/VacantesMV | 3 | - |
| `ZMTrAWenbUwH1Yho` | Project_Onb · A · Cronograma matutino | cron | - | 4 | - |
| `FXTIJEM3XSk4D6AE` | Project_Onb · B · Eventos en vivo (webhook ManyChat) | webhook | webhook/manychat-route | 4 | - |
| `4g14aSPGtVfvGvqU` | Referidos | webhook | webhook/34c80e5a-1d1b-403d-ab70-a33c6a38fb6b | 2 | - |
| `OwHnfNmR2dz6vknj` | Registro | executeWorkflowTrigger | - | 3 | - |
| `UJXBBdxfrYf407bH` | REGISTRO Y VENTAS TOTALES | webhook | webhook/f0bb326f-86e5-4bbe-97fc-aa0ca7510099 | 1 | - |
| `uUb3Rnuw2bLZgpX4` | RESPUESTA DIRECCIONES | form, webhook | webhook/direccionesventas | 1 | - |
| `LT3d0qxfiwmrK0Gv` | Send Email On Demand | webhook | webhook/send-email-on-demand | 1 | - |
| `Wdc6MA6tPzDNr2Q3` | TEST MC FindByPhone | webhook | webhook/mc-findphone | 1 | - |
| `QtXtjoNcDWHYBYjM` | validar_cobertura_geo | webhook | webhook/eb28f0b2-c12c-4fa7-8f65-61f855dd21e8 | 1 | - |
| `Il7WWfAJCElkQx3d` | Wallet | executeWorkflowTrigger | - | 4 | - |
| `HBtFFz0L5XRpjUUp` | Whatsapp order bot | webhook | webhook/b9630b56-a061-42b3-bd69-75bb3f1c1bb0 | 6 | - |
| `cP9LAoExTd3Se4MP` | Zombie Cleanup Auto (semanal) | cron, manual | - | 0 | - |

## ⚫ Inactivos (candidatos a borrar en lugar de mover)

| ID | Nombre | Última actualización |
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

## 🔑 Credenciales a recrear en n8n2 (para workflows activos a mover)

| Tipo | ID en A | Nombre |
|---|---|---|
| discordBotApi | `6UHwJBZ20k1JzCZ6` | Discord Bot CRS |
| discordWebhookApi | `3cGUDDsiQTAN791V` | Comprobantes_cllanos |
| discordWebhookApi | `Hs47GyGeuTLdkmoO` | Discord Webhook account 10 |
| discordWebhookApi | `yMDoCoKwLcHpWCMZ` | Discord Webhook account 11 |
| discordWebhookApi | `7rlE9uIy0EbCPgtg` | Discord Webhook account 12 |
| discordWebhookApi | `LQzZKGGzhz6yqevr` | Discord Webhook account 13 |
| discordWebhookApi | `8C4c9zkAy1zzETIG` | Discord Webhook account 16 |
| discordWebhookApi | `wF28ogKd8OgyVFjh` | Discord Webhook account 22 |
| discordWebhookApi | `e94AOT23Ptgy3AdS` | Discord Webhook account 7 |
| discordWebhookApi | `weJLho462jYzgSTj` | Discord Webhook account 9 |
| gmailOAuth2 | `9aMJEFavBpG7JhGo` | Gmail account |
| gmailOAuth2 | `FUDuWTVZ0IixtwFG` | Gmail account 3 |
| gmailOAuth2 | `fM3R98Q5oqZyyN2B` | Gmail account 4 |
| gmailOAuth2 | `QHSdTJ8Nq4UW7fIj` | Gmail account 5 |
| gmailOAuth2 | `gjNceBB8GPMLOkkz` | Julio correo |
| googleApi | `6HxpBG8OcwBrviqU` | Google Vision_ cllanos |
| googleDriveOAuth2Api | `MFP81Ey3cgN9a4Om` | drive_ cllanos |
| googleDriveOAuth2Api | `tkF8TYX6HfYLGHAs` | Google Drive account 11 |
| googleDriveOAuth2Api | `RtxcKh9E1F64WFF7` | Google Drive account 12 |
| googleDriveOAuth2Api | `mG7T7dOY3l795aJO` | Google Drive account 3 |
| googleDriveOAuth2Api | `q54h8AC4MlprvmOQ` | Google Drive account 5 |
| googleDriveOAuth2Api | `ESEZlJr3FXFPddu9` | Google Drive account 8 |
| googleDriveOAuth2Api | `6tsQCgeC3OIELFo0` | Google Drive account 9 |
| googlePalmApi | `r3FYgr1M2SIKsleb` | Google Gemini(PaLM) Api account 2 |
| googlePalmApi | `Dyou0eRCyB6Bjf4L` | Google Gemini(PaLM) Api account 3 |
| googlePalmApi | `HTqSQOGlpm3U1DxB` | Google Gemini(PaLM) Api account 4 |
| googlePalmApi | `zoNYiEMmQYvru4zF` | Google Gemini(PaLM) Api account 6 |
| googlePalmApi | `RKmMKD30tOvXPEDa` | Google Gemini(PaLM) Api account 9 |
| googleSheetsOAuth2Api | `DrPbF21NRS9poRgL` | Cuentas_Carlos_MV |
| googleSheetsOAuth2Api | `6F9a2ZBLIursJGRZ` | Google Sheets account 10 |
| googleSheetsOAuth2Api | `Z1AUcdTGpKT7DTyL` | Google Sheets account 18 |
| googleSheetsOAuth2Api | `7PuxD5sxZ8llkfOd` | Google Sheets account 19 |
| googleSheetsOAuth2Api | `jfCBhhqh7eivDAEh` | Google Sheets account 20 |
| googleSheetsOAuth2Api | `ziRG8gmdbQfwGyrE` | Google Sheets account 22 |
| googleSheetsOAuth2Api | `JjvuK7xK4bnlAfkj` | Google Sheets account 23 |
| googleSheetsOAuth2Api | `j5loBO0eMfAZFJTS` | Google Sheets account 29 |
| googleSheetsOAuth2Api | `row9VuICtimZXQTz` | Google Sheets account 31 |
| googleSheetsOAuth2Api | `QEb2p5Wyr06WZiZa` | Google Sheets account 4 |
| googleSheetsTriggerOAuth2Api | `Vt1pxUtAxroGPfJY` | Google Sheets Trigger account |
| googleSheetsTriggerOAuth2Api | `DaE5BkxQqcejuwGx` | Google Sheets Trigger account 3 |
| httpBearerAuth | `P2oxqVIzBt0gge5y` | staging_user_app |
| httpBearerAuth | `lze3dzxOYlwZ5cI5` | token_app_peru |
| httpHeaderAuth | `4H6yak6hmKmpq8UF` | API KEY MANNYCHAT |
| httpHeaderAuth | `9Ev1wuR9zcOVaWqk` | Backend MV Token |
| httpHeaderAuth | `v7ABkaNGTEU5Pl2M` | Header Auth account 2 |
| httpHeaderAuth | `PU4wf7dIgtwScu7j` | ManyChat Token |
| httpHeaderAuth | `0BTbkTyT7hcOdkoF` | Pruebas |
| httpHeaderAuth | `gWDEvwFVMC9pgeiL` | Supabase Apikey |
| httpHeaderAuth | `2MtBT4bNR2m6NNkp` | Supabase Service Role |
| httpHeaderAuth | `6MnZA2D9iBP2h4gg` | X-N8N-API-Key |
| mistralCloudApi | `vY3Kywz8lJah2dWm` | Mistral Cloud account 3 |
| mistralCloudApi | `CzsclohuJ4aMQJ7O` | Mistral Cloud account 4 |
| mongoDb | `Dc7MUrVTDFX5xWeP` | MongoDB account |
| notionApi | `iaFqpwWqrilfifak` | Notion account |
| openAiApi | `pMhRyXs1mDWkuHrV` | OpenAi account 19 |
| openAiApi | `tZPRyt9AN5iXl9s3` | OpenAi account 21 |
| openAiApi | `yMuGyZPknvivZGpS` | OpenAi account 5 |
| openAiApi | `lSe61zwTQTqOI1F7` | OpenAi account 6 |
| openAiApi | `rCCjWX5CWq8BAyF5` | OpenAi MV PROD |
| openAiApi | `tZPRyt9AN5iXl9s3` | Primer Pedido Seguimiento |
| postgres | `Qnxj1mpVv9jwODm0` | Postgres account |
| postgres | `ROYCYatKGqVaLEa7` | Postgress Cllanos |
| redis | `1fmA2hXucBVKm50U` | Redis account |
| telegramApi | `WHRx67rvgWiBMRvm` | Telegram account |
| telegramApi | `xG9g9LnumW6KrS5K` | Telegram account 2 |
| telegramApi | `6EnNSAPiEOwjZTVX` | Telegram Cllanos |