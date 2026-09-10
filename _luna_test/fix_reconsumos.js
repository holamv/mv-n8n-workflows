// Repara el carril Reconsumos. Uso: node _luna_test/fix_reconsumos.js <in.json> <out.json>
//
// El cable Redis6 -> Saludo Whatsapp existio hasta el 2026-06-08 y desaparecio
// antes del 2026-06-15. Desde entonces Reconsumos genera respuesta y nadie la recibe.
// No basta reconectar: los otros dos carriles ganaron despues dos protecciones
// que a este le faltan, asi que se agregan para dejar los 3 simetricos.
//   1. guard de vacios  (If Skip Empty 1/2  ->  If Skip Empty 3)
//   2. strip de JSON de tool-call en el envio (lo tiene Saludo Whatsapp1)
const fs = require('fs');
const [IN, OUT] = process.argv.slice(2);
if (!IN || !OUT) { console.error('uso: fix_reconsumos.js <in.json> <out.json>'); process.exit(1); }

const wf = JSON.parse(fs.readFileSync(IN, 'utf8'));
const before = JSON.parse(fs.readFileSync(IN, 'utf8'));
const N = Object.fromEntries(wf.nodes.map(n => [n.name, n]));
const B = Object.fromEntries(before.nodes.map(n => [n.name, n]));
const clone = o => JSON.parse(JSON.stringify(o));
const problems = [];

// -- 1. guard de vacios, copia exacta del de ATC --------------------------
if (!N['If Skip Empty 3']) {
  const g = clone(N['If Skip Empty 1']);
  g.name = 'If Skip Empty 3'; delete g.id; g.position = [5072, 432];
  g.parameters.conditions.conditions[0].id = 'skip-empty-3-cond';
  wf.nodes.push(g);
  console.log('  + If Skip Empty 3        (copia de If Skip Empty 1)');
}
if (!N['No Op If Skip Empty 3']) {
  wf.nodes.push({ name: 'No Op If Skip Empty 3', type: 'n8n-nodes-base.noOp', typeVersion: 1, position: [5072, 592], parameters: {} });
  console.log('  + No Op If Skip Empty 3');
}

// -- 2. strip anti tool-call JSON en el envio de Reconsumos ---------------
const good = N['Saludo Whatsapp1'].parameters.jsonBody;
if (N['Saludo Whatsapp'].parameters.jsonBody !== good) {
  N['Saludo Whatsapp'].parameters.jsonBody = good;
  console.log('  ~ Saludo Whatsapp        jsonBody <- el de Saludo Whatsapp1 (con strip)');
}

// -- 3. reconectar Redis6 -> guard -> envio -------------------------------
wf.connections['Redis6'] = { main: [[{ node: 'If Skip Empty 3', type: 'main', index: 0 }]] };
wf.connections['If Skip Empty 3'] = { main: [
  [{ node: 'Saludo Whatsapp', type: 'main', index: 0 }],
  [{ node: 'No Op If Skip Empty 3', type: 'main', index: 0 }],
]};
console.log('  ~ Redis6 -> If Skip Empty 3 -> Saludo Whatsapp | No Op');

// ------------------------------------------------------------ self-check
const names = new Set(wf.nodes.map(n => n.name));
const succ = (w, n) => (w.connections[n]?.main || []).flatMap((o, i) => (o || []).map(c => i + '->' + c.node)).join(',');

// el carril debe quedar igual al de ATC
const atcBody = N['Saludo Whatsapp1'].parameters.jsonBody;
if (N['Saludo Whatsapp'].parameters.jsonBody !== atcBody) problems.push('Saludo Whatsapp no quedo con el strip de ATC');
if (!N['Saludo Whatsapp'].parameters.jsonBody.includes('recipient_name')) problems.push('el jsonBody no tiene el strip anti tool-call');
const g3 = wf.nodes.find(n => n.name === 'If Skip Empty 3');
const g1 = N['If Skip Empty 1'];
if (JSON.stringify(g3.parameters.conditions.conditions[0].leftValue) !== JSON.stringify(g1.parameters.conditions.conditions[0].leftValue))
  problems.push('el guard nuevo no evalua lo mismo que If Skip Empty 1');
if (g3.parameters.conditions.conditions[0].rightValue !== g1.parameters.conditions.conditions[0].rightValue)
  problems.push('el umbral del guard nuevo difiere del de ATC');
if (succ(wf, 'Redis6') !== '0->If Skip Empty 3') problems.push('Redis6 mal conectado: ' + succ(wf, 'Redis6'));
if (succ(wf, 'If Skip Empty 3') !== '0->Saludo Whatsapp,1->No Op If Skip Empty 3') problems.push('guard mal conectado: ' + succ(wf, 'If Skip Empty 3'));
if (succ(wf, 'Saludo Whatsapp') !== '0->If3') problems.push('se perdio la cadena post-envio: ' + succ(wf, 'Saludo Whatsapp'));

// nada mas puede haber cambiado
for (const n of wf.nodes) {
  if (['If Skip Empty 3', 'No Op If Skip Empty 3', 'Saludo Whatsapp'].includes(n.name)) continue;
  if (!B[n.name]) { problems.push('nodo inesperado agregado: ' + n.name); continue; }
  if (JSON.stringify(n) !== JSON.stringify(B[n.name])) problems.push('nodo modificado sin querer: ' + n.name);
}
for (const [src, byType] of Object.entries(wf.connections)) {
  if (!names.has(src)) problems.push('conexion desde nodo inexistente: ' + src);
  for (const outs of Object.values(byType)) for (const arr of (outs || [])) for (const c of (arr || []))
    if (!names.has(c.node)) problems.push('conexion hacia nodo inexistente: ' + c.node);
  if (['Redis6', 'If Skip Empty 3'].includes(src)) continue;
  if (JSON.stringify(byType) !== JSON.stringify(before.connections[src])) problems.push('conexion modificada sin querer: ' + src);
}
// los otros dos carriles intactos
for (const s of ['Saludo Whatsapp1', 'Saludo Whatsapp2'])
  if (JSON.stringify(N[s]) !== JSON.stringify(B[s])) problems.push('carril tocado sin querer: ' + s);
// la regla de ambito y luna siguen puestas
if (!N['ATC'].parameters.options.systemMessage.includes('REGLA DE ÁMBITO')) problems.push('se perdio la REGLA DE ÁMBITO en ATC');
if (N['OpenAI Chat Model1'].parameters.model.value !== 'gpt-5.6-luna') problems.push('se perdio la migracion de ATC a Luna');

fs.writeFileSync(OUT, JSON.stringify(wf, null, 1));
console.log(`\nescrito ${OUT} (${wf.nodes.length} nodos, antes ${before.nodes.length})`);
const uniq = [...new Set(problems)];
if (uniq.length) { console.log('PROBLEMAS:'); uniq.forEach(p => console.log('  -', p)); process.exitCode = 1; }
else console.log('self-check OK: carril simetrico con ATC, resto del workflow intacto, ambito y Luna conservados');
