# Changelog

Registro de deploys y cambios mayores. Solo cambios de impacto (regla nueva, fix de bug histórico, refactor del pipeline).

---

## 2026-06-15
- **ATC** — Nueva regla `REGLA RESTAURANTE — STATUS + VENTANA REAL DEL PEDIDO` (prioridad alta 🍱🛵). Para pedidos `last_foodcourt_order`, el bot DEBE usar el `estimated_time_range.range` real del pedido (ej: "13:00 - 14:00") y el `status` real ("PEDIDO LISTO", "EN PREPARACION", "EN CAMINO"). PROHIBIDO decir "antes de la 1:30 pm" (eso es Menú Diario, NO aplica a Restaurante). Distingue PROGRAMADO (start > 30 min adelante) vs EN CURSO (start ya pasó). Plantillas separadas para HOY (programado/en curso) y FUTURO. Caso origen: Jholvi Bermejo `+51993925470` exec 840232 — Info ATC retornó `last_foodcourt_order.status="PEDIDO LISTO"`, `range="13:00 - 14:00"`, pero bot dijo "antes de la 1:30 pm" (cutoff Menú Diario, fabricación).
- **ATC** — Nueva regla `REGLA ANTI-FABRICACION DE FECHA "HOY"` (prioridad máxima 🗓️🗓️🗓️). El bot debe comparar `last_daily_order.estimated_time_range.date` (o `order_date`) vs `{{ $now }}` ANTES de decir "será entregado hoy" / "tu pedido de hoy" / "ventana de hoy". Si `pedido_date < fecha_actual` → es de día pasado (no hoy). Si `pedido_date > fecha_actual` → es futuro. Aclaración crítica: `is_delivered=false` con `order_date < hoy` significa pedido NO entregado de día pasado (retorno/cliente no contestó), NO un pedido pendiente para hoy. Caso origen: Cynthia Gomez `+51943656936` exec 840191 — `order_date=2026-06-12`, exec corrió 2026-06-13, bot dijo "será entregado HOY ventana 09:45-13:30" (falso, era de ayer).

## 2026-06-10
- **ATC** — Nueva regla `REGLA REPARTIDOR CONTACTA AL LLEGAR` (prioridad alta). El bot debe responder SÍ cuando el cliente pregunta si el repartidor le avisa al llegar: "te llama y/o te escribe por WhatsApp cuando llega, y espera hasta 5 minutos como máximo". Caso origen: George `+447807400064` exec 834074 — bot respondió "no tenemos esa opción" (falso).
- **ATC** — Refuerzo `ANTI-RESALUDO` dentro de FASE 1.5. Aplica INCLUSO cuando el input es garbage/emojis/repeticiones ("^^", "..", "ok"). Caso origen: George exec 834075 — bot abrió con "¡Hola! Soy Eva" tras un input `"^^"` con prevBot lleno.
- **ATC** — `CASO E (Solicitar Retorno)`: ampliadas las señales para cubrir más frases ("no pude bajar a tiempo", "no llegué a tiempo a recoger", "podría pedir el retorno", "que me traigan nuevamente") y casos donde el cliente ESTABA en casa pero no logró bajar / no escuchó timbre. Caso origen: Sabrina `+51952521137` (no llegó al bot por ManyChat smart pause — fix defensivo).
- **Ventas** — Nueva regla `VIGENCIA NO ES ENTREGAS` (prioridad alta, 🧮). Cuando se listan los 3 planes ANTES de poder llamar Tool_Calculadora_Planes, OBLIGATORIO incluir rango aproximado de entregas + aclaración explícita "los 45/60/90 son DÍAS de vigencia, no cantidad de entregas". Rangos: Plan Inicio PE ~5-10 entregas, Plan Ahorro ~9-20 entregas, Plan Flexible ~12-27 entregas. Caso origen: Alexander `+51944895474` execs 832705/832720 — cliente intentó "165 × 45 días" creyendo que 45 era cantidad.

## 2026-06-11
- **ATC** — Nueva regla `Cubiertos / tenedor / cuchara` dentro de PREGUNTAS DE PRODUCTO. SÍ se incluyen cubiertos como opción (no son default). Respuesta verbatim con 3 pasos del app: Perfil > Mis Pedidos → ⚙️ Configuración → Habilitar "Incluir cubiertos" → Guardar. Prohibido decir "no incluimos cubiertos". Caso origen: `+51961466864` execs 836277/836278 — bot respondió 2× "no incluimos cubiertos" (falso).
- **ATC** — `CASO C — CANCELAR PEDIDO`, rama **A.2 (Menú Diario fecha HOY)** actualizada. Cambio de política: ahora se OFRECEN 2 opciones (cambio dirección con valor adicional / donación a persona en situación de calle), reemplazando el "no se puede, fin" anterior. Si el cliente elige cambio dirección → CASO A con valor extra (asesor). Si elige donación → confirmación + cierre. Si no responde claro → asesor. Removido el PROHIBIDO obsoleto que vetaba estas 2 opciones. Caso origen: Dario `+51902504588` execs 836283/836284 — bot no respondió porque dedup pipeline filtró ambos a `No Operation, do nothing1` (señal roja conocida, investigar raíz aparte).
- **n8n outage** (15:39-15:51 UTC aprox.): TCP timeout a `n8n.manzanaverde.la` (3 IPs AWS), curl 21s sin respuesta. Recuperado solo. Sin acción.
- **ATC** — `CASO A — CAMBIO DE DIRECCIÓN`: agregado **PASO 1.5 disambiguación tipo de pedido** (obligatorio antes de dar instrucciones). PE pregunta "¿Menú Diario o Restaurante?" y espera respuesta. CO/MX asumen Menú Diario (no existe Restaurante). Otro País deriva a asesor (MV no opera ahí). Agregado **PASO 3 — RESTAURANTE** (PE only): los cambios en pedidos de Restaurante necesitan coordinación con el local → derivar a asesor. Caso origen: Judi `+12365140812` (Otro País, 2026-06-12) — bot dio pasos del app genéricos sin disambiguar.
- **Ventas** — Regla `DIABETES / RESTRICCIONES MEDICAS` reescrita: **PIVOT POSITIVO con social proof** en vez de "consultar médico". Plantilla nueva: "no son específicamente para diabetes/celiacos pero tenemos muchas personas con temas parecidos (prediabetes, gastritis, control de peso, deportistas) que piden Manzana Verde porque..." + incluir "ejemplo del menú" (trigger If6 carta) + pedir dirección. PROHIBIDO mencionar médico/nutricionista en la primera respuesta. EXCEPCIONES (raras): solo derivar si el cliente EXPLÍCITAMENTE pide "dieta médica supervisada" o insiste tras la respuesta social-proof. Caso origen: Jennifer `+573144185379` (CO, 2026-06-11) — bot respondió defensivo "Te recomiendo consultarlo con tu médico" cuando preguntó por prediabéticos.
- **ATC dedup pipeline — FIX DE BUG ROOT** (deploy 16:07 UTC): `If1` winner condition cambió de `.last()` → `.first()` en la expresión `$json.propertyName?.last()?.split('|')?.[0] === $execution.id`. **Bug**: el Redis LPUSH guarda el más nuevo en posición 0, así que `.last()` apuntaba al mensaje MÁS VIEJO de la lista — la condición solo se cumplía cuando la lista tenía 1 ítem. Si un mensaje perdía, la lista acumulaba histórico y todos los mensajes siguientes del subscriber perdían también (auto-perpetuante porque `Redis2` solo limpia la lista en el path de winner). Sintoma: 2do caso confirmado en 24h con mensaje legítimo cayendo en `No Operation, do nothing1` (Dario +51902504588 ayer, Cristina Cuadros `+573143942683` execs 835839/835841). El fix auto-sana subscribers con lista corrupta: su próximo msg será `.first()` → ganará → `Redis2` limpia la lista. Verificado post-deploy con Milagros `+51975438561` exec 836871 (run normal 56s, Ventas response 5 líneas).
- **ManyChat (issue side)** — Descubierto: la "Pausa inteligente" de ManyChat intercepta mensajes del cliente y al terminar la pausa dispara solo el Default Reply (welcome menu) sin escalar el mensaje pendiente al webhook de n8n. La regla retorno del bot estaba correcta — el msg nunca llegó. Ver MANUAL § "Limitación: ManyChat smart pause".

## 2026-05-26
- **Repo** — 🚨 Incidente de seguridad: ~83 archivos operativos con n8n JWT + Redis password + PII de clientes se habían pusheado a GitHub. Untrackeados, `.gitignore` reforzado con catch-all. Rotación de keys pendiente del owner. Ver [SECURITY.md](SECURITY.md).
- **Repo** — Añadido `docs/SECURITY.md` (protocolo de secretos) y `docs/REDIS_MAINTENANCE.md` (sanitizado).

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
