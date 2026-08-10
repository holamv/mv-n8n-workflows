# Handoff — Construir motor de Conciliación (Cristhian)

> Objetivo: terminar el flujo de **conciliación bancaria / pagos↔OC** en n8n. Los backups restaurados son **esqueletos vacíos** (wiring y nombres de nodos OK, pero los nodos de código están SIN lógica). Hay que escribir el código.

---

## 1. Qué hay restaurado (instancia A = `n8n.manzanaverde.la`)

| Workflow | ID | Estado |
|---|---|---|
| **Nuevos flujos contables [RESTORED]** | `8MyFRXK1p4dU8kEZ` | **Usar este de base.** Tiene wiring + sheets + webhooks, pero code nodes vacíos |
| oc-conciliacion_bancaria [RESTORED] | `Cl59VyEagm95x7u9` | Stub total (todo vacío). Ignorar o borrar |

Ambos **inactivos**. No actives hasta terminar + probar.

### Estado real de "Nuevos flujos contables"
- ✅ Conexiones OK, ✅ apunta al Google Sheet de finanzas, ✅ webhooks approve/reject
- ❌ Code nodes VACÍOS: `Normalize TX`, `Conciliation Engine`, `Process Approval`
- ❌ Ops de Sheets cruzadas (hay un `Read` con operación `appendOrUpdate` y un `Append` con `read` — corregir)
- ❌ Discord URL = `https://discord.com/api/webhooks/YOUR_WEBHOOK` (placeholder → poner el real de finanzas)

### Google Sheet (ya referenciado en los nodos)
- **documentId:** `1r2QS7aMs3fQdn8js7-Z0-8nfvAhQZe0nBqhvUS3FSEc`
- **tabs (gid):** OC_Master `2006605352` · Transacciones `1674475558` · Conciliaciones `282578698` · OC_Events `881547798`
- **credencial Sheets:** `Google Sheets account 4` (id `QEb2p5Wyr06WZiZa`) — ya enlazada / reutilizable

---

## 2. Qué construir

1. **Normalize TX** (code): limpiar transacciones leídas (montos a número, fecha, referencia, proveedor).
2. **Conciliation Engine** (code): matchear cada transacción (pago) contra OC_Master. Definir REGLA: por monto exacto, o monto+proveedor, o referencia, con/ sin tolerancia. Output: conciliados (append a Conciliaciones) + marcar OC pagada.
3. **Process Approval** (code): manejar approve/reject de los webhooks → escribir a OC_Events.
4. Corregir operaciones de los nodos Sheets (Read = `read`, Append = `append`).
5. Poner el webhook real de Discord finanzas.

> Las columnas exactas de cada tab y la regla de match las defines tú con el equipo de finanzas (esa info no la tenemos acá).

---

## 3. API de n8n — cómo conectarte

**Base URL:** `https://n8n.manzanaverde.la/api/v1`
**Auth:** header `X-N8N-API-KEY: <TU_API_KEY>`

### Conseguir TU API key (usa la tuya, no compartas)
n8n → **Settings → n8n API → Create an API Key** → copia el valor.

### Endpoints clave
```
GET  /workflows/{id}                 # traer definición (nodes, connections)
PUT  /workflows/{id}                 # actualizar. Body: {name, nodes, connections, settings:{executionOrder:"v1"}}
GET  /executions?workflowId={id}&limit=20&includeData=true   # revisar corridas
POST /executions/{id}/retry          # reintentar una
```
⚠️ El `PUT` **reemplaza todo el workflow** → SIEMPRE haz `GET` fresco primero, modifica, y manda el objeto completo. No mandes parcial.

### Ejemplo curl
```bash
KEY="TU_API_KEY"
# traer
curl -s -H "X-N8N-API-KEY: $KEY" \
  "https://n8n.manzanaverde.la/api/v1/workflows/8MyFRXK1p4dU8kEZ" -o wf.json
# (editar wf.json: poner jsCode en los nodos code, arreglar ops, discord url)
# actualizar (payload solo {name,nodes,connections,settings})
curl -s -X PUT -H "X-N8N-API-KEY: $KEY" -H "Content-Type: application/json" \
  -d @payload.json "https://n8n.manzanaverde.la/api/v1/workflows/8MyFRXK1p4dU8kEZ"
```

---

## 4. Cómo usarlo desde Claude Code

1. Abre Claude Code en esta carpeta (`c:\Proyectos\n8n`).
2. Dale a Claude este archivo como contexto: *"Lee HANDOFF_Cristhian_Conciliacion.md y ayúdame a construir el Conciliation Engine en el workflow 8MyFRXK1p4dU8kEZ"*.
3. Hay **n8n MCP** configurado (`.mcp.json`) — Claude puede usar `search_nodes`, `get_node_types`, `validate_workflow` para armar los nodos bien. Pídele que valide antes de hacer PUT.
4. Para el código de los nodos: dale a Claude las **columnas de los tabs** y la **regla de match**; él escribe el `jsCode` del Conciliation Engine + Normalize + Process Approval.
5. Probar: deja el workflow inactivo, usa "Execute workflow" en la UI o `POST /executions/{id}/retry` sobre una corrida, revisa output nodo por nodo. Activa solo cuando el match salga correcto.

### Notas técnicas n8n
- Code node (v2): `mode: runOnceForAllItems`, accede `$input.all()` / `items`, `return [{json:{...}}]`.
- Sheets v5: `documentId` y `sheetName` son resourceLocator `{__rl:true, mode:'id', value:'...'}`. El tab por gid: `sheetName.value = 'gid=2006605352'` o el id numérico.
- Para llamar la API de n8n DESDE un Code node (si hiciera falta): `await this.helpers.httpRequest({...})`.

---

## 5. Seguridad
- Usa **tu propia** API key; no la pegues en archivos que se suban a git ni en nodos del workflow.
- El webhook de Discord y cualquier token van en **credenciales** de n8n, no hardcodeados.
