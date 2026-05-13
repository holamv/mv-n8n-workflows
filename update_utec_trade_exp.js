// Cambios:
// 1. Closer Senior + Trade: quitar "(UTEC)" → dejar solo "Barranco, Lima"
// 2. Trade: agregar requisito de experiencia 2+ años + integrar laptop en bloque rico (no solo)

const https = require('https');
const fs = require('fs');

const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIzOGNhZmI2ZS1jMTA1LTQ2MjAtODMxYi03NzIxZjg3OGRiNjMiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiZDAzM2I4ZmQtNDU4ZS00ZGQyLTk4MmMtOGFjNjk1NDQxMWNlIiwiaWF0IjoxNzc0Mzg0NTUyfQ.Ln4wx1sGHAR6cBrg8DZYVzQTGBglm3MLUPRBJZtLyyU';
const HOST = 'n8n.manzanaverde.la';

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

// ================= CLOSER SENIOR =================
async function updateCloser() {
  const w = JSON.parse(fs.readFileSync('c:/Proyectos/n8n/closer_pre_utec.json','utf8'));
  console.log('\n=== Closer Senior Lima ===');
  const html = w.nodes.find(n => n.type === 'n8n-nodes-base.html');
  let h = html.parameters.html;
  const before = h;

  // Reemplazos de UTEC en HTML — replaceAll para evitar loops infinitos
  h = h.split('Barranco (oficinas UTEC)').join('Barranco, Lima');
  h = h.split('Barranco (UTEC)').join('Barranco, Lima');
  // limpiar dobles ", Lima, Lima"
  h = h.split(', Lima, Lima').join(', Lima');
  html.parameters.html = h;
  console.log('  HTML: UTEC removido. Cambios:', before !== h);

  // AI prompt
  const ai = w.nodes.find(n => n.type === '@n8n/n8n-nodes-langchain.chainLlm');
  const aiBefore = ai.parameters.text;
  ai.parameters.text = ai.parameters.text
    .replace('Barranco (UTEC)', 'Barranco, Lima')
    .replace('Barranco (oficinas UTEC)', 'Barranco, Lima');
  console.log('  AI prompt: UTEC removido. Cambios:', aiBefore !== ai.parameters.text);

  w.nodes.forEach(n => { delete n.cid; delete n.creator; });
  const payload = { name: w.name, nodes: w.nodes, connections: w.connections, settings: { executionOrder: w.settings?.executionOrder || 'v1' } };
  const r = await putWf('W1wk2gHhfp52Tuh3', payload);
  console.log('  PUT:', r.status, r.status===200?'OK':r.body.slice(0,300));
  if (r.status !== 200) throw new Error('Closer PUT failed');
}

// ================= TRADE MARKETING =================
async function updateTrade() {
  const w = JSON.parse(fs.readFileSync('c:/Proyectos/n8n/trade_pre_utec.json','utf8'));
  console.log('\n=== Trade Marketing ===');
  const html = w.nodes.find(n => n.type === 'n8n-nodes-base.html');
  let h = html.parameters.html;

  // 1. UTEC removal
  h = h.replace('Barranco (UTEC)', 'Barranco, Lima');

  // 2. Expandir el bloque de "Requisitos indispensables": agregar 2+ años de experiencia
  const oldReq = `            <p style="font-size: 1.1em; color: #2e7d32; margin-bottom: 10px;"><strong>Requisitos indispensables:</strong></p>
            <ul>
                <li><strong>Laptop propia:</strong> Contar con laptop personal en buen estado para uso laboral diario.</li>
            </ul>`;
  const newReq = `            <p style="font-size: 1.1em; color: #2e7d32; margin-bottom: 10px;"><strong>Requisitos indispensables:</strong></p>
            <ul>
                <li><strong>Experiencia mínima de 2 años</strong> en trade marketing, activaciones BTL, retail, ventas de campo, consumo masivo o franquicias.</li>
                <li><strong>Laptop propia:</strong> Contar con laptop personal en buen estado para uso laboral diario.</li>
                <li><strong>Disponibilidad presencial</strong> en Lima — oficina base en Barranco y movilidad a sedes en distintos distritos.</li>
            </ul>`;
  if (!h.includes(oldReq)) {
    throw new Error('Trade: bloque de requisitos viejo no encontrado tal cual');
  }
  h = h.replace(oldReq, newReq);
  html.parameters.html = h;
  console.log('  HTML: UTEC removido + bloque de requisitos expandido (2 años + laptop + presencial)');

  // AI prompt — agregar experiencia 2+ años + remover UTEC
  const ai = w.nodes.find(n => n.type === '@n8n/n8n-nodes-langchain.chainLlm');
  ai.parameters.text = ai.parameters.text.replace('Barranco (UTEC)', 'Barranco, Lima');

  // Inyectar el requisito de experiencia 2+ años en el bloque de Requisitos Esenciales del AI prompt
  // Buscamos un anchor común: "Requisitos Esenciales" o "Disponibilidad" — agregamos al inicio
  const experienciaBlock = `\n\nExperiencia mínima comprobada: Al menos 2 años en trade marketing, activaciones BTL, retail, consumo masivo, ventas de campo, gestión de promotores/impulsadoras, o roles afines.`;
  // Insertar después del título "Requisitos Esenciales" si existe
  if (ai.parameters.text.includes('Requisitos Esenciales')) {
    const re = /(Requisitos Esenciales[^\n]*\n?)/;
    if (re.test(ai.parameters.text)) {
      ai.parameters.text = ai.parameters.text.replace(re, '$1' + experienciaBlock);
      console.log('  AI prompt: experiencia 2+ años inyectada en Requisitos Esenciales');
    }
  } else {
    // Fallback: insertar antes de Laptop Propia si existe
    if (ai.parameters.text.includes('Laptop Propia:')) {
      ai.parameters.text = ai.parameters.text.replace('Laptop Propia:', experienciaBlock.trim() + '\n\nLaptop Propia:');
      console.log('  AI prompt: experiencia 2+ años inyectada antes de Laptop Propia');
    }
  }

  w.nodes.forEach(n => { delete n.cid; delete n.creator; });
  const payload = { name: w.name, nodes: w.nodes, connections: w.connections, settings: { executionOrder: w.settings?.executionOrder || 'v1' } };
  const r = await putWf('nkZyzT9z9KhTee61', payload);
  console.log('  PUT:', r.status, r.status===200?'OK':r.body.slice(0,300));
  if (r.status !== 200) throw new Error('Trade PUT failed');
}

(async () => {
  try { await updateCloser(); await updateTrade(); console.log('\nDone.'); }
  catch (e) { console.error('FAIL:', e.message); process.exit(1); }
})();
