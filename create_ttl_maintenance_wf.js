// Crea el workflow `redis-ttl-maintenance` en n8n.
// Schedule diario 04:00 UTC → Code node con ioredis que aplica TTL a keys sin TTL.

const https = require('https');
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIzOGNhZmI2ZS1jMTA1LTQ2MjAtODMxYi03NzIxZjg3OGRiNjMiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiZDAzM2I4ZmQtNDU4ZS00ZGQyLTk4MmMtOGFjNjk1NDQxMWNlIiwiaWF0IjoxNzc0Mzg0NTUyfQ.Ln4wx1sGHAR6cBrg8DZYVzQTGBglm3MLUPRBJZtLyyU';

const codeJs = `
// Apply TTL to keys without TTL based on pattern.
// Uses the global Redis client n8n provides? No — we need raw access via ioredis if available.
const Redis = require('ioredis');

const redis = new Redis({
  host: 'redis-16865.c8.us-east-1-4.ec2.cloud.redislabs.com',
  port: 16865,
  password: 'SxA1vwSf8NvuKXknACJmEuk1ZiCjJVic',
  connectTimeout: 15000,
  maxRetriesPerRequest: 3,
});

const TTL_RULES = [
  { test: k => /^user:/.test(k),               ttl: 14 * 86400, label: 'user:*' },
  { test: k => /^intencion_/.test(k),          ttl: 14 * 86400, label: 'intencion_*' },
  { test: k => /^Datos_/.test(k),              ttl: 30 * 86400, label: 'Datos_*' },
  { test: k => /^tpl_primer_pedido_/.test(k),  ttl: 30 * 86400, label: 'tpl_primer_pedido_*' },
  { test: k => /^\\d+$/.test(k),                 ttl: 14 * 86400, label: '<numeric_id>' },
];

const stats = {};
TTL_RULES.forEach(r => { stats[r.label] = 0; });
let cursor = '0', scanned = 0, totalApplied = 0;

try {
  do {
    const [next, keys] = await redis.scan(cursor, 'COUNT', 1000);
    cursor = next;
    if (!keys.length) continue;
    scanned += keys.length;

    const ttlPipe = redis.pipeline();
    keys.forEach(k => ttlPipe.ttl(k));
    const ttlRes = await ttlPipe.exec();

    const exPipe = redis.pipeline();
    const expiring = [];
    for (let i = 0; i < keys.length; i++) {
      const ttl = ttlRes[i][1];
      if (ttl !== -1) continue;
      const rule = TTL_RULES.find(r => r.test(keys[i]));
      if (!rule) continue;
      exPipe.expire(keys[i], rule.ttl);
      expiring.push(rule.label);
    }
    if (expiring.length) {
      const res = await exPipe.exec();
      for (let i = 0; i < expiring.length; i++) {
        if (res[i][1] === 1) { stats[expiring[i]]++; totalApplied++; }
      }
    }
  } while (cursor !== '0');
} finally {
  await redis.quit();
}

return [{ json: { ts: new Date().toISOString(), scanned, totalApplied, byPattern: stats } }];
`;

const workflow = {
  name: 'redis-ttl-maintenance',
  nodes: [
    {
      parameters: {
        rule: { interval: [ { field: 'cronExpression', expression: '0 4 * * *' } ] }
      },
      id: 'b8a1c0d0-1111-2222-3333-444444444401',
      name: 'Daily 04:00 UTC',
      type: 'n8n-nodes-base.scheduleTrigger',
      typeVersion: 1.2,
      position: [240, 300]
    },
    {
      parameters: {
        language: 'javaScript',
        jsCode: codeJs.trim()
      },
      id: 'b8a1c0d0-1111-2222-3333-444444444402',
      name: 'Apply TTL',
      type: 'n8n-nodes-base.code',
      typeVersion: 2,
      position: [480, 300]
    }
  ],
  connections: {
    'Daily 04:00 UTC': { main: [[{ node: 'Apply TTL', type: 'main', index: 0 }]] }
  },
  settings: { executionOrder: 'v1' }
};

(async () => {
  const body = JSON.stringify(workflow);
  const result = await new Promise((res, rej) => {
    const req = https.request({
      hostname: 'n8n.manzanaverde.la',
      path: '/api/v1/workflows',
      method: 'POST',
      headers: { 'X-N8N-API-KEY': KEY, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
    }, (r) => { const c = []; r.on('data', d => c.push(d)); r.on('end', () => res({ status: r.statusCode, body: Buffer.concat(c).toString() })); });
    req.on('error', rej); req.write(body); req.end();
  });
  console.log('POST status:', result.status);
  console.log('body:', result.body.substring(0, 1000));
  if (result.status === 200 || result.status === 201) {
    const wf = JSON.parse(result.body);
    console.log('CREATED workflow id:', wf.id);
    require('fs').writeFileSync('redis_ttl_maintenance_wf.json', JSON.stringify(wf, null, 2));
  }
})().catch(e => { console.error(e); process.exit(1); });
