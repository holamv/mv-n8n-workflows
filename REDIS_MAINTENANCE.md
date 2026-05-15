# Redis Maintenance — TTL preventivo

## Estado (snapshot 2026-05-15)

- **Redis Cloud**: `database-MJAD4Z1C` @ `redis-16865.c8.us-east-1-4.ec2.cloud.redislabs.com:16865`
- **Credencial en n8n**: id `1fmA2hXucBVKm50U` "Redis account"
- **Limitación crítica**: el Code node de n8n corre en un sandbox (`task-runner-javascript`) que **prohíbe `require('ioredis')`**. Por eso no se puede hacer mantenimiento Redis automático desde un workflow n8n sin tocar la config del servidor (env var `NODE_FUNCTION_ALLOW_EXTERNAL=ioredis`).

## Lo que ya está hecho

1. **Cleanup one-shot 2026-05-15** (`redis_cleanup.js`):
   - 23.15 MB → 8.25 MB (-65%)
   - 16.693 keys → 3.883 keys (-77%)
   - Borró 84 keys de test viejos + 12.733 conversaciones idle ≥ 7d

2. **TTL aplicado a TODAS las keys existentes** (`redis_apply_ttl.js`):
   - `user:*` → 14 días
   - `intencion_*` → 14 días
   - `Datos_*` → 30 días
   - `tpl_primer_pedido_*` → 30 días (la mayoría ya tenían)
   - `consulta_dedup_*` → 1 hora (ya tenían)
   - Numéricos (`<id_many>` listas dedup) → 14 días

3. **TTL nativo en nodos del workflow ATC** que ya lo soportan:
   - `Set Cooldown` → 3s ✅
   - `Set Asesor Mode` → 4h ✅
   - `Set Consulta Dedup` / `(1h)` → 24h / 1h ✅
   - `Set Recarga Lock` → 2h ✅
   - `Redis - MARK` (procesado_*) → 60s ✅

## El problema pendiente

Los nodos n8n Redis v1 con `operation: push` (LPUSH) **NO soportan TTL nativamente**. Hay 8 nodos en el workflow ATC que pushean sin TTL:

| Nodo | Key que escribe |
|---|---|
| `Redis` | `<subscriber_id>` (lista mensajes recientes) |
| `Redis4/6/7/8` | `<user_key>` (memoria LangChain por agente) |
| `Intencion` (tool) | `intencion_<phone>` |
| `Datos` (tool) | `Datos_<phone>` |
| `Email Push` | `<phone>` (email captura) |

Estas keys nacen sin TTL. La limpieza one-shot las TTLea, pero las nuevas siguen sin TTL.

## Mantenimiento recurrente — opciones

### Opción A — Manual (más simple)

Cada 1-2 semanas, correr:

```bash
cd c:/Proyectos/n8n
node redis_apply_ttl.js
```

Es idempotente — keys que ya tienen TTL las salta. Tarda ~5s.

### Opción B — Windows Task Scheduler (automático local)

```powershell
# Como administrador, en PowerShell:
schtasks /Create /SC WEEKLY /D SUN /ST 04:00 /TN "Redis TTL Maintenance" `
  /TR "node.exe c:\Proyectos\n8n\redis_apply_ttl.js >> c:\Proyectos\n8n\logs\redis_ttl.log 2>&1"
```

Verifica con `schtasks /Query /TN "Redis TTL Maintenance"`.

### Opción C — Fix de raíz vía env var n8n (requiere acceso al server)

Pedirle al admin del n8n server que añada al env:

```bash
NODE_FUNCTION_ALLOW_EXTERNAL=ioredis
```

y reinicie el servicio. Después podemos crear un workflow nativo n8n con Schedule Trigger + Code node que use ioredis. Es la solución más limpia pero requiere coordinación.

### Opción D — Modificar workflow ATC para añadir TTL post-PUSH

Por cada uno de los 8 nodos PUSH, añadir un nodo Redis encadenado con operation `set` que... espera, no funciona, `set` sobrescribe el valor.

Realmente la única forma nativa n8n sin requerir ioredis externo es la opción C.

## Credenciales (sensibles)

```
REDIS_HOST=redis-16865.c8.us-east-1-4.ec2.cloud.redislabs.com
REDIS_PORT=16865
REDIS_PASSWORD=SxA1vwSf8NvuKXknACJmEuk1ZiCjJVic
REDIS_TLS=false
```

Embebidas en `redis_cleanup.js`, `redis_apply_ttl.js`, `redis_scan_dryrun.js`. Si rotás la pwd, actualizar los 3 archivos.

## Diagnóstico rápido

```bash
node redis_scan_dryrun.js   # Reporta: dbsize, memory, prefix counts, TTL/idle distribution
```
