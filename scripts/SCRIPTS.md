# Catálogo de scripts

> Estos scripts viven en la raíz del proyecto durante la fase de migración. **Todos los `.js` actualmente tienen la JWT de n8n hardcoded** — están en `.gitignore` hasta que se migren a `process.env.N8N_API_KEY` (commit follow-up).
>
> Para correrlos: setea las variables de `.env.example` (copiándolo a `.env`) y ejecuta con `node <script>`.

---

## 🔍 Auditoría / lookup

| Script | Para qué sirve | Uso típico |
|---|---|---|
| `lookup_phone.js` | Phone → Logs Bot → execs. Resume cada exec con msg + intent + agent + respuesta + errores. | `node lookup_phone.js +51945570955` |
| `full_audit.js` | Auditoría completa: prompts + Google Sheet + análisis de execuciones. | `node full_audit.js` |
| `audit_50.js` | Audita las últimas 50 execs ATC buscando anomalías. | `node audit_50.js` |
| `audit_code.js` | Audita el contenido del Code node (validación local sin task runner). | `node audit_code.js` |
| `run_audit_local.js` | Corre el código de Audit ATC localmente (3.7s, sin task runner). | `node run_audit_local.js` |

## 📊 Monitoreo

| Script | Para qué sirve |
|---|---|
| `monitor_new.js` | Stream de execs nuevas en vivo. |
| `monitor_reconsumos.js` | Stream específico de execs Reconsumos. |
| `monitor_wallet_errors.js` | Filtra errores del Tool_Procesador_Pagos / Wallet. |

## ✅ Verificación post-deploy

| Script | Para qué sirve |
|---|---|
| `verify_all.js` | Health check post-deploy completo. |
| `verify_5h.js` | Verifica execs en ventana de 5h post-deploy. |
| `verify_bridge_e2e.js` | Verifica end-to-end del Discord Bridge. |
| `verify_recovery_channels.js` | Verifica que la rama Recovery del PCL esté procesando. |
| `verify_missing_in_n8n.js` | Cruza phones esperados con phones realmente procesados. |

## 🌉 Bridge (Discord)

| Script | Para qué sirve |
|---|---|
| `bridge_extract.js` | Snapshot del nodo Bridge Extract. |
| `bridge_update_cursors.js` | Actualiza cursors del Bridge manualmente. |
| `fix_bridge_cursor.js` | Aplica el fix de cursor inmediato (deploy 2026-05-07). |
| `fix_bridge_robust.js` | Aplica fixes adicionales (limit 100, paginación, retry). |
| `reset_bridge_cursor.js` | Resetea cursors del Bridge. |
| `compare_4h.js` | Compara ratio Bridge:Discord en ventana 4h. |
| `compare_discord_vs_bridge.js` | Comparación detallada por canal. |

## 🚀 Deploys (históricos, mantener para rollback)

| Script | Cambio aplicado |
|---|---|
| `deploy_optimized_prompt.js` | Optimización del prompt IA INTENCIÓN (22k → 7k chars). |
| `deploy_fallback_credentials.js` | Setup del fallback con cred Bot Ventas. |
| `deploy_horario_pedido.js` | Regla "9 pm día anterior" universal (PE/CO/MX). |
| `deploy_landing_precheck.js` | Pre-check señales de plan antes de enviar landing $99. |
| `deploy_minimo_2490.js` | Pedido mínimo PE: S/24.90 tienda / S/30.90 delivery. |
| `deploy_saldo_framing.js` | Framing de saldo flexible (no entregas rígidas). |

## 🧹 Mantenimiento

| Script | Para qué sirve |
|---|---|
| `cleanup_logsbot.js` | Borra filas Logs Bot con `createdAt < 7d`. **Correr semanalmente.** |
| `cleanup_zombies.js` / `cleanup_zombies_v2.js` | (Cuidado) intentos de detectar execs colgadas. Ver caveat en MANUAL § "Qué NO se puede hacer". |
| `delete_queue.js` / `delete_queue_v2.js` | Limpieza de cola de webhook. |
| `hard_freeze_pcl.js` | Freeze de emergencia del PCL ante incidentes. |

## 🔁 Replay / recovery

| Script | Para qué sirve |
|---|---|
| `replay_last_hour.js` | Re-procesa execs failed en última hora. |
| `replay_missing_leads.js` | Re-procesa leads que el Bridge no logró enviar. |
| `retry_6_fails.js` | Retry específico de 6 fails históricos. |
| `trace_missing_phones.js` | Traza phones que llegaron a Discord pero no a ATC. |

## 🔧 Misc

| Script | Para qué sirve |
|---|---|
| `fetch_atc.js` / `fetch_current_workflow.js` / `fetch_wf.js` | Fetch del workflow vivo. |
| `list_workflows.js` | Lista todos los workflows del instance. |
| `inspect_pcl_primer_mensaje.js` | Inspecciona el nodo Primer Mensaje del PCL. |
| `diagnose_pcl_400.js` | Diagnostica errores 400 en PCL. |
| `optimize_all_prompts.js` | Helper de optimización masiva de prompts. |
| `test_manychat_flows.js` | Test de envío de plantillas ManyChat. |
| `test_manychat_subscriber.js` | Test de creación de subscriber en ManyChat. |
| `stress_test.js` | Tests de carga / scenarios. |

---

## Migración a env-based auth (TODO)

Patrón actual en cada script:
```js
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
```

Patrón objetivo:
```js
require('dotenv').config();
const KEY = process.env.N8N_API_KEY;
if (!KEY) throw new Error('Falta N8N_API_KEY en .env');
```

Una vez migrados, removerlos del `.gitignore` y mover a `scripts/`.
