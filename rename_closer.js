// Renombra el workflow Closer Senior y cambia "Dominio de Ventas Remotas" → "Dominio Comercial Multicanal".

const https = require('https');
const fs = require('fs');

const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIzOGNhZmI2ZS1jMTA1LTQ2MjAtODMxYi03NzIxZjg3OGRiNjMiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiZDAzM2I4ZmQtNDU4ZS00ZGQyLTk4MmMtOGFjNjk1NDQxMWNlIiwiaWF0IjoxNzc0Mzg0NTUyfQ.Ln4wx1sGHAR6cBrg8DZYVzQTGBglm3MLUPRBJZtLyyU';
const HOST = 'n8n.manzanaverde.la';
const WF_ID = 'W1wk2gHhfp52Tuh3';

const w = JSON.parse(fs.readFileSync('c:/Proyectos/n8n/closer_pre_rename.json', 'utf8'));

// 1. Cambiar título del `<li>`
const html = w.nodes.find(n => n.type === 'n8n-nodes-base.html');
const old = '<li><strong>Dominio de Ventas Remotas:</strong> Experiencia exitosa cerrando ventas en canales digitales y telefónicos usando CRMs (HubSpot, Salesforce, etc.) y plataformas omnicanal.</li>';
const neo = '<li><strong>Dominio Comercial Multicanal:</strong> Experiencia exitosa cerrando ventas presenciales y por canales digitales/telefónicos usando CRMs (HubSpot, Salesforce, etc.) y plataformas omnicanal.</li>';
if (!html.parameters.html.includes(old)) {
  console.error('ABORT: bloque viejo no encontrado'); process.exit(1);
}
html.parameters.html = html.parameters.html.replace(old, neo);
console.log('HTML: "Dominio de Ventas Remotas" → "Dominio Comercial Multicanal"');

// 2. Renombrar workflow
const oldName = w.name;
const newName = 'Filtro de CVs Ejecutivo de Ventas Senior Lima';
console.log(`Workflow name: "${oldName}" → "${newName}"`);

// Strip non-standard
w.nodes.forEach(n => { delete n.cid; delete n.creator; });

const payload = { name: newName, nodes: w.nodes, connections: w.connections, settings: { executionOrder: w.settings?.executionOrder || 'v1' } };
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
