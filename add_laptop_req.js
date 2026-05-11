// Agrega "laptop propia" como requisito indispensable en:
//   - 3YLFYl7ZaYTQDuYa (Filtro de CVs Ventas Senior Piura)
//   - nkZyzT9z9KhTee61 (Filtro de CVs LIDER DE TRADE - Coordinador Trade Marketing)

const https = require('https');
const fs = require('fs');

const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIzOGNhZmI2ZS1jMTA1LTQ2MjAtODMxYi03NzIxZjg3OGRiNjMiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiZDAzM2I4ZmQtNDU4ZS00ZGQyLTk4MmMtOGFjNjk1NDQxMWNlIiwiaWF0IjoxNzc0Mzg0NTUyfQ.Ln4wx1sGHAR6cBrg8DZYVzQTGBglm3MLUPRBJZtLyyU';
const HOST = 'n8n.manzanaverde.la';

const aiLaptopBlock = `\n\nLaptop Propia: El candidato debe contar con laptop personal en buen estado para uso laboral. NOTA EVALUACIÓN: si el CV no menciona explícitamente la posesión de laptop, NO penalizar — este requisito se valida en entrevista. Solo penalizar (-0.10) si el CV indica explícitamente que NO cuenta con equipo propio.`;

function fetchWf(id) {
  return new Promise((resolve, reject) => {
    https.request({
      host: HOST, path: '/api/v1/workflows/' + id,
      headers: { 'X-N8N-API-KEY': API_KEY },
    }, (res) => {
      let d=''; res.on('data',c=>d+=c); res.on('end',()=>{
        if (res.statusCode !== 200) return reject(new Error('GET '+id+' status='+res.statusCode+' body='+d.slice(0,300)));
        try{
          const j=JSON.parse(d);
          if(!Array.isArray(j.nodes)) return reject(new Error('GET '+id+' no nodes array, keys='+Object.keys(j).slice(0,10).join(',')));
          resolve(j);
        }catch(e){reject(new Error('GET '+id+' JSON parse: '+e.message+' body='+d.slice(0,300)))}
      });
    }).on('error', reject).end();
  });
}

function putWf(id, payload) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(payload);
    const req = https.request({
      host: HOST, path: '/api/v1/workflows/' + id, method: 'PUT',
      headers: {
        'X-N8N-API-KEY': API_KEY,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    }, (res) => {
      let d=''; res.on('data',c=>d+=c); res.on('end',()=>resolve({status:res.statusCode, body:d}));
    });
    req.on('error', reject);
    req.write(body); req.end();
  });
}

async function updatePiura() {
  const w = await fetchWf('3YLFYl7ZaYTQDuYa');
  fs.writeFileSync('c:/Proyectos/n8n/piura_pre_laptop.json', JSON.stringify(w, null, 2));

  const html = w.nodes.find(n=>n.type==='n8n-nodes-base.html');
  const oldLi = `                <li><strong>Disponibilidad Presencial:</strong> Residencia en Piura y disponibilidad para trabajar 100% presencial en nuestras oficinas de la Franquicia Piura. Disponibilidad inmediata.</li>\n            </ul>`;
  const newLi = `                <li><strong>Disponibilidad Presencial:</strong> Residencia en Piura y disponibilidad para trabajar 100% presencial en nuestras oficinas de la Franquicia Piura. Disponibilidad inmediata.</li>\n                <li><strong>Laptop propia (Indispensable):</strong> Contar con laptop personal en buen estado para uso laboral diario.</li>\n            </ul>`;
  if (!html.parameters.html.includes(oldLi)) throw new Error('Piura: bloque HTML viejo no encontrado');
  html.parameters.html = html.parameters.html.replace(oldLi, newLi);

  const ai = w.nodes.find(n=>n.type==='@n8n/n8n-nodes-langchain.chainLlm');
  // insertar línea en sección Requisitos Esenciales, después de "Incorporación: Disponibilidad inmediata."
  const oldAi = 'Incorporación: Disponibilidad inmediata.';
  const newAi = 'Incorporación: Disponibilidad inmediata.' + aiLaptopBlock;
  if (!ai.parameters.text.includes(oldAi)) throw new Error('Piura: anchor AI prompt no encontrado');
  ai.parameters.text = ai.parameters.text.replace(oldAi, newAi);

  w.nodes.forEach(n => { delete n.cid; delete n.creator; });
  const payload = { name: w.name, nodes: w.nodes, connections: w.connections, settings: {executionOrder: w.settings?.executionOrder || 'v1'} };
  const r = await putWf('3YLFYl7ZaYTQDuYa', payload);
  console.log('Piura PUT:', r.status, r.status===200?'OK':r.body.slice(0,500));
}

async function updateTrade() {
  const w = await fetchWf('nkZyzT9z9KhTee61');
  fs.writeFileSync('c:/Proyectos/n8n/trade_pre_laptop.json', JSON.stringify(w, null, 2));

  const html = w.nodes.find(n=>n.type==='n8n-nodes-base.html');
  // insertar un bloque destacado de Requisitos Indispensables ANTES de "Experiencia ideal en:"
  const anchor = `            <h3>¿Qué buscamos en ti?</h3>\n            <p style="font-size: 1.1em; color: #333; margin-bottom: 10px;"><strong>Experiencia ideal en:</strong></p>`;
  const replacement = `            <h3>¿Qué buscamos en ti?</h3>\n            <p style="font-size: 1.1em; color: #2e7d32; margin-bottom: 10px;"><strong>Requisitos indispensables:</strong></p>\n            <ul>\n                <li><strong>Laptop propia:</strong> Contar con laptop personal en buen estado para uso laboral diario.</li>\n            </ul>\n            <p style="font-size: 1.1em; color: #333; margin-top: 20px; margin-bottom: 10px;"><strong>Experiencia ideal en:</strong></p>`;
  if (!html.parameters.html.includes(anchor)) throw new Error('Trade: anchor HTML no encontrado');
  html.parameters.html = html.parameters.html.replace(anchor, replacement);

  const ai = w.nodes.find(n=>n.type==='@n8n/n8n-nodes-langchain.chainLlm');
  if (ai && ai.parameters.text) {
    // intenta inyectar después de la lista de Requisitos Esenciales si existe, sino al final de <job_requirements>
    if (ai.parameters.text.includes('Requisitos Esenciales')) {
      // insertar al final de la sección de requisitos esenciales
      const parts = ai.parameters.text.split('Cualificaciones Preferidas');
      if (parts.length === 2) {
        ai.parameters.text = parts[0].trimEnd() + aiLaptopBlock + '\n\nCualificaciones Preferidas' + parts[1];
      } else {
        ai.parameters.text = ai.parameters.text.replace('</job_requirements>', aiLaptopBlock + '\n\n</job_requirements>');
      }
    } else {
      ai.parameters.text = ai.parameters.text.replace('</job_requirements>', aiLaptopBlock + '\n\n</job_requirements>');
    }
  }

  w.nodes.forEach(n => { delete n.cid; delete n.creator; });
  const payload = { name: w.name, nodes: w.nodes, connections: w.connections, settings: {executionOrder: w.settings?.executionOrder || 'v1'} };
  const r = await putWf('nkZyzT9z9KhTee61', payload);
  console.log('Trade PUT:', r.status, r.status===200?'OK':r.body.slice(0,500));
}

(async () => {
  try {
    await updatePiura();
    await updateTrade();
    console.log('\nDone.');
  } catch (e) {
    console.error('FAIL:', e.message);
    process.exit(1);
  }
})();
