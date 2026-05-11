// Agrega "Laptop propia (Indispensable)" al workflow Closer Senior remoto (W1wk2gHhfp52Tuh3)

const https = require('https');
const fs = require('fs');

const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIzOGNhZmI2ZS1jMTA1LTQ2MjAtODMxYi03NzIxZjg3OGRiNjMiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiZDAzM2I4ZmQtNDU4ZS00ZGQyLTk4MmMtOGFjNjk1NDQxMWNlIiwiaWF0IjoxNzc0Mzg0NTUyfQ.Ln4wx1sGHAR6cBrg8DZYVzQTGBglm3MLUPRBJZtLyyU';
const HOST = 'n8n.manzanaverde.la';
const WF_ID = 'W1wk2gHhfp52Tuh3';

const aiLaptopBlock = `\n\nLaptop Propia: El candidato debe contar con laptop personal en buen estado para uso laboral. NOTA EVALUACIÓN: si el CV no menciona explícitamente la posesión de laptop, NO penalizar — este requisito se valida en entrevista. Solo penalizar (-0.10) si el CV indica explícitamente que NO cuenta con equipo propio.`;

const w = JSON.parse(fs.readFileSync('c:/Proyectos/n8n/closer_pre_laptop.json', 'utf8'));

// HTML: insertar <li> al final del <ul> de "¿Qué buscamos en ti?"
const html = w.nodes.find(n => n.type === 'n8n-nodes-base.html');
const oldBlock = `                <li><strong>Autonomía y Disponibilidad:</strong> Capacidad para trabajar desde casa con alta disciplina y proactividad. Disponibilidad inmediata.</li>\n            </ul>`;
const newBlock = `                <li><strong>Autonomía y Disponibilidad:</strong> Capacidad para trabajar desde casa con alta disciplina y proactividad. Disponibilidad inmediata.</li>\n                <li><strong>Laptop propia (Indispensable):</strong> Contar con laptop personal en buen estado para uso laboral diario (modalidad 100% remota).</li>\n            </ul>`;
if (!html.parameters.html.includes(oldBlock)) {
  console.error('ABORT: bloque HTML viejo no encontrado'); process.exit(1);
}
html.parameters.html = html.parameters.html.replace(oldBlock, newBlock);

// AI prompt: insertar después de "Modalidad de Trabajo:" línea
const ai = w.nodes.find(n => n.type === '@n8n/n8n-nodes-langchain.chainLlm');
const oldAi = 'Modalidad de Trabajo: Capacidad para trabajar con autonomía de manera 100% remota.';
const newAi = 'Modalidad de Trabajo: Capacidad para trabajar con autonomía de manera 100% remota.' + aiLaptopBlock;
if (!ai.parameters.text.includes(oldAi)) {
  console.error('ABORT: anchor AI prompt no encontrado'); process.exit(1);
}
ai.parameters.text = ai.parameters.text.replace(oldAi, newAi);

// Strip non-standard fields
w.nodes.forEach(n => { delete n.cid; delete n.creator; });

const payload = { name: w.name, nodes: w.nodes, connections: w.connections, settings: { executionOrder: w.settings?.executionOrder || 'v1' } };
const body = JSON.stringify(payload);

const req = https.request({
  host: HOST, path: '/api/v1/workflows/' + WF_ID, method: 'PUT',
  headers: { 'X-N8N-API-KEY': API_KEY, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
}, (res) => {
  let d=''; res.on('data',c=>d+=c); res.on('end',()=>{
    console.log('PUT Status:', res.statusCode);
    if (res.statusCode !== 200) console.log('Body:', d.slice(0, 800));
    else console.log('OK — Closer Senior actualizado.');
  });
});
req.on('error', e => console.error('ERR:', e.message));
req.write(body); req.end();
