# Changelog

Registro de deploys y cambios mayores. Solo cambios de impacto (regla nueva, fix de bug histórico, refactor del pipeline).

---

## 2026-05-08
- **ATC** — `landing_precheck`: pre-check de señales de plan antes de enviar landing `manzanaverde.la/<pais>/pedidos`. Caso origen: `+5213311854591` (MX) recibió landing $99 estando aún en discovery.
- **ATC** — Saldo framing: cuando cliente pregunta "cómo se cuenta la entrega", responder con framing de saldo flexible. Caso origen: Victor Rodriguez `+5213319224531`.

## 2026-05-07
- **Discord Bridge** — Fix duplicación 65×: cursor inmediato dentro de `Bridge Extract`. Antes 5.000 execs PCL en 4h con 86 leads reales.
- **Bridge** — Limit por canal `20 → 100`, paginación `before` hasta 500 msgs, eliminado filtro `_windowMs`.
- **Bridge** — `retryOnFail` 3×30s en Code nodes (NO rescata task runner timeouts).
- **PCL** — Wait default `15 min → 10 min`.
- **ATC** — Pedido mínimo PE actualizado: S/24.90 tienda (antes S/28.90), S/30.90 delivery.
- **ATC** — Regla horario pedido: "9 pm día anterior" universal (PE/CO/MX). Caso origen: Surisarai `+5217341182715` (MX).

## 2026-05-04
- **ATC** — Arquitectura fallback IA: clones `IA INTENCIÓN CLIENTE Fallback` y `ATC Fallback` con cred `Bot Ventas`. Limitación: misma org OpenAI → comparten cuota TPM.
- **ATC** — Retry config en TODOS los Chat Model nodes: `retryOnFail=true, maxTries=5, waitBetweenTries=20000ms`.
- **ATC** — Prompt IA INTENCIÓN optimizado: 22.671 → 7.408 chars (67% menos tokens). Lógica preservada.
- **ATC** — Anti-repregunta semántica (Ventas).

## 2026-04-29
- **PCP + Seguimiento 14d** — Dedup compartido `tpl_primer_pedido_<phone>` (Redis TTL 7d). Caso origen: Ubaldo Eduardo `+51937554376` recibió 2 surveys en 3h.

## 2026-04-24
- **PCL/PCP/Seguimiento 14d** — Fix B: `findByCustomField` → `findBySystemField?phone=+<digits>`. Phone hardened con `phone.replace(/\D/g,'')`. Resuelve 53/400 fails con `subscriber_id cannot be blank`.
- **Seguimiento 14d** — Webhook orphan `699e7b91-...` conectado al Switch.
- **Seguimiento 14d** — Rama `motivar carga` añadida (sin Wait, envío directo, 3 country HTTPs).

## 2026-04-23
- **Logs Bot** — `cleanup_logsbot.js` semanal (TTL 7d). Antes ~200k filas → API lenta y 503.

## 2026-04-22
- **ATC** — Anti-recargas duplicadas (4 capas): PASO 0.3/1.3 anti-recarga-app-previa, Recarga Lock 2h, codigo Sheets, transaction_id.

## 2026-04-21
- **ATC** — Caso A (restaurante) y Caso C (borrar día) integrados en flujo Reconsumos.
- **ATC** — Geocoding fix en `wf_obtener_direccion`.

## 2026-04-20
- ⚠️ **Incidente** — Deploy con prompt extraído de backup stale erasó CIERRE OBLIGATORIO y REGLA HORARIO DE ENTREGA. Restaurado de emergencia. Origen de la regla "fetch fresh siempre antes de PUT".

---

## Cómo agregar entradas

Una línea por cambio relevante. Formato: **`workflow`** — descripción breve. Si hay caso de cliente, mencionarlo.

No documentar:
- Tweaks de wording sin regla nueva.
- Cambios de Google Sheet (los lee el bot en runtime, no requieren deploy).
- Restarts del task runner.
