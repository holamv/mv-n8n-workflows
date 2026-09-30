// Migracion de produccion. Uso: node _luna_test/migrate_prod.js <in.json> <out.json> <agentes...>
// - Inserta la REGLA DE ÁMBITO (via patch_scope) en ATC / Ventas / Reconsumos
// - Pasa los agentes indicados a gpt-5.6-luna + Agent v3.1 + Responses API + reasoning low
// - Restaura retryOnFail en los chat models que toca
// No hace deploy: solo produce el JSON y corre el self-check.
const fs = require('fs');
const [IN, OUT, ...AGENTS] = process.argv.slice(2);
if (!IN || !OUT || !AGENTS.length) { console.error('uso: migrate_prod.js <in> <out> <agente...>'); process.exit(1); }

// que chat model alimenta a cada agente (conexion ai_languageModel)
const wf = JSON.parse(fs.readFileSync(IN, 'utf8'));
const modelOf = {};
for (const [src, byType] of Object.entries(wf.connections))
  for (const arr of (byType.ai_languageModel || []))
    for (const c of (arr || [])) modelOf[c.node] = src;

const problems = [];
const before = JSON.parse(fs.readFileSync(IN, 'utf8'));
const B = Object.fromEntries(before.nodes.map(n => [n.name, n]));
const N = Object.fromEntries(wf.nodes.map(n => [n.name, n]));

for (const ag of AGENTS) {
  const a = N[ag];
  if (!a) { problems.push('agente inexistente: ' + ag); continue; }
  const mName = modelOf[ag];
  const m = N[mName];
  if (!m) { problems.push('sin chat model para ' + ag); continue; }

  // 1) agente v2 -> v3.1 (gpt-5.6 no corre en Agent v2)
  a.typeVersion = 3.1;
  a.parameters.options = a.parameters.options || {};
  a.parameters.options.enableStreaming = false;

  // 2) chat model -> luna low via Responses API
  m.typeVersion = 1.3;
  m.parameters.model = { __rl: true, mode: 'list', value: 'gpt-5.6-luna', cachedResultName: 'gpt-5.6-luna' };
  m.parameters.responsesApiEnabled = true;
  m.parameters.options = m.parameters.options || {};
  m.parameters.options.reasoningEffort = 'low';
  m.parameters.options.promptCacheKey = 'atc_' + mName.replace(/\s+/g, '_');
  // 3) retryOnFail se habia perdido; se restaura en los nodos que tocamos
  m.retryOnFail = true; m.maxTries = 5; m.waitBetweenTries = 20000;

  console.log(`  ${ag.padEnd(12)} agent v${B[ag].typeVersion} -> v3.1 | ${mName}: ${B[mName].parameters.model.value} v${B[mName].typeVersion} -> gpt-5.6-luna v1.3 (responses, low)`);
}

// GUARDA: el nodo agentTool NO soporta gpt-5.6 ni en su ultima version (2.2).
// Si un chat model que alimenta un agentTool queda en Luna, el sub-agente muere con
// "This model is not supported in 2.2 version of the Agent node" (verificado exec 1417643).
const subAgentModels = new Set();
for (const [src, byType] of Object.entries(wf.connections))
  for (const arr of (byType.ai_languageModel || []))
    for (const c of (arr || []))
      if (N[c.node] && N[c.node].type === '@n8n/n8n-nodes-langchain.agentTool') subAgentModels.add(src);
for (const m of subAgentModels)
  if (N[m].parameters.model.value.startsWith('gpt-5.6'))
    problems.push(`${m} alimenta un agentTool y quedo en ${N[m].parameters.model.value}: agentTool v2.2 no soporta gpt-5.6`);

// ---------------------------------------------------------------- self-check
const MARK = 'REGLA DE ÁMBITO — SOLO MANZANA VERDE';
for (const name of ['ATC', 'Ventas', 'Reconsumos']) {
  const s = N[name]?.parameters?.options?.systemMessage || '';
  if (!s.includes(MARK)) problems.push(name + ': falta la REGLA DE ÁMBITO');
  if (!s.startsWith('=')) problems.push(name + ': se perdio el marker "=" de expresion');
  const cnt = x => (x.match(/\{\{/g) || []).length;
  if (cnt(s) !== cnt(B[name].parameters.options.systemMessage)) problems.push(name + ': cambio el numero de expresiones');
}
// los NO migrados deben conservar modelo y version
for (const n of wf.nodes) {
  if (!/lmChatOpenAi/.test(n.type)) continue;
  const migrated = AGENTS.some(a => modelOf[a] === n.name);
  if (!migrated && (n.parameters.model.value !== B[n.name].parameters.model.value || n.typeVersion !== B[n.name].typeVersion))
    problems.push('nodo NO migrado fue modificado: ' + n.name);
}
for (const n of wf.nodes) {
  if (!/langchain\.agent$/.test(n.type)) continue;
  const migrated = AGENTS.includes(n.name);
  if (!migrated && n.typeVersion !== B[n.name].typeVersion) problems.push('agente NO migrado cambio de version: ' + n.name);
  if (migrated && n.typeVersion !== 3.1) problems.push('agente migrado sin v3.1: ' + n.name);
}
// integridad estructural
if (wf.nodes.length !== before.nodes.length) problems.push('cambio la cantidad de nodos');
if (JSON.stringify(wf.connections) !== JSON.stringify(before.connections)) problems.push('cambiaron las conexiones');
const names = new Set(wf.nodes.map(n => n.name));
for (const [src, byType] of Object.entries(wf.connections)) {
  if (!names.has(src)) problems.push('conexion desde nodo inexistente: ' + src);
  for (const outs of Object.values(byType)) for (const arr of (outs || [])) for (const c of (arr || []))
    if (!names.has(c.node)) problems.push('conexion hacia nodo inexistente: ' + c.node);
}

fs.writeFileSync(OUT, JSON.stringify(wf, null, 1));
console.log(`\nescrito ${OUT} (${wf.nodes.length} nodos)`);
const uniq = [...new Set(problems)];
if (uniq.length) { console.log('PROBLEMAS:'); uniq.forEach(p => console.log('  -', p)); process.exitCode = 1; }
else console.log('self-check OK: regla presente, marker "=" intacto, expresiones iguales, conexiones y nodos sin cambios, no-migrados intactos');
