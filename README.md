# mv-n8n-workflows

Plataforma de automatización conversacional de **Manzana Verde**: bot WhatsApp ATC, bridge de Discord, plantillas outbound (PCL / PCP / Seguimiento 14d) y herramientas de auditoría.

> Live: [n8n.manzanaverde.la](https://n8n.manzanaverde.la) (instancia **A**) · [n8n2.manzanaverde.la](https://n8n2.manzanaverde.la) (instancia **B**, pipeline de leads + analítica de marketing)

---

## 📚 Documentación

- **[Catálogo de workflows](docs/WORKFLOWS.md)** — inventario **completo** de los 65 workflows activos en las **2 instancias** (A + B) y su uso, más los relacionados on-demand/legacy.
- **[Manual completo](docs/MANUAL.md)** — detalle profundo de los 5 workflows conversacionales core (ATC, Bridge, PCL, PCP, Seguimiento 14d), reglas de negocio críticas, cómo pedir cambios, cómo medir estabilidad.
- **[Catálogo de scripts](scripts/SCRIPTS.md)** — utilidades de auditoría/monitoreo/replay.
- **[CHANGELOG](docs/CHANGELOG.md)** — registro de deploys y cambios mayores.
- **[Redis Maintenance](docs/REDIS_MAINTENANCE.md)** — TTL preventivo y limpieza de keys.
- **[SECURITY](docs/SECURITY.md)** — 🚨 protocolo de secretos + incidente 2026-05-26 (rotación de keys pendiente).

## 🔒 Qué se versiona (y qué NO)

Este repo versiona **solo el set curado**: `workflows/` (JSON sanitizado), `docs/`, `scripts/SCRIPTS.md`, `README`, `.env.example`.

**NO se versiona** (en `.gitignore`): scripts `.js` con secretos hardcoded, execution traces (`_exec_*`), snapshots de trabajo, y archivos de otros proyectos (reclutamiento: piura/closer/trade/CVs). Ver [SECURITY.md](docs/SECURITY.md) para el protocolo completo.

## 🗂 Workflows incluidos

Snapshots JSON versionados en este repo (subset curado, **capturados 2026-05-08, pre-migración**). El **inventario completo y vivo** está en **[docs/WORKFLOWS.md](docs/WORKFLOWS.md)**. La columna "Workflow ID" apunta al ID **en producción hoy** (no necesariamente al que representa el snapshot).

| Archivo | Workflow ID | Instancia | Función |
|---|---|---|---|
| `workflows/atc.json` | `R81I6h5KWtyNaDAy` | A | Agente ATC (155 nodos) — Ventas / ATC / Reconsumos |
| `workflows/discord_bridge.json` | `tLAVt91iWAHsY2eE` | **B** | Lee Discord cada 3 min y dispara PCL (migrado desde A `VwG3AgtdDDdjC7xc`) |
| `workflows/pcl.json` | `AAntaw0Aa0fkDSaR` | **B** | Primer Contacto Leads (migrado desde A `9MxNM5byLghh9ky2`) |
| `workflows/pcp.json` | `s37SLqGFljbf08Js` | A | Contacto Primer Pedido |
| `workflows/seguimiento_14d.json` | `FS68xVacNF1DN9cd` | A | Re-engagement clientes inactivos (4 ramas) |
| `workflows/referidos.json` | `4g14aSPGtVfvGvqU` | A | Programa de referidos |
| `workflows/wallet.json` | `Il7WWfAJCElkQx3d` | A | Sub-workflow de saldos / recargas |
| `workflows/obtener_direccion.json` | `2BqhLRHKtIgshEDy` | A | Sub-workflow de geocoding |

> ⚠️ Los archivos `workflows/*.json` reflejan el subset core; el **Discord Bridge** y **PCL** ahora corren en la instancia **B** con IDs nuevos (arriba). Para todo lo demás (RRHH, tickets, compras, analítica de marketing, utilidades) ver el catálogo completo.

## 🔧 Setup local

```bash
git clone git@github.com:holamv/mv-n8n-workflows.git
cd mv-n8n-workflows
cp .env.example .env
# editar .env con la API key de n8n
```

> ⚠️ La API key de n8n (`X-N8N-API-KEY`), el bearer token del MCP server y el password de Redis NUNCA se commitean. Viven solo en `.env` y `.mcp.json` (ambos en `.gitignore`). Si vas a versionar un script, migralo a `process.env` primero — ver [SECURITY.md](docs/SECURITY.md).

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
