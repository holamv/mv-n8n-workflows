# Banco de pruebas del Agente ATC

Herramientas para probar cambios en los agentes **sin tocar producción**, y para auditar
producción después de un deploy. Nacieron para evaluar `gpt-5.6-luna` (septiembre 2026),
pero sirven para cualquier cambio de prompt o de modelo.

Solo se versionan los `.js`. Los `.json` (snapshots del workflow, 1,2 MB cada uno) y los
`.txt` (logs con nombres de clientes reales) están en `.gitignore`.

## Qué es el banco

Workflow aislado **`Ls4X77y5b4OadZRv`** — "TEST Luna — Agentes ATC" — con webhook
`luna-test-8f3a21c0-atc`. Queda **desactivado**; reactivar con:

```bash
curl -X POST -H "X-N8N-API-KEY: $KEY" \
  https://n8n.manzanaverde.la/api/v1/workflows/Ls4X77y5b4OadZRv/activate
```

Es un clon minimal de producción: `IA INTENCIÓN → Switch1 → {ATC | Ventas | Reconsumos}`
con sus tools y sub-agentes, y stubs con los nombres exactos que las expresiones de los
prompts exigen (`WHATSAPP1`, `Texto Final`, `Code`, `Redis3`, `Redis4`, `Edit Fields3/4/8`).

**Se excluyen las 5 tools que escriben en producción**: Registrar Pago, Wallet,
Crear Pedido, Registro y Crear Dir.

## Flujo típico

```bash
# 1. traer el workflow vivo (necesario: trae las credenciales, el dump MCP no)
curl -H "X-N8N-API-KEY: $KEY" \
  https://n8n.manzanaverde.la/api/v1/workflows/R81I6h5KWtyNaDAy -o _luna_test/atc_full.json

# 2. armar una variante y desplegarla al banco
node _luna_test/build_test_wf.js luna-low     # baseline | luna-low | luna-medium | luna-none
node _luna_test/deploy.js luna-low

# 3. correr los escenarios
node _luna_test/run.js luna-low --conc 3 --chat

# 4. comparar variantes
node _luna_test/compare.js                      # tabla
node _luna_test/compare.js atc_no_vende         # + la conversación de ese escenario
node _luna_test/cost.js                         # costo al 92% de cache real
```

`RECONS_SEND=1` en el paso 2 agrega la cadena de envío de Reconsumos con un nodo espejo,
que arma el payload de ManyChat y lo devuelve en vez de enviarlo.

## Scripts

| Script | Qué hace |
|---|---|
| `build_test_wf.js` | arma una variante desde el workflow vivo, con self-check de referencias rotas y de tools de escritura |
| `deploy.js` | despliega al banco |
| `deploy_prod.js` | despliega a **producción**, con verificación post-deploy |
| `run.js` | corre los escenarios con concurrencia, aserciones y cálculo de costo |
| `scenarios.js` | los escenarios, con las reglas de negocio como aserciones |
| `compare.js` / `cost.js` / `recount.js` | comparación entre variantes y recálculo de tokens |
| `patch_scope.js` | inserta o actualiza la regla de ámbito en los 3 agentes |
| `fix_reconsumos.js` | repara el carril Reconsumos (guard + strip + reconexión) |
| `migrate_prod.js` | migra agentes a Luna; falla si un modelo de `agentTool` queda en 5.6 |
| `test_send_guards.js` | 17 tests unitarios del guard de vacíos y del strip anti tool-call |
| `scope_audit.js` | qué escribieron los clientes que recibieron un rechazo de ámbito |
| `evaluate_canary.js` / `watch_canary.js` | estado de un deploy: latencia, tokens, errores |
| `error_rate.js` / `err_detail.js` | tasa de error por hora y clasificación de errores |
| `lane_stats.js` | volumen por carril y si cada uno realmente envía respuesta |
| `exec.js` | vuelca una ejecución nodo por nodo |

## Tres cosas que cuestan caro aprender

**El banco comparte servidor con producción.** Correr suites con concurrencia alta en hora
pico genera `failed to be processed too many times` en ejecuciones de clientes reales, que
se pierden sin reintento. Usar `--conc 3` o menos, fuera de hora pico.

**Un nodo con 0 llamadas en el reporte no está validado.** Los sub-agentes figuraron con
cero llamadas durante varias corridas, y eso ocultó que su modelo en Luna los rompía. Si algo
tiene que ejercitarse, hay que forzarlo con un escenario hecho a propósito.

**Para probar una regla de rechazo, usar la frase más corta.** La regla de ámbito v1 pasó las
pruebas con "Quiero hablar con un asesor humano" y en producción rechazó "Hablar con un
humano": la frase larga contenía la palabra clave y tapó el bug.

## Credenciales

Ningún script las lleva dentro. Todos leen la API key de n8n desde el archivo de memoria
local, fuera del repo. No agregar llaves a estos archivos.
