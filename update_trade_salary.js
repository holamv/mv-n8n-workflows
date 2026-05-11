// Actualiza el sueldo en el workflow Trade Marketing (nkZyzT9z9KhTee61):
// Antes: "S/ 1,600 mensuales" + "Hasta S/ 500 adicionales por cumplimiento de metas"
// Ahora: "S/ 1,800 a S/ 2,300 según experiencia" (un solo bloque, sin comisiones aparte)

const https = require('https');
const fs = require('fs');

const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIzOGNhZmI2ZS1jMTA1LTQ2MjAtODMxYi03NzIxZjg3OGRiNjMiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiZDAzM2I4ZmQtNDU4ZS00ZGQyLTk4MmMtOGFjNjk1NDQxMWNlIiwiaWF0IjoxNzc0Mzg0NTUyfQ.Ln4wx1sGHAR6cBrg8DZYVzQTGBglm3MLUPRBJZtLyyU';
const HOST = 'n8n.manzanaverde.la';
const WF_ID = 'nkZyzT9z9KhTee61';

const src = JSON.parse(fs.readFileSync('c:/Proyectos/n8n/trade_backup_20260511.json', 'utf8'));

const html = src.nodes.find(n => n.type === 'n8n-nodes-base.html');
const oldBlock = `                <div class="grid-item"><strong>Sueldo Base</strong><p>S/ 1,600 mensuales asegurados.</p></div>
                <div class="grid-item"><strong>Comisiones</strong><p>Hasta S/ 500 adicionales por cumplimiento de metas y conversión del equipo.</p></div>`;
const newBlock = `                <div class="grid-item"><strong>Sueldo</strong><p>S/ 1,800 a S/ 2,300 según experiencia.</p></div>`;

if (!html.parameters.html.includes(oldBlock)) {
  console.error('ABORT: bloque antiguo NO encontrado tal cual. Revisar diff manualmente.');
  process.exit(1);
}
html.parameters.html = html.parameters.html.replace(oldBlock, newBlock);
console.log('HTML actualizado. Sueldo nuevo presente:', html.parameters.html.includes('S/ 1,800 a S/ 2,300 según experiencia'));
console.log('Old "1,600" sigue presente?', html.parameters.html.includes('1,600'));
console.log('Old "S/ 500" sigue presente?', html.parameters.html.includes('S/ 500'));

// Limpiar campos no estándar (PUT también los rechaza)
src.nodes.forEach(n => { delete n.cid; delete n.creator; });

const payload = {
  name: src.name,
  nodes: src.nodes,
  connections: src.connections,
  settings: { executionOrder: src.settings?.executionOrder || 'v1' },
};

const body = JSON.stringify(payload);
const req = https.request({
  host: HOST, path: '/api/v1/workflows/' + WF_ID, method: 'PUT',
  headers: {
    'X-N8N-API-KEY': API_KEY,
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body),
  },
}, (res) => {
  let d=''; res.on('data',c=>d+=c); res.on('end',()=>{
    console.log('PUT Status:', res.statusCode);
    if (res.statusCode !== 200) console.log('Body:', d.slice(0,1500));
    else console.log('OK — workflow actualizado.');
  });
});
req.on('error', e=>console.error('ERR:',e.message));
req.write(body); req.end();
