// FIX: el audit cuenta execs en 'waiting' como 'no_pm'. Las que están en Wait sí llegaron a n8n.
// Agregar categoría 'in_wait' y mostrarla en el reporte.
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
    try {
      const r = await api('GET', p);
      if (r.status === 200 && r.body && r.body.nodes) return r.body;
    } catch (e) {}
    await new Promise(r => setTimeout(r, 3000*(i+1)));
  }
  return null;
}

(async () => {
  const wf = await getWithRetry('/api/v1/workflows/' + WF_ID);
  if (!wf) { console.log('FAILED fetch'); return; }
  fs.writeFileSync('audit_backup_pre_inwait.json', JSON.stringify(wf, null, 2));
  console.log('backup -> audit_backup_pre_inwait.json');

  const code = wf.nodes.find(n => n.name === 'Audit + Build Email');
  let js = code.parameters.jsCode;

  // CHANGE 1: initialize pmStats with in_wait
  const oldInit = `const pmStats = { sent: 0, silent_failure: 0, no_pm: 0 };`;
  const newInit = `const pmStats = { sent: 0, silent_failure: 0, no_pm: 0, in_wait: 0 };`;
  if (!js.includes(oldInit)) { console.log('CHANGE 1 anchor not found'); return; }
  js = js.replace(oldInit, newInit);
  console.log('CHANGE 1: pmStats init updated');

  // CHANGE 2: detect in_wait status BEFORE pmStats[pmStatus]++ increment
  const oldBlock = `        pmStats[pmStatus]++;
        if (pmStatus === 'silent_failure') {
          failureSamples.push({ exec_id: e.id, fail_node: pmFailNode, phone: phoneKey, channel: triggerChannel });
        }`;
  const newBlock = `        // FIX (2026-05-11): execs en 'waiting' (Wait 10min antes de Primer Mensaje) NO son pérdida.
        // Si exec sigue en waiting, reclasificar como 'in_wait' (en cola legítima).
        if (pmStatus === 'no_pm' && e.status === 'waiting') {
          pmStatus = 'in_wait';
        }
        pmStats[pmStatus]++;
        if (pmStatus === 'silent_failure') {
          failureSamples.push({ exec_id: e.id, fail_node: pmFailNode, phone: phoneKey, channel: triggerChannel });
        }`;
  if (!js.includes(oldBlock)) { console.log('CHANGE 2 anchor not found'); return; }
  js = js.replace(oldBlock, newBlock);
  console.log('CHANGE 2: in_wait classification added');

  // CHANGE 3: compute pmTotalInWait at aggregation
  const oldAgg = `const pmTotalSent = Object.values(n8nRes).reduce((s, r) => s + (r.pmStats?.sent || 0), 0);
const pmTotalFailed = Object.values(n8nRes).reduce((s, r) => s + (r.pmStats?.silent_failure || 0), 0);
const pmTotalNoPm = Object.values(n8nRes).reduce((s, r) => s + (r.pmStats?.no_pm || 0), 0);`;
  const newAgg = `const pmTotalSent = Object.values(n8nRes).reduce((s, r) => s + (r.pmStats?.sent || 0), 0);
const pmTotalFailed = Object.values(n8nRes).reduce((s, r) => s + (r.pmStats?.silent_failure || 0), 0);
const pmTotalNoPm = Object.values(n8nRes).reduce((s, r) => s + (r.pmStats?.no_pm || 0), 0);
const pmTotalInWait = Object.values(n8nRes).reduce((s, r) => s + (r.pmStats?.in_wait || 0), 0);`;
  if (!js.includes(oldAgg)) { console.log('CHANGE 3 anchor not found'); return; }
  js = js.replace(oldAgg, newAgg);
  console.log('CHANGE 3: pmTotalInWait aggregated');

  // CHANGE 4: update chart labels (add in_wait)
  const oldChart = `    labels: ['WhatsApp enviado', 'Silent failure (escalado a Discord)', 'No llego a Primer Mensaje'],
    datasets: [{
      data: [pmTotalSent, pmTotalFailed, pmTotalNoPm],
      backgroundColor: ['#27ae60', '#e74c3c', '#95a5a6'],`;
  const newChart = `    labels: ['WhatsApp enviado', 'En cola (Wait 10min)', 'Silent failure (escalado a Discord)', 'No llego a Primer Mensaje'],
    datasets: [{
      data: [pmTotalSent, pmTotalInWait, pmTotalFailed, pmTotalNoPm],
      backgroundColor: ['#27ae60', '#3498db', '#e74c3c', '#95a5a6'],`;
  if (!js.includes(oldChart)) { console.log('CHANGE 4 anchor not found'); return; }
  js = js.replace(oldChart, newChart);
  console.log('CHANGE 4: chart labels updated');

  // CHANGE 5: update HTML table to show in_wait + recalculate "En n8n" to include in_wait
  // The current "En n8n" = matched.length which counts unique phones matched. Keep it.
  // Add a new cell for "En cola" (in_wait count)
  const oldTable = `'<td style="padding:10px;background:#27ae60;color:#fff;text-align:center;width:20%"><b style="font-size:20px">' + pmTotalSent + '</b><br><small>WhatsApp OK</small></td>' +
  '<td style="padding:10px;background:#e74c3c;color:#fff;text-align:center;width:20%"><b style="font-size:20px">' + pmTotalFailed + '</b><br><small>Silent fail</small></td>' +
  '<td style="padding:10px;background:#e67e22;color:#fff;text-align:center;width:20%"><b style="font-size:20px">' + notifierStats.posted + '</b><br><small>Escalados</small></td>'`;
  const newTable = `'<td style="padding:10px;background:#27ae60;color:#fff;text-align:center;width:18%"><b style="font-size:20px">' + pmTotalSent + '</b><br><small>WhatsApp OK</small></td>' +
  '<td style="padding:10px;background:#3498db;color:#fff;text-align:center;width:18%"><b style="font-size:20px">' + pmTotalInWait + '</b><br><small>En cola (Wait)</small></td>' +
  '<td style="padding:10px;background:#e74c3c;color:#fff;text-align:center;width:18%"><b style="font-size:20px">' + pmTotalFailed + '</b><br><small>Silent fail</small></td>' +
  '<td style="padding:10px;background:#e67e22;color:#fff;text-align:center;width:18%"><b style="font-size:20px">' + notifierStats.posted + '</b><br><small>Escalados</small></td>'`;
  if (!js.includes(oldTable)) { console.log('CHANGE 5 anchor not found'); return; }
  js = js.replace(oldTable, newTable);
  console.log('CHANGE 5: HTML summary table updated');

  // CHANGE 6: update legend
  const oldLegend = `'&bull; <b>WhatsApp OK</b> = ejecuciones n8n donde Primer Mensaje* devolvio status=success (mensaje realmente enviado).<br>' +
  '&bull; <b>Silent failure</b> = ejecuciones donde Primer Mensaje fallo (subscriber sin phone en ManyChat). NO se envio WhatsApp.<br>'`;
  const newLegend = `'&bull; <b>WhatsApp OK</b> = ejecuciones n8n donde Primer Mensaje* devolvio status=success (mensaje realmente enviado).<br>' +
  '&bull; <b>En cola (Wait 10min)</b> = ejecuciones que llegaron a n8n y est&aacute;n esperando el Wait de 10 min antes de Primer Mensaje. NO son p&eacute;rdida.<br>' +
  '&bull; <b>Silent failure</b> = ejecuciones donde Primer Mensaje fallo (subscriber sin phone en ManyChat). NO se envio WhatsApp.<br>'`;
  if (!js.includes(oldLegend)) { console.log('CHANGE 6 anchor not found'); return; }
  js = js.replace(oldLegend, newLegend);
  console.log('CHANGE 6: legend updated');

  code.parameters.jsCode = js;
  console.log('New code length:', js.length);

  const r = await api('PUT', '/api/v1/workflows/' + WF_ID, {
    name: wf.name, nodes: wf.nodes, connections: wf.connections,
    settings:{ executionOrder: wf.settings?.executionOrder || 'v1' }
  });
  console.log('PUT status=' + r.status);
})();
