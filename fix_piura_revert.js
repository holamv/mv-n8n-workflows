// Fix Fase 4 — revertir el Code a la versión simple sin async/getBinaryDataBuffer
// que está rompiendo el sandbox. Aumentar retries del Upload file.
// Si sigue fallando, próximo paso es reorganizar las connections.

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
  fs.writeFileSync('c:/Proyectos/n8n/_piura_pre_revert.json', JSON.stringify(w, null, 2));

  // 1. Revertir Code a versión simple (estilo Lima original — sin async)
  const code = w.nodes.find(n => n.name === 'Code in JavaScript');
  code.parameters.jsCode = `// Pasa el item del FormTrigger preservando el binary descriptor por referencia.
// Estilo simple sin async/await ni this.helpers — evita problemas de sandbox.
const formItem = $('Application Form').item;
const cargarCV = formItem.binary?.Cargar_CV;

if (!cargarCV) {
  throw new Error('No se adjunto ningun archivo CV. La postulacion requiere un CV.');
}

const filename = cargarCV.fileName || '';
const ext = filename.split('.').pop().toLowerCase();

return [{
  json: { ...formItem.json, _fileExtension: ext },
  binary: { Cargar_CV: cargarCV },
}];`;
  console.log('Code: reverted to simple sync version');

  // 2. Upload file — más retries y más espera
  const up = w.nodes.find(n => n.name === 'Upload file');
  up.retryOnFail = true;
  up.maxTries = 5;
  up.waitBetweenTries = 3000;
  console.log('Upload file: retryOnFail=5 tries, 3s between');

  // 3. Extract from File — más retries
  const ex = w.nodes.find(n => n.name === 'Extract from File');
  if (ex) {
    ex.retryOnFail = true;
    ex.maxTries = 5;
    ex.waitBetweenTries = 3000;
    console.log('Extract from File: retryOnFail=5 tries, 3s between');
  }

  w.nodes.forEach(n => { delete n.cid; delete n.creator; });
  const payload = { name: w.name, nodes: w.nodes, connections: w.connections, settings: { executionOrder: w.settings?.executionOrder || 'v1' } };
  const body = JSON.stringify(payload);

  await new Promise((resolve, reject) => {
    const req = https.request({
      host: HOST, path: '/api/v1/workflows/' + WF_ID, method: 'PUT',
      headers: { 'X-N8N-API-KEY': API_KEY, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
    }, (res) => {
      let d=''; res.on('data',c=>d+=c); res.on('end',()=>{
        console.log('PUT:', res.statusCode, res.statusCode===200?'OK':d.slice(0,500));
        res.statusCode===200 ? resolve() : reject(new Error('PUT '+res.statusCode));
      });
    });
    req.on('error', reject);
    req.write(body); req.end();
  });
})().catch(e=>{console.error('FAIL:',e.message); process.exit(1);});
