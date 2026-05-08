# mv-n8n-workflows

Plataforma de automatización conversacional de **Manzana Verde**: bot WhatsApp ATC, bridge de Discord, plantillas outbound (PCL / PCP / Seguimiento 14d) y herramientas de auditoría.

> Live: [n8n.manzanaverde.la](https://n8n.manzanaverde.la)

---

## 📚 Documentación

- **[Manual completo](docs/MANUAL.md)** — qué hace cada workflow, reglas de negocio críticas, cómo pedir cambios, cómo medir estabilidad.
- **[Catálogo de scripts](scripts/SCRIPTS.md)** — utilidades de auditoría/monitoreo/replay.
- **[CHANGELOG](docs/CHANGELOG.md)** — registro de deploys y cambios mayores.

## 🗂 Workflows incluidos

| Archivo | Workflow ID | Función |
|---|---|---|
| `workflows/atc.json` | `R81I6h5KWtyNaDAy` | Agente ATC (146 nodos) — Ventas / ATC / Reconsumos |
| `workflows/discord_bridge.json` | `VwG3AgtdDDdjC7xc` | Lee Discord cada 3 min y dispara PCL |
| `workflows/pcl.json` | `9MxNM5byLghh9ky2` | Primer Contacto Leads (welcome) |
| `workflows/pcp.json` | `s37SLqGFljbf08Js` | Contacto Primer Pedido |
| `workflows/seguimiento_14d.json` | `FS68xVacNF1DN9cd` | Re-engagement clientes inactivos (4 ramas) |
| `workflows/referidos.json` | — | Programa de referidos |
| `workflows/wallet.json` | — | Workflow de saldos / recargas |
| `workflows/obtener_direccion.json` | — | Sub-workflow de geocoding |

## 🔧 Setup local

```bash
git clone git@github.com:holamv/mv-n8n-workflows.git
cd mv-n8n-workflows
cp .env.example .env
# editar .env con la API key de n8n
```

> ⚠️ La API key de n8n (`X-N8N-API-KEY`) y el bearer token del MCP server NUNCA se commitean. Viven solo en `.env` y `.mcp.json` (ambos en `.gitignore`).

## 🚦 Estado actual

- Última auditoría grande: **2026-05-08** (deploy fallback IA + retry config + dedup pipeline 60s/30s/3s).
- Cobertura: PE / CO / MX.
- Stack: n8n self-hosted + OpenAI (gpt-4.1-mini, gpt-5-mini) + ManyChat + Redis + Discord + Google Sheets.

## ⚠️ Limitaciones conocidas

- Hot-reload de MCPs no soportado — reiniciar Claude Code tras cambios de tokens.
- `redisTool` typeVersion 1 no soporta SET-NX atómico → ventana microscópica de race-condition en recargas.
- Public API n8n no permite cancelar webhooks ya disparados.
- Task runner se satura en hora pico Lima (9 AM–noon, 3–6 PM) — `retryOnFail` NO rescata este timeout.

## 📞 Cómo pedir cambios

Ver [docs/MANUAL.md § "Cómo pedir cambios"](docs/MANUAL.md#7-cómo-pedir-cambios).

---

_Mantenido por_ `julio@manzanaverde.la`. Privado — uso interno MV.
