// Deploy a produccion del Agente ATC. Uso: node _luna_test/deploy_prod.js <payload.json>
const fs = require('fs'), https = require('https');
const KEY = fs.readFileSync('C:/Users/cheve/.claude/projects/c--Proyectos-n8n/memory/reference_n8n_api.md', 'utf8')
  .match(/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9[A-Za-z0-9._-]+/)[0];
const WF = 'R81I6h5KWtyNaDAy';
const src = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));

const api = (method, p, body) => new Promise((res, rej) => {
  const data = body ? JSON.stringify(body) : null;
  const req = https.request({ hostname: 'n8n.manzanaverde.la', path: '/api/v1' + p, method,
    headers: { 'X-N8N-API-KEY': KEY, 'Content-Type': 'application/json', ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}) }, timeout: 180000 },
    r => { let b = ''; r.on('data', c => b += c); r.on('end', () => { try { res({ status: r.statusCode, body: JSON.parse(b) }); } catch { res({ status: r.statusCode, body: b }); } }); });
  req.on('error', rej); req.on('timeout', () => req.destroy(new Error('timeout')));
  if (data) req.write(data); req.end();
});

(async () => {
  const payload = { name: src.name, nodes: src.nodes, connections: src.connections,
    settings: { executionOrder: src.settings?.executionOrder || 'v1' } };
  console.log('PUT', WF, '| nodos', payload.nodes.length, '|', new Date().toISOString());
  const up = await api('PUT', `/workflows/${WF}`, payload);
  console.log('  status', up.status, up.status >= 300 ? JSON.stringify(up.body).slice(0, 600) : 'OK');
  if (up.status >= 300) process.exit(1);

  const after = await api('GET', `/workflows/${WF}`);
  const w = after.body;
  console.log('\nverificacion post-deploy:');
  console.log('  active:', w.active, '| updatedAt:', w.updatedAt, '| nodos:', w.nodes.length);
  for (const n of w.nodes) {
    if (/langchain\.agent$/.test(n.type)) {
      const sm = n.parameters?.options?.systemMessage || '';
      console.log(`   ${n.name.padEnd(22)} v${n.typeVersion} | scope:${sm.includes('REGLA DE ÁMBITO — SOLO MANZANA VERDE') ? 'SI' : 'no'} | ${sm.length} chars`);
    }
    if (/lmChatOpenAi/.test(n.type))
      console.log(`   ${n.name.padEnd(22)} v${n.typeVersion} | ${n.parameters.model.value} | responses:${n.parameters.responsesApiEnabled ?? '-'} | effort:${n.parameters.options?.reasoningEffort ?? '-'} | retry:${n.retryOnFail ?? '-'}`);
  }
  console.log('\ndeployTime (UTC) para filtrar ejecuciones:', new Date().toISOString());
})();
