// Mueve el bloque "Requisitos indispensables" en Trade Marketing
// desde dentro de "¿Qué buscamos en ti?" → a justo antes de "Condiciones y Beneficios"
// (la sección de los cuadros).

const https = require('https');
const fs = require('fs');

const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIzOGNhZmI2ZS1jMTA1LTQ2MjAtODMxYi03NzIxZjg3OGRiNjMiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiZDAzM2I4ZmQtNDU4ZS00ZGQyLTk4MmMtOGFjNjk1NDQxMWNlIiwiaWF0IjoxNzc0Mzg0NTUyfQ.Ln4wx1sGHAR6cBrg8DZYVzQTGBglm3MLUPRBJZtLyyU';
const HOST = 'n8n.manzanaverde.la';
const WF_ID = 'nkZyzT9z9KhTee61';

const w = JSON.parse(fs.readFileSync('c:/Proyectos/n8n/trade_pre_move.json','utf8'));
const html = w.nodes.find(n => n.type === 'n8n-nodes-base.html');
let h = html.parameters.html;

// 1) Bloque actual a remover (con saltos de línea exactos)
const oldBlock = `            <p style="font-size: 1.1em; color: #2e7d32; margin-bottom: 10px;"><strong>Requisitos indispensables:</strong></p>
            <ul>
                <li><strong>Experiencia mínima de 2 años</strong> en trade marketing, activaciones BTL, retail, ventas de campo, consumo masivo o franquicias.</li>
                <li><strong>Laptop propia:</strong> Contar con laptop personal en buen estado para uso laboral diario.</li>
                <li><strong>Disponibilidad presencial</strong> en Lima — oficina base en Barranco y movilidad a sedes en distintos distritos.</li>
            </ul>
`;

if (!h.includes(oldBlock)) {
  console.error('ABORT: bloque actual no encontrado tal cual');
  process.exit(1);
}

// 2) Lo quito de su posición actual
h = h.replace(oldBlock, '');

// 3) Lo inserto antes de "Condiciones y Beneficios" con su propio h3
const insertAnchor = `            <h3>Condiciones y Beneficios</h3>`;
const newBlock = `            <h3>Requisitos Indispensables</h3>
            <ul>
                <li><strong>Experiencia mínima de 2 años</strong> en trade marketing, activaciones BTL, retail, ventas de campo, consumo masivo o franquicias.</li>
                <li><strong>Laptop propia:</strong> Contar con laptop personal en buen estado para uso laboral diario.</li>
                <li><strong>Disponibilidad presencial</strong> en Lima — oficina base en Barranco y movilidad a sedes en distintos distritos.</li>
            </ul>

            <h3>Condiciones y Beneficios</h3>`;

if (!h.includes(insertAnchor)) {
  console.error('ABORT: anchor Condiciones y Beneficios no encontrado');
  process.exit(1);
}
h = h.replace(insertAnchor, newBlock);

html.parameters.html = h;
console.log('Bloque movido. "Requisitos Indispensables" ahora antes de "Condiciones y Beneficios"');

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
