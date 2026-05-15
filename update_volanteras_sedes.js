// Filtra sedes en workflow Volantes (UHg9p4BGBHO36MSV) para dejar solo:
// - Jesús María
// - San Luis (Rosa Toro)
// - Surco (Guardia Civil)
// Quita: Surco (Encalada), Miraflores
// Aplica tanto a HTML landing como al dropdown del form.

const https = require('https');
const fs = require('fs');

const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIzOGNhZmI2ZS1jMTA1LTQ2MjAtODMxYi03NzIxZjg3OGRiNjMiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiZDAzM2I4ZmQtNDU4ZS00ZGQyLTk4MmMtOGFjNjk1NDQxMWNlIiwiaWF0IjoxNzc0Mzg0NTUyfQ.Ln4wx1sGHAR6cBrg8DZYVzQTGBglm3MLUPRBJZtLyyU';
const HOST = 'n8n.manzanaverde.la';
const WF_ID = 'UHg9p4BGBHO36MSV';

const w = JSON.parse(fs.readFileSync('c:/Proyectos/n8n/volanteras_backup.json','utf8'));

// 1) HTML — quitar las 2 sede-pills no deseadas
const html = w.nodes.find(n => n.name === 'HTML Landing');
let h = html.parameters.html;
const removeFromHtml = [
  '            <div class="sede-pill">Surco (Encalada)</div>\n',
  '            <div class="sede-pill">Miraflores</div>\n',
];
for (const block of removeFromHtml) {
  if (!h.includes(block)) {
    console.error('ABORT: bloque HTML no encontrado:', block.trim());
    process.exit(1);
  }
  h = h.replace(block, '');
}
html.parameters.html = h;
console.log('HTML: pills "Surco (Encalada)" y "Miraflores" eliminadas');

// 2) Form dropdown — filtrar fieldOptions del campo "Sede a la que postulas"
const form = w.nodes.find(n => n.name === 'Postulación Volantera');
const sedeField = form.parameters.formFields.values.find(f => f.fieldLabel === 'Sede a la que postulas');
if (!sedeField) { console.error('ABORT: campo Sede no encontrado'); process.exit(1); }
const keep = ['Jesús María', 'San Luis (Rosa Toro)', 'Surco (Guardia Civil)'];
const before = sedeField.fieldOptions.values.map(v => v.option).join(', ');
sedeField.fieldOptions.values = sedeField.fieldOptions.values.filter(v => keep.includes(v.option));
const after = sedeField.fieldOptions.values.map(v => v.option).join(', ');
console.log('Form dropdown sedes:');
console.log('  antes:', before);
console.log('  ahora:', after);

// Strip + PUT
w.nodes.forEach(n => { delete n.cid; delete n.creator; });
const payload = { name: w.name, nodes: w.nodes, connections: w.connections, settings: { executionOrder: w.settings?.executionOrder || 'v1' } };
const body = JSON.stringify(payload);

const req = https.request({
  host: HOST, path: '/api/v1/workflows/' + WF_ID, method: 'PUT',
  headers: { 'X-N8N-API-KEY': API_KEY, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
}, (res) => {
  let d=''; res.on('data',c=>d+=c); res.on('end',()=>{
    console.log('PUT:', res.statusCode, res.statusCode===200?'OK':d.slice(0,500));
  });
});
req.on('error', e => console.error('ERR:', e.message));
req.write(body); req.end();
