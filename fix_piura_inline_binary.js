// Fix Fase 3 — convertir el binary a INLINE base64 dentro del Code in JavaScript.
// Esto evita por completo el filesystem-v2 stale path bug:
// el binary descriptor que se pasa al Upload file NO referencia un archivo en disco,
// lleva los bytes directamente en el campo `data` (base64).
// Funciona cross-worker porque viaja como parte del item.

const https = require('https');
const fs = require('fs');

const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIzOGNhZmI2ZS1jMTA1LTQ2MjAtODMxYi03NzIxZjg3OGRiNjMiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiZDAzM2I4ZmQtNDU4ZS00ZGQyLTk4MmMtOGFjNjk1NDQxMWNlIiwiaWF0IjoxNzc0Mzg0NTUyfQ.Ln4wx1sGHAR6cBrg8DZYVzQTGBglm3MLUPRBJZtLyyU';
const HOST = 'n8n.manzanaverde.la';
const WF_ID = '3YLFYl7ZaYTQDuYa';

const w = JSON.parse(fs.readFileSync('c:/Proyectos/n8n/_piura_latest.json', 'utf8'));
fs.writeFileSync('c:/Proyectos/n8n/_piura_pre_inline.json', JSON.stringify(w, null, 2));

const code = w.nodes.find(n => n.name === 'Code in JavaScript');
code.parameters.jsCode = `// Lee el CV del FormTrigger y lo convierte a INLINE base64.
// Esto elimina la dependencia del path filesystem-v2 (que se invalida
// en queue mode multi-worker o por cleanup), porque el binary viaja
// como bytes dentro del item (no como referencia a archivo en disco).
const items = $input.all();
const results = [];

for (let i = 0; i < items.length; i++) {
  const item = items[i];
  const cargarCV = item.binary?.Cargar_CV;
  if (!cargarCV) {
    throw new Error('No se adjunto ningun archivo CV. La postulacion requiere un CV.');
  }

  // Carga el contenido del archivo a memoria como Buffer
  const buffer = await this.helpers.getBinaryDataBuffer(i, 'Cargar_CV');

  // Construye binary descriptor INLINE (data:base64, sin filesystem path)
  const inlineBinary = {
    data: buffer.toString('base64'),
    mimeType: cargarCV.mimeType,
    fileName: cargarCV.fileName,
    fileExtension: cargarCV.fileExtension,
    fileType: cargarCV.fileType,
  };

  const filename = cargarCV.fileName || '';
  const ext = filename.split('.').pop().toLowerCase();

  results.push({
    json: { ...item.json, _fileExtension: ext },
    binary: { Cargar_CV: inlineBinary },
  });
}

return results;`;

w.nodes.forEach(n => { delete n.cid; delete n.creator; });
const payload = { name: w.name, nodes: w.nodes, connections: w.connections, settings: { executionOrder: w.settings?.executionOrder || 'v1' } };
const body = JSON.stringify(payload);

const req = https.request({
  host: HOST, path: '/api/v1/workflows/' + WF_ID, method: 'PUT',
  headers: { 'X-N8N-API-KEY': API_KEY, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
}, (res) => {
  let d=''; res.on('data',c=>d+=c); res.on('end',()=>{
    console.log('PUT:', res.statusCode, res.statusCode===200?'OK':d.slice(0,800));
  });
});
req.on('error', e => console.error('ERR:', e.message));
req.write(body); req.end();
