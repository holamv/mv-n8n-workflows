# Manual de Workflows — Manzana Verde n8n

> Versión 1.0 · Mantenido por `julio@manzanaverde.la` · Privado

Este manual cubre los 5 workflows productivos que operan la conversación con el cliente: desde que aparece como lead hasta que reconsume.

---

## Índice

1. [¿Qué es esto y para qué sirve?](#1-qué-es-esto-y-para-qué-sirve)
2. [Agente ATC](#2-agente-atc-el-corazón)
3. [Discord Bridge](#3-discord-bridge)
4. [PCL — Primer Contacto Leads](#4-pcl--primer-contacto-leads)
5. [PCP — Contacto Primer Pedido](#5-pcp--contacto-primer-pedido)
6. [Seguimiento 14 días](#6-seguimiento-14-días)
7. [Cómo pedir cambios](#7-cómo-pedir-cambios)
8. [Cómo medir estabilidad](#8-cómo-medir-estabilidad)
9. [Glosario](#9-glosario)

---

## 1. ¿Qué es esto y para qué sirve?

Esta es la plataforma de **automatización conversacional de Manzana Verde**. Vive en `n8n.manzanaverde.la` y maneja todo lo que pasa con un cliente desde que aparece como lead hasta que reconsume.

**4 productos distintos** corriendo en paralelo:

| Producto | Para qué sirve | Workflow ID |
|---|---|---|
| 🤖 **Agente ATC** | Bot WhatsApp que atiende ventas, soporte y reconsumos en PE/CO/MX | `R81I6h5KWtyNaDAy` |
| 🌉 **Discord Bridge** | Lee leads que llegan a Discord cada 3 min y los empuja a PCL | `VwG3AgtdDDdjC7xc` |
| 📩 **PCL — Primer Contacto Leads** | Manda plantilla de bienvenida cuando un lead se registra | `9MxNM5byLghh9ky2` |
| 📦 **PCP — Contacto Primer Pedido** | Saluda al cliente después de su primer pedido | `s37SLqGFljbf08Js` |
| ⏰ **Seguimiento 14d** | Re-engagement de clientes inactivos (4 sub-flujos) | `FS68xVacNF1DN9cd` |

**Stack**: n8n self-hosted + OpenAI (gpt-4.1-mini, gpt-5-mini) + ManyChat + Redis + Discord + Google Sheets.

---

## 2. Agente ATC (el corazón)

### Qué hace

Recibe cada mensaje de WhatsApp (vía ManyChat → webhook), decide en qué "carril" está el cliente (Ventas / ATC / Reconsumos), llama al agente correspondiente y manda la respuesta.

**Webhook**: `/webhook/be54a501-5cad-4d1f-b835-70ba8c6c0a9c`

### Pipeline en 1 vistazo

```
WhatsApp → filtros país (PE/CO/MX) → dedup (Redis 60s + Wait 30s) →
IA INTENCIÓN → Switch carril →
  ├─ Ventas (gpt-5-mini)  → Tool Calculadora / Procesador Pagos
  ├─ ATC (gpt-4.1-mini)   → respuesta soporte
  └─ Reconsumos (gpt-5-mini) → Recarga lock + Wallet
→ Send to ManyChat
```

### Reglas críticas del negocio (que NO se pueden romper)

- **Plan Inicio NO incluye delivery gratis ilimitado** — siempre aclararlo en confirmación (PASO D).
- **Horario único de pedido**: 9 pm del día anterior (PE/CO/MX). Prohibido inventar "5 pm cutoff".
- **Cobertura PE**: Lima Metropolitana + Callao + Piura (delivery). NO decir "solo Lima".
- **CO/MX = 100% delivery** — prohibido mencionar locales (Miraflores, etc.).
- **Pedido mínimo PE**: S/24.90 tienda / S/30.90 delivery. CO/MX sin mínimo declarado.
- **Anti-recarga duplicada**: 4 capas (PASO 0.3 app-previa, Recarga Lock 2h, codigo Sheets, transaction_id).
- **Anti-resaludo**: si el cliente ya recibió respuesta antes (`prevBot` lleno en Redis), prohibido abrir con "¡Hola, soy Eva!".
- **Cambio de número de teléfono**: NO es auto-gestión. Bot pide [actual]+[nuevo] y deriva a asesor.
- **Gramaje pieza cárnica** (no proteína): 800 kcal = 150 g, 600 kcal = 120 g, 400 kcal = 80 g. Nunca decir "X g de proteína".
- **Locales físicos Lima activos** (4): Miraflores, San Luis, Guardia Civil-Surco, Jesús María. **Encalada-Surco está cerrado** — NO mencionar.
- **Repartidor contacta al llegar** (deploy 2026-06-10): cuando el cliente pregunta si lo van a llamar/avisar al llegar, responder SÍ. El repartidor llama y/o escribe por WhatsApp y espera **hasta 5 min** como máximo. Prohibido decir "no tenemos esa opción".
- **Anti-resaludo reforzado** (deploy 2026-06-10): si `prevBot` tiene contenido, NUNCA abrir con "¡Hola! Soy Eva" — ni siquiera cuando el input del cliente es ambiguo/garbage/emojis ("^^", "..", "ok"). Pedir aclaración SIN saludo.

### Arquitectura de fallback (deploy 2026-05-04)

Si el agente principal de Intención o ATC muere, hay un clon "Fallback" con credencial `Bot Ventas` que toma el relevo.

**Limitación conocida**: ambas creds son de la **misma org de OpenAI** → comparten cuota TPM. El fallback rescata fallos puntuales, NO rate-limits sostenidos. Para protección real se necesita key de OTRA org (o Vercel AI Gateway).

### Reintentos en nodos compute-bound

| Tipo de nodo | Config |
|---|---|
| OpenAI Chat Model | `retryOnFail=true, maxTries=5, waitBetweenTries=20000ms` |
| Code nodes | `maxTries=3, waitBetweenTries=1500ms` |

> ⚠️ `retryOnFail` **NO rescata** errores de task runner saturado (`"Task request timed out"`). Eso requiere reiniciar el runner desde el server.

### Distribución credenciales OpenAI (snapshot 2026-05-04)

| Chat Model | Modelo | Credencial | Agente |
|---|---|---|---|
| Chat Model (sin sufijo) | gpt-4.1-mini | Crede Bot | IA INTENCIÓN |
| Chat Model1 | gpt-4.1-mini | Crede Bot | ATC |
| Chat Model2 | gpt-5-mini | Crede Bot | Reconsumos |
| Chat Model3 | gpt-5-mini | Bot Ventas | Ventas |
| Chat Model5 | gpt-4.1-mini | Crede Bot | Tool Calculadora |
| Chat Model6 | gpt-4.1-mini-2025-04-14 | Crede Bot | Tool Procesador Pagos |

`Crede Bot` soporta ~95% del tráfico. Si esa cred satura, impacta todo menos Ventas.

### Dedup pipeline

- **Redis MARK TTL 60s** — key `procesado_<subscriber>_<text50>`. Cubre repetidos idénticos.
- **Wait 30s** — mensajes con gap <27s se consolidan en una respuesta.
- **Set Cooldown TTL 3s** post-Wait.
- **Media bypass**: `is_media=true` salta el Wait via `If Skip Wait`.

---

## 3. Discord Bridge

### Qué hace

Cada 3 min, lee los últimos 100 mensajes de **8 canales de Discord** donde caen leads. Normaliza el teléfono y dispara el webhook de PCL Leads o Recovery.

### Lo que hay que saber

- Procesa hasta 500 mensajes por canal (paginación `before`) para recuperarse de outages.
- **Cursor inmediato**: el cursor por canal se actualiza dentro del mismo Code node (antes del POST). Antes se actualizaba al final → 2026-05-07 hubo bug de duplicación 65× cuando el server estaba lento (5.000+ execs PCL en 4h con solo 86 leads reales).
- No hay filtro de tiempo — solo cursor de IDs procesados. Eso permite catch-up total tras caída.
- **Wait nodes en PCL**: cada rama tiene `Wait` antes de `Primer Mensaje`. Default actual: **10 min** (cambiado de 15 el 2026-05-07).

### ⚠️ Saturación del task runner en hora pico Lima

Si ves errores `"task runner is currently down"` o `"Task request timed out after 60 seconds"`, **no es el código** — es saturación del task runner self-hosted. Los Code nodes no logran tomar slot en 60s.

- **Hora pico**: 9 AM–noon Lima y 3 PM–6 PM Lima.
- **Mover crons** a 7:30 AM o 7:30 PM (validado 2026-05-07).
- `retryOnFail` NO rescata este error (es de orquestación, no del código).

### Cómo resetear el cursor del Bridge

```js
// Agregar al inicio del Code node "Bridge Extract":
if (!sd.cursors_reset_FECHA) {
  sd.cursors = {};
  sd.cursors_reset_FECHA = true;
  sd.dedupCache = null;
}
```

Primera exec detecta flag → limpia cursors → bootstrappea con latest msg id de cada canal → 0 leads procesados. Iteración siguiente solo procesa nuevos.

---

## 4. PCL — Primer Contacto Leads

### Qué hace

Cuando un lead nuevo se registra (vía Discord Bridge o webhook directo), crea el subscriber en ManyChat y le manda la plantilla de bienvenida.

- 33 nodos · 2 ramas (Recovery + AI Agent paths).

### Patrón compartido (también aplica a PCP y Seguimiento 14d)

```
AI normalize phone → createSubscriber (siempre) → If error →
  findBySystemField (post-fix 2026-04-24) → CID Set → sendFlow
```

### Bug histórico que NO debe regresar

- **53/400 execs failed con `subscriber_id cannot be blank`** (pre 2026-04-24). Causa: `createSubscriber` ignora `custom_fields` → `findByCustomField` legacy retornaba `[]`.
- **Fix B (2026-04-24)**: usar `findBySystemField?phone=+<digits>` con phone limpio (`phone.replace(/\D/g,'')`). CID expression cambió de `data?.[0]?.id` (array) → `data?.id` (object).
- **Edge case sin fix**: usuarios CO con `phone:null` en ManyChat (ej. Daniela `+573185217556`) siguen fallando — mismo nivel de cobertura que antes.

### Credenciales ManyChat en n8n

| ID | Nombre | Usado por |
|---|---|---|
| `4H6yak6hmKmpq8UF` | API KEY MANYCHAT | `Obtener ID*`, `Obtener Suscriber*`, `Primer Mensaje*` |
| `1eKxy1CYVOxeopAP` | Token Backend | `Info Ventas*` |
| `1fmA2hXucBVKm50U` | Redis account | dedup tpl_primer_pedido |
| `tZPRyt9AN5iXl9s3` | Primer Pedido Seguimiento | OpenAI para AI Agent nodes |

---

## 5. PCP — Contacto Primer Pedido

### Qué hace

Se dispara después del primer pedido. Webhook recibe:

```json
{"nombres":"...","celular":"...","pais":"Peru|Colombia|Mexico","tipo_de_pedido":"diario|foodcourt"}
```

Manda plantilla "primer pedido" diferenciando por tipo.

- 16 nodos · rama lineal (sin Switch).
- Wait entre `Savemsj1` y `Primer Mensaje1` (~3h gap típico, gated por `$now.hour > 19`).

### Dedup compartido con Seguimiento 14d

Comparten Redis key `tpl_primer_pedido_<phone_sin_pais>` (TTL 7d, key `1fmA2hXucBVKm50U`).

```
Datos → Check Tpl Primer Pedido (GET) → If Tpl Already Sent
   ├─ true (key existe) → No Op Tpl Already Sent (STOP)
   └─ false (key vacío) → AI Agent → ... → Primer Mensaje → Set Tpl Primer Pedido (SET ttl 604800s)
```

El primero que envía gana; el segundo workflow encuentra el lock y skip.

**Caso origen**: Ubaldo Eduardo (29/abr) recibió 2 surveys de "primer pedido" en 3h porque el backend MV mandó simultáneamente a ambos workflows.

---

## 6. Seguimiento 14 días

Re-engagement workflow. **Dos webhook entry points** ambos cableados al mismo Switch:
- `/webhook/1a176766-3314-43e7-874d-13fbbd68e78a` ("Seguimiento")
- `/webhook/699e7b91-0070-40d6-93ef-26fcf03b5baf` ("Webhook" — fix 2026-04-24, antes orphan/dead-end)

Switch rutea por `body.Condición` en 4 ramas:

| Condición | Branch entry | flow_ns | Notas |
|---|---|---|---|
| `sin pedir` | Datos → AI Agent1 | `content20260313144726_469632` | con Wait gated por `$now.hour > 19` |
| `4to pedido` | Datos1 → AI Agent | `content20260313150954_841395` | con Wait |
| `primer pedido` | Datos2 → AI Agent2 | `content20260401185724_087344` | con Wait + dedup compartido con PCP |
| `motivar carga` (added 2026-04-24) | Datos3 → AI Agent3 → Switch3 país | PE `_968245` / CO `_557608` / MX `_451611` | **sin Wait** — envía directo |

---

## 7. Cómo pedir cambios

### Qué SÍ se puede pedir sin riesgo

- Ajustes de wording en prompts de Ventas / ATC / Reconsumos.
- Nuevos triggers / keywords (ej. "agregar 'reembolso' a ATC").
- Cambios de precios en Google Sheet (el bot lee de ahí, no requiere deploy).
- Agregar ejemplos a un anti-pattern (ej. "este cliente recibió respuesta mala, agrégalo a casos precedentes").
- Modificar TTLs de Redis (cooldowns, dedup).

### Qué requiere planificación

- Cambiar la arquitectura del fallback IA (necesita cred de **otra org** OpenAI o Vercel AI Gateway).
- Mover crons fuera de hora pico Lima.
- Cambios en Tools (Calculadora, Procesador Pagos) — pueden romper las ventas si fallan.
- Cambios en dedup pipeline — afectan a TODOS los mensajes.

### Qué NO se puede hacer (limitaciones reales)

- **Atomic SET-NX en redisTool** (versión 1) → siempre habrá una ventana de race-condition microscópica en recargas.
- **Cancelar webhooks ya disparados** vía Public API.
- **Hot-reload de MCPs** — requiere reiniciar Claude Code tras cambiar tokens.
- **Retry NO rescata task runner timeouts** — el error es de orquestación, no del código.
- **`status=new` en exec listing es engañoso** — lista execs ya finished. NO usar para detectar zombies.
- **ManyChat "Pausa inteligente" intercepta mensajes** (descubierto 2026-06-10, caso Sabrina `+51952521137`):
  Cuando un agente humano interviene en ManyChat, se activa una "Pausa inteligente" que detiene las automatizaciones por una ventana de tiempo. Los mensajes que el cliente envía durante la pausa NO escalan al webhook de n8n. Cuando la pausa termina, ManyChat dispara solo el "Whatsapp Default Reply" (welcome menu con botones) ignorando lo que el cliente había escrito. Resultado: el bot parece "ignorar" un mensaje legítimo de retorno/reclamo/etc.
  
  **Cómo detectarlo:** en Logs Bot no hay row para el phone en la fecha del mensaje (`lookup_phone +<phone>` retorna vacío o solo registros viejos).
  
  **Mitigación:**
  - Configurar ManyChat para que al terminar la pausa, re-encole el último mensaje del cliente al bot, no solo el Default Reply.
  - O entrenar a los agentes para responder manualmente todo mensaje recibido durante la pausa antes de cerrar.
  - El bot NO puede arreglar esto desde su lado — el webhook nunca se dispara.

### Proceso de deploy (8 pasos)

1. **Describir el caso** (idealmente con número, screenshot ManyChat, o id_many del cliente afectado).
2. **Auditar primero**: `lookup_phone.js +<phone>` o consultar Logs Bot → identificar la regresión.
3. **Plantear el cambio** con qué regla nueva añadir o qué prompt tocar.
4. **Backup**: el agente fetcha el workflow vivo y guarda `atc_backup_YYYYMMDD_*.json`.
5. **Deploy**: `PUT /workflows/{id}` con payload stripped: `{name, nodes, connections, settings: {executionOrder: 'v1'}}`.
6. **Verificar con `startedAt > deployTime`** — execs viejas resumed-from-Wait engañan (mantienen `startedAt` original).
7. **Monitor 30-60s post-deploy** con `monitor_new.js` o `verify_all.js`.
8. **Rollback**: PUT del backup si hay regresión.

### Reglas de oro (aprendidas a la mala)

- **Siempre fetch fresh antes de PUT** — nunca reusar JSON o prompts extraídos antes en la misma sesión (caso 2026-04-20: deploy con prompt stale erasó CIERRE OBLIGATORIO).
- **No tight-loop retry en webhook timeouts** — n8n puede seguir procesando server-side mientras el cliente cree que falló (caso 2026-04-24: 2 usuarios recibieron plantilla 4× cada uno).
- **HTTP node: `responseFormat: 'text'` → body en `out.data`**, `responseFormat: 'json'` → body en `out.body`. Confundirlos retorna silenciosamente vacío.
- **Strip non-digits del phone AI-normalizado**: `phone.replace(/\D/g,'')` antes de `findBySystemField`. AI a veces emite `"51 943317888"` con espacio.

---

## 8. Cómo medir estabilidad

### Métricas que importan (revisar diario)

| Métrica | Cómo se mide | Umbral rojo |
|---|---|---|
| **Tasa de error ATC** | `GET /executions?workflowId=R81I6h5KWtyNaDAy&status=error&limit=250` últimas 24h | > 2% del total |
| **Recargas duplicadas** | filtrar Logs Bot phone con ≥2 Wallet success en <30 min | > 0 |
| **Doble respuesta del bot** | buscar `prevBot` lleno + saludo nuevo en runData | > 0 |
| **PCL no enviados** | ratio Bridge:Discord debería ser **1:1** (4h ventana) | < 0.95 o > 1.1 |
| **Latencia clasificador** | tiempo entre webhook y `IA INTENCIÓN` resuelto | > 30s sostenido |
| **Saldo OpenAI** | dashboard OpenAI (manual) | < 1 día de buffer |
| **Tabla Logs Bot** | tamaño (cleanup semanal automático) | > 200k filas |

### Scripts de monitoreo (ver [scripts/SCRIPTS.md](../scripts/SCRIPTS.md))

```bash
node lookup_phone.js +51945570955    # Auditar conversación de un cliente
node audit_50.js                     # Últimas 50 execs ATC con anomalías
node compare_4h.js                   # Bridge vs Discord ratio (últimas 4h)
node verify_all.js                   # Health check post-deploy
node monitor_new.js                  # Stream de execs nuevas en vivo
node monitor_wallet_errors.js        # Errores de Tool_Procesador_Pagos
node cleanup_logsbot.js              # Mantenimiento semanal
node full_audit.js                   # Auditoría completa: prompts + sheet + execs
```

### Audit lookup por phone (proceso oficial)

Cuando llega un screenshot de ManyChat o un número de cliente:

1. **Extraer phone** del panel derecho de ManyChat (formato `+<código país><número>`).
2. **Consultar Data Table "Logs Bot"** (`tlpjIotQ29oY3D7N`):
   ```
   GET /api/v1/data-tables/tlpjIotQ29oY3D7N/rows?filter=<json>&sortBy=id:desc&limit=20
   filter: {"type":"and","filters":[{"columnName":"Phone","condition":"eq","value":"+<phone>"}]}
   ```
   El valor de Phone en la tabla **incluye `+`**.
3. **Para cada `Id_execution` retornado**, llamar `GET /api/v1/executions/{id}?includeData=true` y extraer:
   - `runData['WHATSAPP'][0].data.main[0][0].json` → `name`, `whatsapp_phone`, `last_input_text`, `body.id` (id_many)
   - `runData['IA INTENCIÓN CLIENTE'][0]...output` → intent
   - `runData['ATC' | 'Ventas' | 'Reconsumos'][0]...output` → respuesta del bot
   - `data.resultData.error` → si la exec falló

**Helper listo**: `node lookup_phone.js <phone> [limit=20]` hace todo el flujo.

> Si el phone no aparece en Logs Bot → el webhook nunca llegó a n8n (probable handoff a asesor desde ManyChat sin pasar por bot, o ventana fuera del retention de 7d).

### Señales rojas más comunes

- `"too many requests" / "insufficient_quota"` → saldo OpenAI o rate-limit. Aplicar replay protocol.
- `"task runner is currently down"` → saturación Lima business hours. Mover crons a 7:30 AM/PM.
- `"subscriber_id cannot be blank"` en PCL/PCP → regresión del fix B. Verificar `findBySystemField` con phone limpio.
- Ratio Bridge:Discord >1.1 → cursor stale del Bridge. Reset.
- Bot ATC dice "no tenemos la opción de que el repartidor te llame" → regresión, debe responder SÍ (llama/escribe/5 min).
- Doble saludo "¡Hola! Soy Eva" con `prevBot` lleno → regresión del refuerzo anti-resaludo (revisar input garbage como `"^^"`/emojis).
- Cliente pide retorno ("no pude bajar/recoger", "podría pedir el retorno") y el bot responde el welcome menu → mensaje no llegó al bot, ManyChat smart pause lo interceptó (no es bug del prompt).

### Replay protocol para outage windows

Cuando una causa conocida mata N execs en una ventana:

1. Listar errors via `GET /executions?status=error&workflowId=X`. Paginate, manejar 503 con exp-backoff.
2. Por exec: `GET /executions/{id}?includeData=true`, filtrar solo aquellas con `lastNodeExecuted` = nodo failing AND error matches signature ("too many requests", "insufficient_quota").
3. Extraer webhook body original del runData del entry node (ATC: `WHATSAPPP` triple P; PCL: `Leads`/`Recovery`).
4. **Dedupe**: keep latest failed message per phone.
5. (Opcional) skip phones con success exec posterior — ya atendidos por reintento orgánico.
6. POST al webhook URL con body original. Throttle escalado: 5s → 10s → 15s → 20s.
7. Identificar fails persistentes y reintentar.

> Validado 2026-05-04: 144/144 reprocesados en 4 pases.

---

## 9. Glosario

| Término | Significado |
|---|---|
| **Carril / Lane** | Estado conversacional: VENTAS_NUEVO, VENTAS_FÍSICAS, RECONSUMO, ATC, CONVERSACION |
| **prevBot / prevIntent** | Última respuesta y última intención guardadas en Redis por usuario |
| **Cortocircuito** | Lógica del clasificador que mantiene al usuario en su carril actual |
| **Dedup pipeline** | Redis MARK 60s → Wait 30s → Cooldown 3s. Evita doble respuesta. |
| **PASO B / PASO C / PASO D** | Fases del agente Ventas (presentar beneficios → planes → confirmación) |
| **Tool Calculadora** | Sub-agente que decide qué plan ofrecer según objetivo + frecuencia + país |
| **Tool Procesador Pagos** | Sub-agente que valida comprobante y dispara Wallet/recarga |
| **Logs Bot** | Data Table de n8n con phone → exec_id (clave para auditar) |
| **id_many** | ID interno de ManyChat del subscriber |
| **Recarga Lock** | Redis key TTL 2h que evita doble recarga vía bot+app |
| **NOMBRE_CLIENTE** | Variable inyectada en runtime por n8n a partir de `Info ATC.customer_info.name` |
| **fallback IA** | Clon de agente con cred secundaria, dispara si el primario muere |

---

_Última actualización: 2026-05-08_
