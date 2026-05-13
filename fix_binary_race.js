// Fix race condition de binary entre Upload file y If isPDF en los workflows
// Senior Closer (W1wk2gHhfp52Tuh3) y Piura (3YLFYl7ZaYTQDuYa).
//
// Cambios:
// 1. retryOnFail en Upload file (3 intentos, 2s between)
// 2. Reorganización: Code → Upload → If isPDF (serial). Para que If isPDF mantenga
//    el binary, usa $('Code in JavaScript').first() implícitamente — pero como
//    Extract from File necesita binary y Upload file no lo propaga, agregamos
//    un nodo intermedio.
//
// Approach simple: serializar Code → Upload → If isPDF, y modificar el código
// del Code para que el binary se mantenga en una clave Y configurar Extract
// para leer del Application Form directamente.
//
// MEJOR APPROACH (menos invasivo): cambiar "Code in JavaScript" para usar
// $input.item (preserva binary path) + retry en Upload file.

const https = require('https');
const fs = require('fs');

const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIzOGNhZmI2ZS1jMTA1LTQ2MjAtODMxYi03NzIxZjg3OGRiNjMiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiZDAzM2I4ZmQtNDU4ZS00ZGQyLTk4MmMtOGFjNjk1NDQxMWNlIiwiaWF0IjoxNzc0Mzg0NTUyfQ.Ln4wx1sGHAR6cBrg8DZYVzQTGBglm3MLUPRBJZtLyyU';
const HOST = 'n8n.manzanaverde.la';

const TARGETS = [
  { id: '3YLFYl7ZaYTQDuYa', name: 'Piura' },
];

function fetchWf(id) {
  return new Promise((resolve, reject) => {
    https.request({ host: HOST, path: '/api/v1/workflows/' + id, headers: { 'X-N8N-API-KEY': API_KEY } }, (res) => {
      let d=''; res.on('data',c=>d+=c); res.on('end',()=>{
        if (res.statusCode !== 200) return reject(new Error('GET '+id+' status='+res.statusCode+' body='+d.slice(0,300)));
        try{ const j=JSON.parse(d); if(!Array.isArray(j.nodes)) return reject(new Error('no nodes array')); resolve(j); }
        catch(e){ reject(new Error('parse: '+e.message)); }
      });
    }).on('error', reject).end();
  });
}

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

async function applyFix(target) {
  console.log(`\n=== ${target.name} (${target.id}) ===`);
  const w = await fetchWf(target.id);

  // Backup
  fs.writeFileSync(`c:/Proyectos/n8n/_${target.name.replace(/ /g,'_')}_pre_binfix.json`, JSON.stringify(w, null, 2));

  // 1. retryOnFail en Upload file
  const upload = w.nodes.find(n => n.name === 'Upload file');
  if (!upload) throw new Error('No Upload file node');
  upload.retryOnFail = true;
  upload.maxTries = 3;
  upload.waitBetweenTries = 2000;
  console.log('  Upload file: retryOnFail enabled (3 tries, 2s between)');

  // 2. Cambiar el Code in JavaScript a propagación por referencia del item completo
  const code = w.nodes.find(n => n.name === 'Code in JavaScript');
  if (!code) throw new Error('No Code node');
  code.parameters.jsCode = `// Propaga el item completo del FormTrigger preservando binarios por referencia.
// Esto evita race conditions cuando dos nodos en paralelo leen el binary del filesystem.
const item = $input.item;
const cargarCV = item.binary?.Cargar_CV;

if (!cargarCV) {
  throw new Error('No se adjunto ningun archivo CV. La postulacion requiere un CV.');
}

const filename = cargarCV.fileName || '';
const ext = filename.split('.').pop().toLowerCase();

return [{
  json: { ...item.json, _fileExtension: ext },
  binary: item.binary,  // referencia completa al binary del FormTrigger
}];`;
  console.log('  Code in JavaScript: usa $input.item para preservar binary descriptor original');

  // 3. retryOnFail también en Extract from File (defensivo)
  const extract = w.nodes.find(n => n.name === 'Extract from File');
  if (extract) {
    extract.retryOnFail = true;
    extract.maxTries = 3;
    extract.waitBetweenTries = 2000;
    console.log('  Extract from File: retryOnFail enabled');
  }

  // Strip non-standard fields
  w.nodes.forEach(n => { delete n.cid; delete n.creator; });

  const payload = { name: w.name, nodes: w.nodes, connections: w.connections, settings: { executionOrder: w.settings?.executionOrder || 'v1' } };
  const r = await putWf(target.id, payload);
  console.log('  PUT:', r.status, r.status===200?'OK':r.body.slice(0,400));
  if (r.status !== 200) throw new Error('PUT failed for ' + target.name);
}

(async () => {
  for (const t of TARGETS) {
    try { await applyFix(t); }
    catch (e) { console.error(`FAIL ${t.name}:`, e.message); process.exit(1); }
  }
  console.log('\nAll fixes applied.');
})();
