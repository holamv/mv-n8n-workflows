// Fix Fase 5 — eliminar Code in JavaScript del path crítico.
// Hipótesis: el Code reasigna binary y eso cambia el internal filesystem path
// que el FormTrigger registró. Sin Code, Upload file lee binary directo
// del Application Form, sin intermediación.
//
// Cambios:
// 1. Connections: Application Form → [Upload file, If isPDF] (skip Code in JavaScript)
// 2. If isPDF: condición cambia de $json._fileExtension a binary fileName endsWith .pdf
// 3. Extract from File y Extraer Texto DOCX siguen leyendo `Cargar_CV` del input (que ahora viene
//    directamente del Application Form)
// 4. Code in JavaScript queda en el workflow pero desconectado (por si se necesita restaurar)

const https = require('https');
const fs = require('fs');

const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIzOGNhZmI2ZS1jMTA1LTQ2MjAtODMxYi03NzIxZjg3OGRiNjMiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiZDAzM2I4ZmQtNDU4ZS00ZGQyLTk4MmMtOGFjNjk1NDQxMWNlIiwiaWF0IjoxNzc0Mzg0NTUyfQ.Ln4wx1sGHAR6cBrg8DZYVzQTGBglm3MLUPRBJZtLyyU';
const HOST = 'n8n.manzanaverde.la';
const WF_ID = '3YLFYl7ZaYTQDuYa';

function fetchWf(id) {
  return new Promise((resolve, reject) => {
    https.request({ host: HOST, path: '/api/v1/workflows/' + id, headers: { 'X-N8N-API-KEY': API_KEY } }, (res) => {
      let d=''; res.on('data',c=>d+=c); res.on('end',()=>{
        if(res.statusCode!==200) return reject(new Error('GET '+res.statusCode));
        try{resolve(JSON.parse(d))}catch(e){reject(e)}
      });
    }).on('error', reject).end();
  });
}

(async () => {
  const w = await fetchWf(WF_ID);
  fs.writeFileSync('c:/Proyectos/n8n/_piura_pre_nocode.json', JSON.stringify(w, null, 2));

  // Cambiar If isPDF para evaluar filename (no _fileExtension del Code)
  const ifPdf = w.nodes.find(n => n.name === 'If isPDF');
  ifPdf.parameters = {
    conditions: {
      options: { caseSensitive: false, leftValue: '', typeValidation: 'strict', version: 2 },
      conditions: [{
        id: 'c67c93a5-3172-437c-90a5-f00c535ff701',
        leftValue: "={{ $('Application Form').item.binary.Cargar_CV.fileName }}",
        rightValue: '.pdf',
        operator: { type: 'string', operation: 'endsWith' },
      }],
      combinator: 'and',
    },
    options: {},
  };
  console.log('If isPDF: condition now reads $().binary.Cargar_CV.fileName endsWith .pdf');

  // Reescribir connections: skip Code in JavaScript
  w.connections['Application Form'] = {
    main: [[
      { node: 'Upload file', type: 'main', index: 0 },
      { node: 'If isPDF', type: 'main', index: 0 },
    ]],
  };
  // Code in JavaScript queda en el grafo pero sin conexiones de salida
  w.connections['Code in JavaScript'] = { main: [[]] };
  console.log('Connections: Application Form → [Upload file, If isPDF] (skip Code)');

  w.nodes.forEach(n => { delete n.cid; delete n.creator; });
  const payload = { name: w.name, nodes: w.nodes, connections: w.connections, settings: { executionOrder: w.settings?.executionOrder || 'v1' } };
  const body = JSON.stringify(payload);

  await new Promise((resolve, reject) => {
    const req = https.request({
      host: HOST, path: '/api/v1/workflows/' + WF_ID, method: 'PUT',
      headers: { 'X-N8N-API-KEY': API_KEY, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
    }, (res) => {
      let d=''; res.on('data',c=>d+=c); res.on('end',()=>{
        console.log('PUT:', res.statusCode, res.statusCode===200?'OK':d.slice(0,800));
        res.statusCode===200 ? resolve() : reject(new Error('PUT '+res.statusCode));
      });
    });
    req.on('error', reject);
    req.write(body); req.end();
  });
})().catch(e=>{console.error('FAIL:',e.message);process.exit(1);});
