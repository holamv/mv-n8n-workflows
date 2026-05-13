// Reemplaza el bloque de Sueldo/Comisiones por "Remuneración: A convenir de acuerdo a expectativas"
// en Closer Senior (W1wk2gHhfp52Tuh3) y Trade Marketing (nkZyzT9z9KhTee61).

const https = require('https');
const fs = require('fs');

const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIzOGNhZmI2ZS1jMTA1LTQ2MjAtODMxYi03NzIxZjg3OGRiNjMiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiZDAzM2I4ZmQtNDU4ZS00ZGQyLTk4MmMtOGFjNjk1NDQxMWNlIiwiaWF0IjoxNzc0Mzg0NTUyfQ.Ln4wx1sGHAR6cBrg8DZYVzQTGBglm3MLUPRBJZtLyyU';
const HOST = 'n8n.manzanaverde.la';

const NEW_BLOCK = `                <div class="grid-item"><strong>Remuneración</strong><p>A convenir de acuerdo a expectativas.</p></div>`;

function putWf(id, payload) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(payload);
    const req = https.request({
      host: HOST, path: '/api/v1/workflows/' + id, method: 'PUT',
      headers: { 'X-N8N-API-KEY': API_KEY, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
    }, (res) => {
      let d=''; res.on('data',c=>d+=c); res.on('end',()=>resolve({status:res.statusCode, body:d}));
    });
    req.on('error', reject);
    req.write(body); req.end();
  });
}

async function update(file, id, oldBlock, label) {
  const w = JSON.parse(fs.readFileSync(`c:/Proyectos/n8n/${file}.json`, 'utf8'));
  const html = w.nodes.find(n => n.type === 'n8n-nodes-base.html');

  if (!html.parameters.html.includes(oldBlock)) {
    throw new Error(`${label}: bloque viejo no encontrado`);
  }
  html.parameters.html = html.parameters.html.replace(oldBlock, NEW_BLOCK);
  console.log(`${label}: bloque reemplazado`);
  console.log(`  Sueldo S/ aún presente?`, html.parameters.html.includes('S/ 2,500') || html.parameters.html.includes('S/ 1,200') || html.parameters.html.includes('S/ 1,800') || html.parameters.html.includes('S/ 2,300'));
  console.log(`  "A convenir" presente?`, html.parameters.html.includes('A convenir'));

  w.nodes.forEach(n => { delete n.cid; delete n.creator; });
  const payload = { name: w.name, nodes: w.nodes, connections: w.connections, settings: { executionOrder: w.settings?.executionOrder || 'v1' } };
  const r = await putWf(id, payload);
  console.log(`  PUT ${label}:`, r.status, r.status===200?'OK':r.body.slice(0, 400));
  if (r.status !== 200) throw new Error('PUT failed');
}

(async () => {
  // Closer Senior — bloque doble (Sueldo Base + Comisiones)
  const closerOld = `                <div class="grid-item"><strong>Sueldo Base</strong><p>S/ 2,500 mensuales asegurados.</p></div>
                <div class="grid-item"><strong>Comisiones</strong><p>Hasta S/ 1,200 adicionales por superación de metas.</p></div>`;
  await update('closer_pre_salary', 'W1wk2gHhfp52Tuh3', closerOld, 'Closer Senior');

  // Trade — bloque único de sueldo
  const tradeOld = `                <div class="grid-item"><strong>Sueldo</strong><p>S/ 1,800 a S/ 2,300 según experiencia.</p></div>`;
  await update('trade_pre_salary', 'nkZyzT9z9KhTee61', tradeOld, 'Trade Marketing');

  console.log('\nDone.');
})().catch(e => { console.error('FAIL:', e.message); process.exit(1); });
