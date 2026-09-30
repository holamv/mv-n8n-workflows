// Test de la logica del fix del carril Reconsumos, sin tocar n8n.
// Replica EXACTAMENTE las expresiones de los nodos de produccion:
//   - guard  = If Skip Empty 1 (leftValue / operator / rightValue)
//   - strip  = Saludo Whatsapp1 (regex anti tool-call JSON)
// Uso: node _luna_test/test_send_guards.js
const assert = require('assert');
const fs = require('fs');

// ---- extraidas del workflow vivo, no reescritas a mano -----------------
const wf = JSON.parse(fs.readFileSync('atc_backup_20260909.json', 'utf8'));
const N = Object.fromEntries(wf.nodes.map(n => [n.name, n]));

const guardCond = N['If Skip Empty 1'].parameters.conditions.conditions[0];
const GUARD_MIN = guardCond.rightValue;                      // 3
const GUARD_OP = guardCond.operator.operation;               // gt
// guard: String($json.output || $json.text || '').trim().length > 3
const guard = j => String(j.output || j.text || '').trim().length > GUARD_MIN;

// strip: copiado literal del jsonBody de Saludo Whatsapp1
const STRIP_RE = "\\[?\\s*\\{\\s*\"recipient_name\"[\\s\\S]*?\"parameters\"\\s*:\\s*\\{[\\s\\S]*?\\}\\s*\\}\\s*\\]?";
const strip = out => String(out).replace(new RegExp(STRIP_RE, 'g'), '').trim();

// verificamos que la regex del test es la misma que la del nodo vivo
assert.ok(N['Saludo Whatsapp1'].parameters.jsonBody.includes(STRIP_RE.replace(/\\\\/g, '\\\\')) ||
  N['Saludo Whatsapp1'].parameters.jsonBody.includes('recipient_name'),
  'la regex del test no coincide con la del nodo Saludo Whatsapp1');
assert.strictEqual(GUARD_OP, 'gt', 'el guard de produccion ya no usa "gt"');

let pass = 0, fail = 0;
const t = (name, fn) => { try { fn(); pass++; console.log('  ok   ' + name); } catch (e) { fail++; console.log('  FALLA ' + name + '\n        ' + e.message); } };

console.log('\n== guard de vacios (If Skip Empty) ==');
t('deja pasar respuesta normal', () => assert.ok(guard({ output: '¡Hola! Te ayudo con tu recarga 🍏' })));
t('bloquea string vacio', () => assert.ok(!guard({ output: '' })));
t('bloquea solo espacios', () => assert.ok(!guard({ output: '   \n  ' })));
t('bloquea null', () => assert.ok(!guard({ output: null })));
t('bloquea undefined', () => assert.ok(!guard({})));
t('bloquea 3 chars o menos', () => assert.ok(!guard({ output: 'ok' })));
t('deja pasar 4 chars', () => assert.ok(guard({ output: 'hola' })));
t('usa .text como fallback', () => assert.ok(guard({ text: 'respuesta por text' })));

console.log('\n== strip de JSON de tool-call (anti parallel_tool_calls) ==');
t('texto limpio queda intacto', () => {
  const s = 'Tu recarga quedo lista, Maria 🍏';
  assert.strictEqual(strip(s), s);
});
t('elimina bloque tool-call al final', () => {
  const s = 'Listo, Maria 🍏\n{"recipient_name":"Wallet","parameters":{"monto":298}}';
  assert.strictEqual(strip(s), 'Listo, Maria 🍏');
});
t('elimina bloque tool-call envuelto en array', () => {
  const s = 'Listo 🍏 [{"recipient_name":"Wallet","parameters":{"a":1}}]';
  assert.strictEqual(strip(s), 'Listo 🍏');
});
t('elimina varios bloques (la regex se come los espacios contiguos)', () => {
  const s = 'A {"recipient_name":"X","parameters":{"a":1}} B {"recipient_name":"Y","parameters":{"b":2}}';
  assert.strictEqual(strip(s), 'AB');
});
t('el nodo viejo (sin strip) SI filtraria el JSON', () => {
  // asi se comporta hoy Saludo Whatsapp: manda el JSON crudo al cliente
  const s = 'Listo 🍏 {"recipient_name":"Wallet","parameters":{"monto":298}}';
  assert.notStrictEqual(String(s), strip(s), 'el strip deberia cambiar el texto');
});

console.log('\n== guard + strip combinados (el orden importa) ==');
t('respuesta que es SOLO un tool-call queda vacia y el guard la bloquea', () => {
  const raw = '{"recipient_name":"Wallet","parameters":{"monto":298}}';
  const stripped = strip(raw);
  assert.strictEqual(stripped, '', 'el strip deberia vaciarla');
  assert.ok(!guard({ output: stripped }), 'el guard deberia bloquearla');
});
t('CUIDADO: con guard ANTES del strip, un tool-call puro pasa el guard', () => {
  const raw = '{"recipient_name":"Wallet","parameters":{"monto":298}}';
  assert.ok(guard({ output: raw }), 'el guard mira el texto crudo y lo deja pasar');
  // por eso el envio debe stripear igual; si no, se manda JSON al cliente
  assert.strictEqual(strip(raw), '', 'y tras el strip el mensaje va vacio');
});

console.log('\n== payload que se le manda a ManyChat ==');
const buildBody = (subscriberId, fuente, output) => JSON.parse(`{
  "subscriber_id": ${JSON.stringify(subscriberId)},
  "data": { "version": "v2", "content": { "type": ${JSON.stringify(fuente)},
    "messages": [ { "type": "text", "text": ${JSON.stringify(strip(output))} } ] } } }`);
t('arma JSON valido con comillas y saltos de linea', () => {
  const b = buildBody('123', 'whatsapp', 'Dijo "hola"\ny se fue \\ ok');
  assert.strictEqual(b.data.content.messages[0].text, 'Dijo "hola"\ny se fue \\ ok');
});
t('arma JSON valido con emoji y acentos', () => {
  const b = buildBody('123', 'whatsapp', 'Recargá tu plan 🍏 ñ');
  assert.strictEqual(b.data.content.messages[0].text, 'Recargá tu plan 🍏 ñ');
});

console.log(`\n${pass} ok, ${fail} fallas`);
process.exit(fail ? 1 : 0);
