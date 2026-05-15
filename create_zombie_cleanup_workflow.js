// Crea workflow n8n "Zombie Cleanup" que corre semanal y limpia execs new viejas
const https = require('https');

const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIzOGNhZmI2ZS1jMTA1LTQ2MjAtODMxYi03NzIxZjg3OGRiNjMiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiZDAzM2I4ZmQtNDU4ZS00ZGQyLTk4MmMtOGFjNjk1NDQxMWNlIiwiaWF0IjoxNzc0Mzg0NTUyfQ.Ln4wx1sGHAR6cBrg8DZYVzQTGBglm3MLUPRBJZtLyyU';

function api(method, p, body) {
  return new Promise((res, rej) => {
    const data = body ? JSON.stringify(body) : null;
    const req = https.request({ hostname:'n8n.manzanaverde.la', path:p, method,
      headers: { 'X-N8N-API-KEY': API_KEY, 'Accept':'application/json', 'Content-Type':'application/json',
        ...(data?{'Content-Length':Buffer.byteLength(data)}:{}) }, timeout: 30000 },
    r => { let buf=''; r.on('data',c=>buf+=c); r.on('end',()=>{ try{res({status:r.statusCode,body:JSON.parse(buf)});}catch(e){res({status:r.statusCode,body:buf});} }); });
    req.on('error', rej); req.on('timeout',()=>{req.destroy(); rej(new Error('to'));});
    if (data) req.write(data); req.end();
  });
}

const CLEANUP_CODE = `// Zombie Cleanup — borra execs en status=new con ID < (maxId - SAFE_MARGIN)
// para mantener la DB sana sin afectar execs reales en cola.
const N8N_API_KEY = $('Set Tokens').first().json.N8N_API_KEY;
const BASE = 'https://n8n.manzanaverde.la/api/v1';
const SAFE_MARGIN = 1000; // preservar últimas 1000 IDs (~varias horas), por seguridad

async function call(method, path) {
  return await this.helpers.httpRequest({
    method, url: BASE + path,
    headers: { 'X-N8N-API-KEY': N8N_API_KEY },
    json: true, timeout: 20000,
    ignoreHttpStatusErrors: true,
  });
}

// 1. Encontrar ID más reciente
const recent = await call.call(this, 'GET', '/executions?limit=5');
let maxId = 0;
for (const e of (recent.data || [])) {
  if (parseInt(e.id) > maxId) maxId = parseInt(e.id);
}
const threshold = maxId - SAFE_MARGIN;

// 2. Iterar y borrar zombies
let totalDeleted = 0, totalFailed = 0;
for (let pass = 1; pass <= 10; pass++) {
  const zombies = [];
  let cursor = '';
  for (let p = 0; p < 20; p++) {
    const url = '/executions?limit=250&status=new' + (cursor ? '&cursor=' + cursor : '');
    let r;
    try { r = await call.call(this, 'GET', url); } catch (e) { break; }
    if (!r || !r.data) break;
    for (const e of r.data) {
      if (parseInt(e.id) < threshold) zombies.push(e.id);
    }
    if (!r.nextCursor) break;
    cursor = r.nextCursor;
  }
  if (zombies.length === 0) break;
  // delete en paralelo grupos de 5
  let passDeleted = 0;
  for (let i = 0; i < zombies.length; i += 5) {
    const chunk = zombies.slice(i, i + 5);
    const results = await Promise.all(chunk.map(id => call.call(this, 'DELETE', '/executions/' + id).catch(() => null)));
    for (const r of results) { if (r) passDeleted++; else totalFailed++; }
  }
  totalDeleted += passDeleted;
  if (passDeleted === 0) break; // no avance, salir
  // Sleep entre passes para no saturar
  await new Promise(r => setTimeout(r, 2000));
}

return [{ json: {
  timestamp: new Date().toISOString(),
  maxId,
  threshold,
  totalDeleted,
  totalFailed,
  summary: 'Zombie cleanup: ' + totalDeleted + ' execs eliminadas (umbral ID<' + threshold + ')',
}}];`;

(async () => {
  const workflow = {
    name: 'Zombie Cleanup Auto (semanal)',
    nodes: [
      {
        id: 'trig1',
        name: 'Cron domingo 3am Lima',
        type: 'n8n-nodes-base.scheduleTrigger',
        typeVersion: 1.3,
        position: [240, 300],
        parameters: {
          rule: { interval: [{ field: 'cronExpression', expression: '0 8 * * 0' }] }, // 8 UTC = 3am Lima domingo
        },
      },
      {
        id: 'set1',
        name: 'Set Tokens',
        type: 'n8n-nodes-base.set',
        typeVersion: 3.4,
        position: [460, 300],
        parameters: {
          mode: 'manual',
          assignments: {
            assignments: [
              { id: 'a1', name: 'N8N_API_KEY', value: API_KEY, type: 'string' },
            ],
          },
          includeOtherFields: false,
        },
      },
      {
        id: 'code1',
        name: 'Cleanup Zombies',
        type: 'n8n-nodes-base.code',
        typeVersion: 2,
        position: [680, 300],
        parameters: { jsCode: CLEANUP_CODE },
        retryOnFail: true,
        maxTries: 2,
        waitBetweenTries: 30000,
      },
      {
        id: 'man1',
        name: 'Test manual',
        type: 'n8n-nodes-base.manualTrigger',
        typeVersion: 1,
        position: [240, 480],
        parameters: {},
      },
    ],
    connections: {
      'Cron domingo 3am Lima': { main: [[{ node: 'Set Tokens', type: 'main', index: 0 }]] },
      'Test manual': { main: [[{ node: 'Set Tokens', type: 'main', index: 0 }]] },
      'Set Tokens': { main: [[{ node: 'Cleanup Zombies', type: 'main', index: 0 }]] },
    },
    settings: { executionOrder: 'v1', saveDataErrorExecution: 'all', saveDataSuccessExecution: 'all' },
  };

  console.log('Creating workflow...');
  const r = await api('POST', '/api/v1/workflows', workflow);
  console.log('Status: ' + r.status);
  if (r.status !== 200) { console.log('body:', JSON.stringify(r.body).slice(0,500)); return; }
  const id = r.body.id;
  console.log('Workflow ID: ' + id);

  console.log('Activating...');
  const a = await api('POST', '/api/v1/workflows/' + id + '/activate');
  console.log('Activate status: ' + a.status);
})();
