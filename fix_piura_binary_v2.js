// Fix Fase 2 — fuerza re-empaquetado del binary en memoria con prepareBinaryData.
// Si el problema es que el path filesystem-v2 del FormTrigger se invalida entre
// nodos (posible en queue mode multi-worker), esto debería resolverlo porque
// el Code carga el buffer y lo re-prepara como un binary fresh.
// Aplica solo al Piura (3YLFYl7ZaYTQDuYa) por instrucción del usuario.

const https = require('https');
const fs = require('fs');

const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIzOGNhZmI2ZS1jMTA1LTQ2MjAtODMxYi03NzIxZjg3OGRiNjMiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiZDAzM2I4ZmQtNDU4ZS00ZGQyLTk4MmMtOGFjNjk1NDQxMWNlIiwiaWF0IjoxNzc0Mzg0NTUyfQ.Ln4wx1sGHAR6cBrg8DZYVzQTGBglm3MLUPRBJZtLyyU';
const HOST = 'n8n.manzanaverde.la';
const WF_ID = '3YLFYl7ZaYTQDuYa';

const w = JSON.parse(fs.readFileSync('c:/Proyectos/n8n/_piura_now.json', 'utf8'));
fs.writeFileSync('c:/Proyectos/n8n/_piura_pre_binfix_v2.json', JSON.stringify(w, null, 2));

// 1. Code in JavaScript: forzar buffer-in-memory + prepareBinaryData
const code = w.nodes.find(n => n.name === 'Code in JavaScript');
code.parameters.jsCode = `// Carga el binary en memoria y lo re-empaqueta con prepareBinaryData.
// Esto evita que el path filesystem-v2 del FormTrigger quede stale entre nodos
// (especialmente en queue mode con multiples workers).
const items = $input.all();
const results = [];

for (let i = 0; i < items.length; i++) {
  const item = items[i];
  const cargarCV = item.binary?.Cargar_CV;
  if (!cargarCV) {
    throw new Error('No se adjunto ningun archivo CV. La postulacion requiere un CV.');
  }

  // Forzar lectura del archivo a Buffer en memoria del worker actual
  const buffer = await this.helpers.getBinaryDataBuffer(i, 'Cargar_CV');

  // Re-empaquetar como binary fresh (genera un nuevo path/handle local)
  const freshBinary = await this.helpers.prepareBinaryData(
    buffer,
    cargarCV.fileName,
    cargarCV.mimeType
  );

  const filename = cargarCV.fileName || '';
  const ext = filename.split('.').pop().toLowerCase();

  results.push({
    json: { ...item.json, _fileExtension: ext },
    binary: { Cargar_CV: freshBinary },
  });
}

return results;`;

// El Code mode debe permitir async/await. Verificar/setear si es necesario.
// Default es runOnceForAllItems con JS — async/await está OK.
console.log('Code mode:', code.parameters.mode || '(default runOnceForAllItems)');

// Strip non-standard fields
w.nodes.forEach(n => { delete n.cid; delete n.creator; });

const payload = { name: w.name, nodes: w.nodes, connections: w.connections, settings: { executionOrder: w.settings?.executionOrder || 'v1' } };
const body = JSON.stringify(payload);

const req = https.request({
  host: HOST, path: '/api/v1/workflows/' + WF_ID, method: 'PUT',
  headers: { 'X-N8N-API-KEY': API_KEY, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
}, (res) => {
  let d=''; res.on('data',c=>d+=c); res.on('end',()=>{
    console.log('PUT:', res.statusCode);
    if (res.statusCode !== 200) console.log('Body:', d.slice(0, 800));
    else console.log('OK — fase 2 aplicada en Piura.');
  });
});
req.on('error', e => console.error('ERR:', e.message));
req.write(body); req.end();
