// Construye workflow minimal de prueba: solo la interacción con los agentes.
// Uso: node _luna_test/build_test_wf.js <variant>
//   variant: baseline | luna-medium | luna-low | luna-none
const fs = require('fs');
const path = require('path');

const VARIANT = process.argv[2] || 'baseline';
const SRC = path.join(__dirname, 'atc_full.json');
const live = JSON.parse(fs.readFileSync(SRC, 'utf8'));
const L = Object.fromEntries(live.nodes.map(n => [n.name, n]));

const WEBHOOK_PATH = 'luna-test-8f3a21c0-atc';

// ---------------------------------------------------------------- variantes
const VARIANTS = {
  'baseline':    { model: 'gpt-5-mini',    ver: 1.2, responses: false, effort: null },
  'luna-medium': { model: 'gpt-5.6-luna',  ver: 1.3, responses: true,  effort: null,   agentVer: 3.1 },
  'luna-low':    { model: 'gpt-5.6-luna',  ver: 1.3, responses: true,  effort: 'low',  agentVer: 3.1 },
  'luna-none':   { model: 'gpt-5.6-luna',  ver: 1.3, responses: true,  effort: 'none', agentVer: 3.1 },
};
const V = VARIANTS[VARIANT];
if (!V) throw new Error('variante desconocida: ' + VARIANT);

// tools que ESCRIBEN en produccion -> excluidas del test
const WRITE_TOOLS = new Set(['Registrar Pago', 'Wallet', 'Crear Pedido', 'Registro', 'Crear Dir']);

// nodos que copiamos tal cual del workflow vivo
const COPY = [
  'IA INTENCIÓN CLIENTE', 'ATC', 'Ventas', 'Reconsumos',
  'Tool_Calculadora_Planes', 'Tool_Procesador_Pagos',
  'OpenAI Chat Model', 'OpenAI Chat Model1', 'OpenAI Chat Model2',
  'OpenAI Chat Model3', 'OpenAI Chat Model5', 'OpenAI Chat Model6',
  'Memoria', 'Memoria 1',
  'Switch1',
  'Info ATC', 'Info Ventas', 'Info Reconsumos',
  // tools read-only / redis con key sintetica
  'Info Cliente', 'Cobertura', 'Format Cobertura', 'Calculator',
  'Pedido', 'codigo', 'Planes1', 'Planes2', 'planes',
  'Intencion', 'Intencion1', 'Delete', 'Datos', 'Datos1',
  'Borrar datos', 'Borrar pedido',
  'Deeplink Cliente', 'Deeplink Reconsumos', 'Deeplink ATC',
];

const clone = o => JSON.parse(JSON.stringify(o));
const nodes = [];
const seen = new Set();

for (const name of COPY) {
  const src = L[name] || L[name + ' ']; // 'Memoria ' tiene espacio final en vivo
  if (!src) { console.warn('  !! no encontrado en vivo:', name); continue; }
  const n = clone(src);
  delete n.id;
  nodes.push(n);
  seen.add(n.name);
}

// Los chat models que alimentan un agentTool NO pueden ir a gpt-5.6:
// el nodo agentTool v2.2 (la ultima que existe) responde
//   "This model is not supported in 2.2 version of the Agent node"
// Se quedan en el modelo de produccion.
const subAgentModels = new Set();
for (const [src, byType] of Object.entries(live.connections))
  for (const arr of (byType.ai_languageModel || []))
    for (const c of (arr || []))
      if (L[c.node] && L[c.node].type === '@n8n/n8n-nodes-langchain.agentTool') subAgentModels.add(src);

// -------------------------------------------------- mutaciones a los copiados
for (const n of nodes) {
  // chat models -> variante bajo prueba
  if (n.type === '@n8n/n8n-nodes-langchain.lmChatOpenAi' && subAgentModels.has(n.name)) {
    console.log(`  =  ${n.name} alimenta un agentTool -> se queda en ${n.parameters.model.value}`);
    continue;
  }
  if (n.type === '@n8n/n8n-nodes-langchain.lmChatOpenAi') {
    n.typeVersion = V.ver;
    n.parameters.model = { __rl: true, mode: 'list', value: V.model, cachedResultName: V.model };
    n.parameters.options = n.parameters.options || {};
    if (V.ver >= 1.3) n.parameters.responsesApiEnabled = V.responses;
    if (V.effort) n.parameters.options.reasoningEffort = V.effort;
    else delete n.parameters.options.reasoningEffort;
    // cache key estable por nodo => mismo prefijo cacheable que produccion
    if (V.responses) n.parameters.options.promptCacheKey = 'lunatest_' + n.name.replace(/\s+/g, '_');
    n.retryOnFail = true; n.maxTries = 3; n.waitBetweenTries = 5000;
  }
  // memoria: sessionKey apuntaba a $('Switch') que no existe en el minimal
  if (n.type === '@n8n/n8n-nodes-langchain.memoryPostgresChat') {
    n.parameters.sessionKey = "={{ $('WHATSAPP1').item.json.body.id }}";
    n.parameters.tableName = 'n8n_chat_memoria';
  }
  // Info*: no reventar si el backend no tiene al cliente sintetico
  if (['Info ATC', 'Info Ventas', 'Info Reconsumos'].includes(n.name)) {
    n.parameters.options = n.parameters.options || {};
    n.parameters.options.response = { response: { neverError: true, fullResponse: false } };
    n.onError = 'continueRegularOutput';
  }
  // agentes: no abortar la corrida por un fallo puntual
  if (/langchain\.agent$/.test(n.type)) {
    n.onError = 'continueErrorOutput';
    // gpt-5.6 NO es soportado por el Agent v2 ("This model is not supported in 2 version
    // of the Agent node") -> Luna obliga a subir el nodo Agent a v3.1
    if (V.agentVer) { n.typeVersion = V.agentVer; n.parameters.options = n.parameters.options || {}; n.parameters.options.enableStreaming = false; }
  }
}

// ------------------------------------------------------------- nodos stub
const stub = (name, type, typeVersion, parameters, pos, extra = {}) =>
  ({ name, type, typeVersion, position: pos, parameters, ...extra });

const setNode = (name, assigns, pos) => stub(name, 'n8n-nodes-base.set', 3.4, {
  assignments: { assignments: assigns.map((a, i) => ({ id: name + '-' + i, name: a[0], value: a[1], type: a[2] || 'string' })) },
  options: {},
}, pos);

nodes.push(stub('WHATSAPPP', 'n8n-nodes-base.webhook', 2, {
  httpMethod: 'POST', path: WEBHOOK_PATH, responseMode: 'responseNode', options: {},
}, [-600, 0], { webhookId: WEBHOOK_PATH }));

// WHATSAPP1: el nodo que 75 expresiones del prompt referencian
nodes.push(setNode('WHATSAPP1', [
  ['name', "={{ $json.body.name }}"],
  ['last_input_text', "={{ $json.body.last_input_text }}"],
  ['whatsapp_phone', "={{ $json.body.whatsapp_phone }}"],
  ['body.id', "={{ $json.body.id }}"],
  ['body.key', "={{ $json.body.key }}"],
  ['fuente', 'whatsapp'],
  ['País Final', "={{ $json.body.pais }}"],
], [-400, 0]));

nodes.push(setNode('Texto Final', [['text', "={{ $('WHATSAPPP').item.json.body.last_input_text }}"]], [-220, 0]));
nodes.push(setNode('Code', [
  ['text', "={{ $('WHATSAPPP').item.json.body.last_input_text }}"],
  ['is_media', '={{ false }}', 'boolean'],
], [-60, 0]));
// Redis3: en produccion es un GET que devuelve [prevBot, prevIntent]; aca lo inyecta el harness
nodes.push(setNode('Redis3', [
  ['propertyName', "={{ [ $('WHATSAPPP').item.json.body.prev_bot || '', $('WHATSAPPP').item.json.body.prev_intent || '' ] }}", 'array'],
], [100, 0]));

// Redis4: en produccion es el push del carril; los prompts de ATC y Ventas leen su .output
nodes.push(setNode('Redis4', [['output', "={{ $('IA INTENCIÓN CLIENTE').item.json.output }}"]], [260, 0]));

// Los agentes exigen UNA sola key de entrada (la memoria falla con varias).
// Produccion lo resuelve con Edit Fields3/4/8; mismo nombre y misma semantica.
const noReg = { 'Edit Fields3': 'Pedir correo, cliente sin registro', 'Edit Fields4': 'Pedir correo, cliente sin registro', 'Edit Fields8': 'NO REGISTRADO' };
for (const [nm, alt] of Object.entries(noReg))
  nodes.push(setNode(nm, [['output', '={{ $json.data ? "Cliente registrado" : "' + alt + '" }}']], [900, 0]));

// ---- cadena de envio de Reconsumos (fix a validar) --------------------
// Redis6 -> If Skip Empty 3 -> Saludo Whatsapp.  El envio real a ManyChat se
// reemplaza por un ESPEJO que arma el mismo body y lo devuelve, sin postear.
if (process.env.RECONS_SEND === '1') {
  const live = JSON.parse(fs.readFileSync(SRC, 'utf8'));
  const LV = Object.fromEntries(live.nodes.map(n => [n.name, n]));

  // Redis6 real es un push cuyo output pasa el json de entrada.
  // force_empty permite ejercitar la rama de bloqueo del guard.
  nodes.push(setNode('Redis6', [
    ['output', "={{ $('WHATSAPPP').item.json.body.force_empty ? '' : $('Reconsumos').item.json.output }}"],
  ], [1100, 300]));

  // If Skip Empty 3 = copia EXACTA de las condiciones de If Skip Empty 1
  const guard = clone(LV['If Skip Empty 1']);
  guard.name = 'If Skip Empty 3'; delete guard.id; guard.position = [1250, 300];
  nodes.push(guard);

  // espejo del envio: mismo jsonBody que Saludo Whatsapp1 (el que SI stripea)
  nodes.push(setNode('Saludo Whatsapp SINK', [
    ['output', "={{ $('Reconsumos').item.json.output }}"],
    ['sent', '={{ true }}', 'boolean'],
    ['manychat_body', LV['Saludo Whatsapp1'].parameters.jsonBody],
  ], [1400, 250]));
  nodes.push(setNode('No Op If Skip Empty 3', [
    ['output', "={{ $('Reconsumos').item.json.output }}"],
    ['sent', '={{ false }}', 'boolean'],
    ['manychat_body', 'BLOQUEADO POR EL GUARD'],
  ], [1400, 400]));
}

nodes.push(stub('Respond', 'n8n-nodes-base.respondToWebhook', 1.1, {
  respondWith: 'json',
  responseBody: '={{ JSON.stringify({ output: $json.output ?? $json.error ?? null, sent: $json.sent ?? null, manychat_body: $json.manychat_body ?? null, intent: $(\'IA INTENCIÓN CLIENTE\').item.json.output, exec_id: $execution.id, variant: "' + VARIANT + '" }) }}',
  options: {},
}, [1500, 0]));

// ------------------------------------------------------------- conexiones
const conns = {};
const link = (from, to, type = 'main', outIdx = 0, inIdx = 0) => {
  conns[from] = conns[from] || {};
  conns[from][type] = conns[from][type] || [];
  while (conns[from][type].length <= outIdx) conns[from][type].push([]);
  conns[from][type][outIdx].push({ node: to, type, index: inIdx });
};

link('WHATSAPPP', 'WHATSAPP1');
link('WHATSAPP1', 'Texto Final');
link('Texto Final', 'Code');
link('Code', 'Redis3');
link('Redis3', 'IA INTENCIÓN CLIENTE');
link('IA INTENCIÓN CLIENTE', 'Redis4');
link('Redis4', 'Switch1');
link('IA INTENCIÓN CLIENTE', 'Respond', 'main', 1); // rama de error del agente

// Switch1 conserva el ruteo del vivo: 0,1,2 -> Reconsumos | 3,4,5,7 -> ATC | 6 -> Ventas
const liveSwitch = live.connections['Switch1'].main;
liveSwitch.forEach((outArr, i) => (outArr || []).forEach(c => link('Switch1', c.node, 'main', i)));

link('Info ATC', 'Edit Fields3');       link('Edit Fields3', 'ATC');
link('Info Ventas', 'Edit Fields8');    link('Edit Fields8', 'Ventas');
link('Info Reconsumos', 'Edit Fields4');link('Edit Fields4', 'Reconsumos');
for (const a of ['ATC', 'Ventas']) { link(a, 'Respond'); link(a, 'Respond', 'main', 1); }
if (process.env.RECONS_SEND === '1') {
  link('Reconsumos', 'Redis6'); link('Reconsumos', 'Respond', 'main', 1);
  link('Redis6', 'If Skip Empty 3');
  link('If Skip Empty 3', 'Saludo Whatsapp SINK', 'main', 0);
  link('If Skip Empty 3', 'No Op If Skip Empty 3', 'main', 1);
  link('Saludo Whatsapp SINK', 'Respond');
  link('No Op If Skip Empty 3', 'Respond');
} else {
  link('Reconsumos', 'Respond'); link('Reconsumos', 'Respond', 'main', 1);
}

// conexiones no-main (modelos, memoria, tools) copiadas del vivo, filtrando lo excluido
for (const [src, byType] of Object.entries(live.connections)) {
  for (const [ctype, outs] of Object.entries(byType)) {
    if (ctype === 'main') continue;
    outs.forEach((arr, i) => (arr || []).forEach(c => {
      if (!seen.has(src) || !seen.has(c.node)) return;
      if (WRITE_TOOLS.has(src)) return;
      link(src, c.node, ctype, i, c.index || 0);
    }));
  }
}

// ---------------------------------------------------------------- layout
let col = {};
nodes.forEach((n, i) => { if (!n.position) { const c = (col[n.type] = (col[n.type] || 0) + 1); n.position = [300 + (i % 6) * 220, -400 + c * 130]; } });

const wf = {
  name: 'TEST Luna — Agentes ATC (' + VARIANT + ')',
  nodes,
  connections: conns,
  settings: { executionOrder: 'v1', saveDataSuccessExecution: 'all', saveDataErrorExecution: 'all', callerPolicy: 'workflowsFromSameOwner' },
};

const outPath = path.join(__dirname, 'wf_' + VARIANT + '.json');
fs.writeFileSync(outPath, JSON.stringify(wf, null, 1));

// -------------------------------------------------------------- self-check
const names = new Set(nodes.map(n => n.name));
const problems = [];
for (const [src, byType] of Object.entries(conns)) {
  if (!names.has(src)) problems.push('conexion desde nodo inexistente: ' + src);
  for (const outs of Object.values(byType)) for (const arr of outs) for (const c of arr)
    if (!names.has(c.node)) problems.push('conexion hacia nodo inexistente: ' + c.node);
}
for (const n of nodes) for (const m of JSON.stringify(n.parameters).matchAll(/\$\('([^']+)'\)/g))
  if (!names.has(m[1])) problems.push('expresion en "' + n.name + '" referencia $(\'' + m[1] + '\') inexistente');
for (const t of WRITE_TOOLS) if (names.has(t)) problems.push('tool de escritura NO excluida: ' + t);

const uniq = [...new Set(problems)];
console.log('variante   :', VARIANT, '->', V.model, 'v' + V.ver, 'responsesApi=' + V.responses, 'effort=' + (V.effort || 'default'));
console.log('nodos      :', nodes.length, '| webhook path:', WEBHOOK_PATH);
console.log('archivo    :', outPath);
console.log('tools excl.:', [...WRITE_TOOLS].join(', '));
if (uniq.length) { console.log('\nPROBLEMAS (' + uniq.length + '):'); uniq.forEach(p => console.log('  -', p)); process.exitCode = 1; }
else console.log('\nself-check OK: sin refs rotas, sin tools de escritura');
