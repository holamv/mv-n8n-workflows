// FIX: el audit asume que todos los workflows guardan success, pero solo ATC y PCL lo hacen.
// Los demás (Seg14, CPP, Bridge, Cashback, etc.) tienen saveDataSuccessExecution=false para no saturar DB.
// El audit debe:
// 1. Solo contar PCL en métricas de cobertura n8n (Seg14/CPP no aportan números porque no guardan success)
// 2. Mostrar nota en HTML explicando que algunos workflows no se ven aquí por diseño
const https = require('https');
const fs = require('fs');

const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIzOGNhZmI2ZS1jMTA1LTQ2MjAtODMxYi03NzIxZjg3OGRiNjMiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiZDAzM2I4ZmQtNDU4ZS00ZGQyLTk4MmMtOGFjNjk1NDQxMWNlIiwiaWF0IjoxNzc0Mzg0NTUyfQ.Ln4wx1sGHAR6cBrg8DZYVzQTGBglm3MLUPRBJZtLyyU';
const WF_ID = 'jWvc4pnMKMJJmypm';

function api(method, p, body) {
  return new Promise((res, rej) => {
    const data = body ? JSON.stringify(body) : null;
    const req = https.request({ hostname:'n8n.manzanaverde.la', path:p, method,
      headers: { 'X-N8N-API-KEY': API_KEY, 'Accept':'application/json', 'Content-Type':'application/json',
        ...(data?{'Content-Length':Buffer.byteLength(data)}:{}) }, timeout: 30000 },
    r => { let buf=''; r.on('data',c=>buf+=c); r.on('end',()=>{ try{res({status:r.statusCode,body:JSON.parse(buf)});}catch(e){res({status:r.statusCode,body:buf});} }); });
    req.on('error', rej); req.on('timeout',()=>{ req.destroy(); rej(new Error('to')); });
    if (data) req.write(data); req.end();
  });
}
async function getWithRetry(p) {
  for (let i = 0; i < 6; i++) {
    try { const r = await api('GET', p); if (r.status === 200 && r.body && r.body.nodes) return r.body; } catch (e) {}
    await new Promise(r => setTimeout(r, 3000*(i+1)));
  }
  return null;
}

(async () => {
  const wf = await getWithRetry('/api/v1/workflows/' + WF_ID);
  if (!wf) { console.log('FAILED'); return; }
  fs.writeFileSync('audit_backup_pre_savesuccess.json', JSON.stringify(wf, null, 2));
  console.log('backup -> audit_backup_pre_savesuccess.json');

  const code = wf.nodes.find(n => n.name === 'Audit + Build Email');
  let js = code.parameters.jsCode;

  // CHANGE 1: agregar lista de workflows que SÍ guardan success
  const oldDef = `const WORKFLOWS = {
  'Primer Contacto Leads':  '9MxNM5byLghh9ky2',
  'Seguimiento 14 dias':    'FS68xVacNF1DN9cd',
  'Contacto Primer Pedido': 's37SLqGFljbf08Js',
};`;
  const newDef = `const WORKFLOWS = {
  'Primer Contacto Leads':  '9MxNM5byLghh9ky2',
  'Seguimiento 14 dias':    'FS68xVacNF1DN9cd',
  'Contacto Primer Pedido': 's37SLqGFljbf08Js',
};
// FIX 2026-05-12: solo estos workflows guardan execs success en DB (los demás tienen
// saveDataSuccessExecution=false para no saturar). Las métricas de cobertura solo son
// confiables para estos; los otros workflows pueden estar ejecutando pero invisibles en API.
const WORKFLOWS_SAVE_SUCCESS = new Set(['9MxNM5byLghh9ky2']); // solo PCL aquí (ATC no está en WORKFLOWS)`;
  if (!js.includes(oldDef)) { console.log('CHANGE 1 anchor not found'); return; }
  js = js.replace(oldDef, newDef);
  console.log('CHANGE 1: WORKFLOWS_SAVE_SUCCESS added');

  // CHANGE 2: actualizar leyenda HTML para explicar
  const oldLegend = `'&bull; Total ejecuciones n8n: ' + totalExecsAll + '. De ellas, ' + totalDiscordRoute + ' vinieron de Discord-hoy.' +`;
  const newLegend = `'&bull; Total ejecuciones n8n: ' + totalExecsAll + '. De ellas, ' + totalDiscordRoute + ' vinieron de Discord-hoy.<br>' +
  '&bull; <b>NOTA:</b> Solo <i>Agente ATC</i> y <i>Primer Contacto Leads</i> guardan ejecuciones success. Los dem&aacute;s workflows (Seg14, CPP, Bridge, Cashback, Discord Notifier, etc.) tienen <code>saveDataSuccessExecution=false</code> para no saturar la DB &mdash; se ejecutan pero solo se registran sus errores. Por eso este audit s&oacute;lo mide cobertura sobre PCL.' +`;
  if (!js.includes(oldLegend)) { console.log('CHANGE 2 anchor not found'); return; }
  js = js.replace(oldLegend, newLegend);
  console.log('CHANGE 2: legend nota agregada');

  // CHANGE 3: en wfBreakdown, marcar workflows que no guardan success
  const oldBreakdown = `const wfBreakdown = {};`;
  const newBreakdown = `// FIX 2026-05-12: marcar workflows que no guardan success (para que el lector entienda los 0)
const wfBreakdown = {};
// los workflows en WORKFLOWS que no están en WORKFLOWS_SAVE_SUCCESS no muestran datos reales`;
  if (js.includes(oldBreakdown) && !js.includes('FIX 2026-05-12: marcar')) {
    js = js.replace(oldBreakdown, newBreakdown);
    console.log('CHANGE 3: comment agregado');
  }

  code.parameters.jsCode = js;
  console.log('New code length:', js.length);

  const r = await api('PUT', '/api/v1/workflows/' + WF_ID, {
    name: wf.name, nodes: wf.nodes, connections: wf.connections,
    settings: { executionOrder: wf.settings?.executionOrder || 'v1' }
  });
  console.log('PUT status=' + r.status);
})();
