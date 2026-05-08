# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the **n8n workflow development workspace** for Manzana Verde's conversational AI platform. It contains workflow definitions, AI agent prompts, and audit/verification scripts for the **Agente ATC** — a WhatsApp chatbot that handles sales, support, and re-consumption flows.

- **Live instance**: n8n.manzanaverde.la
- **Main workflow ID**: `R81I6h5KWtyNaDAy`
- **MCP server**: Configured in `.mcp.json` via supergateway (Streamable HTTP to n8n MCP endpoint)

## Architecture

### Workflow: Agente ATC (146 nodes)

The main workflow processes WhatsApp messages through this pipeline:

```
WHATSAPP (webhook) → If12 (promo filter) → wp → WHATSAPP → Pais (country switch)
  → [Perú/Colombia/México/Otro País] → PFinal → WHATSAPP1 (merge)
  → If (from_me filter) → Switch (text vs media)
      ├─ Text → Captura Texto → Code → dedup pipeline → IA INTENCIÓN → agents
      └─ Media (manybot-files S3 URL) → If8 (image vs audio)
            ├─ Image (.jpeg/.jpg/.png/.webp/.gif) → Etiqueta Pago → Imagen → Gemini → analysis
            └─ Audio → Capturar Audio → Transcribe Audio → Flag Audio → Code
```

After intent classification:
```
IA INTENCIÓN CLIENTE → Switch1
  ├─→ Ventas (sales agent) → Code in JavaScript → Redis8 → If6 (carta filter) → response
  ├─→ ATC (support agent) → Redis7 → response
  └─→ Reconsumos (re-consumption agent) → Redis6 → response
```

**Key concepts:**
- **Carriles (lanes)**: Messages are classified into `VENTAS_NUEVO`, `VENTAS_FÍSICAS`, `RECONSUMO`, or `ATC`. The classifier has "cortocircuito" (short-circuit) logic to keep users in their current lane.
- **Redis context**: Stores previous intent (`prevIntent`) and last bot response (`prevBot`) per user to maintain conversation state.
- **Dedup pipeline**: Redis PUSH → Wait(10s) → Redis GET → If1 (winner election). Media messages bypass Wait via `If Skip Wait` node using `is_media` flag.
- **If6 carta filter**: Detects keywords "carta de", "nuestra carta", "ejemplo del menú" to trigger menu image sending. Switch2 routes to country-specific carta with fallback to text response.
- **Tools**: `Tool_Calculadora_Planes` (plan calculator) and `Tool_Procesador_Pagos` (payment processor) are sub-tools available to the Ventas agent.
- **Multi-country**: Supports Peru (+51), Colombia (+57), Mexico (+52). Other countries fall through to "Otro País" node.

### File Organization

| Pattern | Purpose |
|---------|---------|
| `atc_workflow_optimized.json` | Current workflow (kept in sync with live) |
| `atc_payload.json` | Stripped payload for PUT deploy `{name, nodes, connections, settings}` |
| `atc_backup_*.json` | Date-stamped backups before changes |
| `full_audit.js` | Comprehensive 3-part audit (prompts + sheet + executions) |
| `audit_50.js` | Batch execution auditor for recent executions |
| `check_*.js` | Component-specific validation scripts |
| `verify_all.js` | Post-deployment verification |
| `monitor_new.js` | Live execution monitoring |
| `stress_test.js` | Load/scenario testing |
| `optimize_all_prompts.js` | Bulk prompt optimization helper |

**Note on prompts:** system prompts are no longer dumped to local `prompt_*.txt` files — they live in `atc_workflow_optimized.json` under each agent's `parameters.options.systemMessage`. Extract on demand via the API or the workflow JSON when needed.

## Common Commands

All scripts use Node.js with the built-in `https` module (no dependencies to install).

```bash
# Full audit: prompts + Google Sheet + execution analysis
node full_audit.js

# Audit last 50 executions for anomalies
node audit_50.js

# Monitor live executions in real-time
node monitor_new.js

# Run specific checks
node check_calculadora.js
node check_planes_data.js
node check_case.js

# Post-deployment verification
node verify_all.js

# Stress test scenarios
node stress_test.js
```

## n8n API Access

Scripts interact with the live n8n instance via the Public API:

- **Base URL**: `https://n8n.manzanaverde.la/api/v1`
- **Auth header**: `X-N8N-API-KEY` (stored in memory, not in repo)
- **Key endpoints**:
  - `GET /workflows/{id}` — Fetch workflow definition (nodes, connections, prompts)
  - `GET /executions/{id}?includeData=true` — Full execution trace with data
  - `GET /executions?workflowId={id}&limit=N&status=success` — List recent executions
  - `PUT /workflows/{id}` — Update workflow (payload: `{name, nodes, connections, settings: {executionOrder}}`)

## MCP Tools

The n8n MCP server provides tools for searching workflows, getting workflow details, and executing workflows directly from Claude Code. Use these instead of raw API calls when possible.

## Development Workflow

1. **Backup**: Fetch current workflow via API → save as `atc_backup_YYYYMMDD.json`
2. **Modify**: Edit workflow JSON (nodes, connections, prompts) in memory
3. **Validate**: Check connection integrity, no orphan nodes, no duplicate names
4. **Deploy**: PUT stripped payload `{name, nodes, connections, settings: {executionOrder}}` to API
5. **Monitor**: Check post-deploy executions for errors within 30-60s
6. **Rollback**: If errors, PUT backup JSON immediately

## Critical Business Rules (enforced in prompts and audits)

These rules are actively monitored by the audit scripts and are the most common sources of regressions:

- **Entregas por dirección**: Almuerzo + cena se entregan JUNTAS a UNA sola dirección. NO se puede dividir.
- **Plan Inicio**: Must say "entregas" not "días"; must NOT mention delivery cost (S/3, S/4.5, $19)
- **PASO B**: Ventas must present benefits (6 opciones, carta) before jumping to PASO C (plans/prices)
- **Cena franjas**: "NO existen franjas de cena" — all deliveries before 1:30pm
- **Anti-math**: Agent must NOT divide plan price by days to show per-day cost
- **Lane separation**: ATC agent must NOT sell plans; Ventas must NOT handle support tickets
- **Payment verification**: Image verification required before confirming payment
- **Carril FÍSICAS**: Even in physical-store lane, agent CAN discuss plans (exception to normal flow)
- **If6 carta filter**: Only triggers on "carta de", "nuestra carta", "ejemplo del menú" — NOT on generic "Te muestro"

## Google Sheet Integration

Plan data comes from a Google Sheet (ID: `1CAAPAavuWHZNWlqsFNbie8lu6CWkYrz4BNKwSR2I_IU`). The audit checks that sheet content aligns with prompt rules (e.g., Plan Inicio benefits don't mention delivery cost).
