# Seguridad — manejo de secretos en este repo

## 🚨 Incidente 2026-05-26 (secretos en historia git)

### Qué pasó

Entre el commit inicial (`5378c8d`) y los commits `julio`/`actua`/`okas`/`lolii`, se commitearon y **pushearon a GitHub** ~83 archivos operativos (scripts `.js`, snapshots `.json`, execution traces) que el `.gitignore` original no cubría. Varios contenían secretos en texto plano:

| Secreto | Archivos afectados | Estado |
|---|---|---|
| **n8n Public API JWT** (`eyJhbGc...`) | 24 scripts `.js` | En historia git |
| **Redis Cloud password** (`SxA1...`) | `REDIS_MAINTENANCE.md` + 6 scripts `redis_*` / `ttl_*` | En historia git |
| Discord bot token | `workflows/discord_bridge.json` (commit inicial) | Sanitizado antes del push, **no expuesto** |

> Además se commitearon execution traces (`_exec_*.json`) y snapshots (`_piura_*`, `closer_*`, `trade_*`) con **PII de clientes y candidatos** (teléfonos, nombres, emails).

### Remediación aplicada (2026-05-26)

1. ✅ **Untrack** de los 83 archivos (`git rm --cached`). El working tree de `HEAD` quedó con 17 archivos curados, cero secretos.
2. ✅ **`.gitignore` reforzado** con catch-all: ningún `.js` ni `.json` suelto en la raíz se versiona. Solo `workflows/` (JSON sanitizado), `docs/`, `scripts/SCRIPTS.md`.
3. ✅ `REDIS_MAINTENANCE.md` sanitizado (password redactada) y movido a `docs/`.

### ⚠️ Acción PENDIENTE del owner (obligatoria)

El untrack **NO borra los secretos de la historia git** — siguen visibles en los commits `julio`/`actua`/`okas`/`lolii` vía `git log -p` y en GitHub. Por eso:

- [ ] **Rotar el n8n API key** → n8n → Settings → API → revoke + generar nueva. Actualizar `.env` y `.mcp.json` locales.
- [ ] **Rotar el Redis Cloud password** → consola Redis Labs → database `database-MJAD4Z1C` → reset password. Actualizar `.env`.
- [ ] **(Opcional) Reescribir historia git** para borrar los secretos de los commits viejos (ver abajo). Requiere force-push.
- [ ] **Activar Secret Scanning + Push Protection** en GitHub → Settings → Code security & analysis. (Push Protection ya bloqueó un Discord token en el push inicial — dejarlo siempre activo.)

> **Por qué rotar es mandatorio aunque el repo sea privado:** los secretos viajaron a los servidores de GitHub, quedan en clones locales de cualquier colaborador, y en backups. Una key que estuvo en un repo se considera comprometida. Rotar es más barato que asumir que nadie la copió.

### Cómo reescribir la historia (si se decide)

Opción con [git-filter-repo](https://github.com/newren/git-filter-repo) (recomendado sobre BFG):

```bash
# 1. Instalar: pip install git-filter-repo
# 2. Crear archivo replacements.txt con los secretos a redactar (pegar los valores reales):
#    <el-JWT-completo-de-n8n>==><<N8N_API_KEY_REDACTED>>
#    <el-password-completo-de-redis>==><<REDIS_PASSWORD_REDACTED>>
git filter-repo --replace-text replacements.txt
# 3. Re-agregar el remote (filter-repo lo borra por seguridad) y force-push:
git remote add origin https://github.com/holamv/mv-n8n-workflows.git
git push origin --force --all
```

> ⚠️ Force-push reescribe SHAs. Coordinar con cualquiera que tenga clones (deben re-clonar). **No ejecutar sin confirmación explícita del owner.**

---

## Protocolo de manejo de secretos (de aquí en adelante)

### Qué NUNCA se commitea
- `.env`, `.mcp.json`, `*.key`, `*.pem` → en `.gitignore`.
- Scripts `.js` con JWT / passwords hardcoded → en `.gitignore` hasta migrar a `process.env`.
- Execution traces (`_exec_*`, `exec_*`) y snapshots de trabajo → contienen PII.
- Workflow JSONs sin sanitizar → tienen tokens en `Set Tokens` nodes y PII en `pinData`.

### Workflow JSONs — sanitización obligatoria antes de versionar
Los exports de n8n traen:
- **Tokens hardcoded** en nodos `Set Tokens` / Code (`DISCORD_TOKEN`, `N8N_API_KEY`).
- **`pinData`** con datos reales de clientes (teléfonos, nombres, emails de las ejecuciones de prueba).
- **`staticData`** con cursors y dedup caches que incluyen teléfonos.

El sanitizer (`sanitize_workflows.js`, gitignoreado) hace: strip `pinData` + `staticData`, reemplaza JWT por `<<N8N_API_KEY_REDACTED>>` y Discord tokens por `<<DISCORD_BOT_TOKEN_REDACTED>>`. **Correrlo antes de copiar cualquier workflow a `workflows/`.**

### Migración de scripts a env-based auth
Patrón actual (inseguro):
```js
const KEY = 'eyJhbGc...';
const redis = new Redis({ password: 'SxA1...' });
```
Patrón objetivo:
```js
require('dotenv').config();
const KEY = process.env.N8N_API_KEY;
const redis = new Redis({ password: process.env.REDIS_PASSWORD });
```
Una vez migrado, remover del `.gitignore` y mover a `scripts/`.

### Verificación pre-commit (manual)
Antes de cualquier `git add -A` masivo:
```bash
git diff --cached | grep -iE 'eyJhbGc|SxA1|sk-[A-Za-z0-9]{20}|password.*=.*\S{8}'
```
Si devuelve algo, NO commitear. GitHub Push Protection es la última línea de defensa, no la primera.

---

_Última actualización: 2026-05-26_
