// Crea/actualiza + activa el workflow de prueba. Uso: node _luna_test/deploy.js <variant>
const fs = require('fs'), path = require('path'), https = require('https');
const VARIANT = process.argv[2] || 'baseline';
const KEY = fs.readFileSync('C:/Users/cheve/.claude/projects/c--Proyectos-n8n/memory/reference_n8n_api.md', 'utf8')
  .match(/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9[A-Za-z0-9._-]+/)[0];
const STATE = path.join(__dirname, 'state.json');
const state = fs.existsSync(STATE) ? JSON.parse(fs.readFileSync(STATE, 'utf8')) : {};

const api = (method, p, body) => new Promise((res, rej) => {
  const data = body ? JSON.stringify(body) : null;
  const req = https.request({
    hostname: 'n8n.manzanaverde.la', path: '/api/v1' + p, method,
    headers: { 'X-N8N-API-KEY': KEY, 'Content-Type': 'application/json', ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}) },
    timeout: 120000,
  }, r => { let b = ''; r.on('data', c => b += c); r.on('end', () => { try { res({ status: r.statusCode, body: JSON.parse(b) }); } catch { res({ status: r.statusCode, body: b }); } }); });
  req.on('error', rej); req.on('timeout', () => req.destroy(new Error('timeout')));
  if (data) req.write(data); req.end();
});

(async () => {
  const wf = JSON.parse(fs.readFileSync(path.join(__dirname, 'wf_' + VARIANT + '.json'), 'utf8'));
  const payload = { name: wf.name, nodes: wf.nodes, connections: wf.connections, settings: wf.settings };
  let id = state['wf'];

  if (id) {
    const de = await api('POST', `/workflows/${id}/deactivate`);
    console.log('deactivate', de.status);
    const up = await api('PUT', `/workflows/${id}`, payload);
    console.log('update', up.status, up.status >= 300 ? JSON.stringify(up.body).slice(0, 500) : '');
    if (up.status >= 300) process.exit(1);
  } else {
    const cr = await api('POST', '/workflows', payload);
    console.log('create', cr.status, cr.status >= 300 ? JSON.stringify(cr.body).slice(0, 800) : '');
    if (cr.status >= 300) process.exit(1);
    id = cr.body.id; state['wf'] = id; fs.writeFileSync(STATE, JSON.stringify(state, null, 1));
  }

  const act = await api('POST', `/workflows/${id}/activate`);
  console.log('activate', act.status, act.status >= 300 ? JSON.stringify(act.body).slice(0, 500) : 'OK');
  console.log('workflow id:', id);
  console.log('webhook    : https://n8n.manzanaverde.la/webhook/luna-test-8f3a21c0-atc');
})();
