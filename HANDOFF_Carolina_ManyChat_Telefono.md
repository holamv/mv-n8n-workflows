# Ajuste ManyChat — poblar campo "Telefono" (Carolina)

## Por qué
El flujo **Primer Contacto Leads (PCL)** contacta leads por WhatsApp usando la API de ManyChat. Para enviarle a un suscriptor, PCL necesita su **subscriber_id**, y lo busca por el **campo personalizado "Telefono"**.

Problema: los suscriptores que entraron por WhatsApp tienen su número en `whatsapp_phone`, **pero el campo "Telefono" está vacío** → PCL no los encuentra → no les envía y los escala a Discord.

**Solución:** que el campo **"Telefono"** se llene con el número de WhatsApp. Dos partes: (1) nuevos automático, (2) los que ya existen (backlog).

> Campo a usar: **"Telefono"** (ya existe en ManyChat, es de tipo texto). NO crear uno nuevo.

---

## Parte 1 — Nuevos suscriptores (automático, hacia adelante)

Objetivo: cada suscriptor nuevo de WhatsApp → se le llena "Telefono" solo.

1. ManyChat → **Automation** (o **Automatización**).
2. Ubica el **Flow/Automatización por donde entran los leads de WhatsApp** (el opt-in / bienvenida / growth tool con el que se registran).
3. Al inicio de ese flujo, agrega una acción **"Set Custom Field" / "Establecer campo personalizado"**:
   - **Campo:** `Telefono`
   - **Valor:** el número de WhatsApp del suscriptor (usa el merge field del número de WhatsApp / `{{phone}}` que ofrezca ManyChat).
4. Guarda y publica.

> Si no hay un solo flujo de entrada, alternativa: **Settings → Rules / Reglas** → nueva regla con disparador "se suscribe a WhatsApp" → acción "Set Custom Field Telefono = número".

---

## Parte 2 — Suscriptores existentes (backlog, una sola vez)

Objetivo: llenar "Telefono" en los que ya están sin él.

1. ManyChat → **Audience / Contactos**.
2. Filtra: **Telefono = vacío (is not set)** + suscritos a WhatsApp.
3. Crea un **Flow simple** con UNA acción: **Set Custom Field** `Telefono` = número de WhatsApp (sin mensaje, solo la acción).
4. **Envía/aplica ese Flow al segmento filtrado** (broadcast interno o "aplicar acción al segmento"). Esto llena "Telefono" a todos sin mandarles mensaje.

> Si tu plan ManyChat permite acción masiva directa en Audience ("Set field to…"), úsala apuntando `Telefono` al número.

---

## Formato del número (importante)
- Guarda en "Telefono" **solo dígitos**, sin `+` ni espacios. Ejemplos:
  - PE: `51984529292`
  - MX: `5215527028460`
  - CO: `573022191047`
- Si ManyChat solo te deja meterlo **con `+`**, no hay problema: avísanos y dejamos PCL tolerante a ambos formatos.

---

## Cómo verificar que funcionó
1. Toma un lead de prueba que estaba fallando (o uno nuevo).
2. Revisa en su perfil ManyChat que **"Telefono"** ya tiene el número.
3. Ese lead, al pasar por PCL, debe **recibir el mensaje** (ya no escala a Discord `#Error_ManyChat_Contactar_Usuario`).
4. Avísanos y confirmamos del lado n8n que PCL ya lo encuentra y envía.

---

## Notas
- El **saldo de ManyChat** ya está recargado (eso era otro problema, ya resuelto). Este ajuste es aparte, para que PCL **encuentre** a los suscriptores.
- Mientras "Telefono" no esté poblado, esos leads seguirán cayendo a Discord (no se pierden, quedan ahí para contacto manual).
- Cuando termines la Parte 2, avísanos: **reinyectamos** los leads escalados y ahora sí les llega el mensaje.
