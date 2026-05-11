// Reintentar PUT del audit workflow con backoff (timeout transitorio)
const https = require('https');
const fs = require('fs');

const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIzOGNhZmI2ZS1jMTA1LTQ2MjAtODMxYi03NzIxZjg3OGRiNjMiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiZDAzM2I4ZmQtNDU4ZS00ZGQyLTk4MmMtOGFjNjk1NDQxMWNlIiwiaWF0IjoxNzc0Mzg0NTUyfQ.Ln4wx1sGHAR6cBrg8DZYVzQTGBglm3MLUPRBJZtLyyU';
const WF_ID = 'jWvc4pnMKMJJmypm';

function call(method, p, body, timeoutMs=60000) {
  return new Promise((res) => {
    const data = body ? JSON.stringify(body) : null;
    const req = https.request({ hostname:'n8n.manzanaverde.la', path:p, method,
      headers: { 'X-N8N-API-KEY': API_KEY, 'Accept':'application/json', 'Content-Type':'application/json',
        ...(data?{'Content-Length':Buffer.byteLength(data)}:{}) }, timeout: timeoutMs },
    r => { let buf=''; r.on('data',c=>buf+=c); r.on('end',()=>{ try{res({status:r.statusCode,body:JSON.parse(buf)});}catch(e){res({status:r.statusCode,body:buf});} }); });
    req.on('error', e => res({status:0,body:e.message}));
    req.on('timeout', () => { req.destroy(); res({status:'timeout',body:''}); });
    if (data) req.write(data); req.end();
  });
}
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  // 1. Get current
  let wf = null;
  for (let i = 0; i < 6; i++) {
    const r = await call('GET', '/api/v1/workflows/' + WF_ID);
    if (r.status === 200 && r.body?.nodes) { wf = r.body; break; }
    console.log('GET attempt ' + (i+1) + ' status=' + r.status);
    await sleep(3000*(i+1));
  }
  if (!wf) { console.log('FAILED GET'); return; }

  // Check if fix already applied
  const code = wf.nodes.find(n => n.name === 'Audit + Build Email');
  if (code.parameters.jsCode.includes('pmTotalInWait')) {
    console.log('Fix already applied ✅');
    return;
  }

  // 2. Apply changes from backup that has new code
  const backupOldFile = 'audit_backup_pre_inwait.json';
  if (!fs.existsSync(backupOldFile)) { console.log('No backup found'); return; }

  // Re-apply manually with the same logic
  let js = code.parameters.jsCode;
  js = js.replace(
    `const pmStats = { sent: 0, silent_failure: 0, no_pm: 0 };`,
    `const pmStats = { sent: 0, silent_failure: 0, no_pm: 0, in_wait: 0 };`
  );
  js = js.replace(
    `        pmStats[pmStatus]++;
        if (pmStatus === 'silent_failure') {
          failureSamples.push({ exec_id: e.id, fail_node: pmFailNode, phone: phoneKey, channel: triggerChannel });
        }`,
    `        // FIX (2026-05-11): execs en 'waiting' (Wait 10min antes de Primer Mensaje) NO son pérdida.
        if (pmStatus === 'no_pm' && e.status === 'waiting') {
          pmStatus = 'in_wait';
        }
        pmStats[pmStatus]++;
        if (pmStatus === 'silent_failure') {
          failureSamples.push({ exec_id: e.id, fail_node: pmFailNode, phone: phoneKey, channel: triggerChannel });
        }`
  );
  js = js.replace(
    `const pmTotalNoPm = Object.values(n8nRes).reduce((s, r) => s + (r.pmStats?.no_pm || 0), 0);`,
    `const pmTotalNoPm = Object.values(n8nRes).reduce((s, r) => s + (r.pmStats?.no_pm || 0), 0);
const pmTotalInWait = Object.values(n8nRes).reduce((s, r) => s + (r.pmStats?.in_wait || 0), 0);`
  );
  js = js.replace(
    `    labels: ['WhatsApp enviado', 'Silent failure (escalado a Discord)', 'No llego a Primer Mensaje'],
    datasets: [{
      data: [pmTotalSent, pmTotalFailed, pmTotalNoPm],
      backgroundColor: ['#27ae60', '#e74c3c', '#95a5a6'],`,
    `    labels: ['WhatsApp enviado', 'En cola (Wait 10min)', 'Silent failure (escalado a Discord)', 'No llego a Primer Mensaje'],
    datasets: [{
      data: [pmTotalSent, pmTotalInWait, pmTotalFailed, pmTotalNoPm],
      backgroundColor: ['#27ae60', '#3498db', '#e74c3c', '#95a5a6'],`
  );
  js = js.replace(
    `'<td style="padding:10px;background:#27ae60;color:#fff;text-align:center;width:20%"><b style="font-size:20px">' + pmTotalSent + '</b><br><small>WhatsApp OK</small></td>' +
  '<td style="padding:10px;background:#e74c3c;color:#fff;text-align:center;width:20%"><b style="font-size:20px">' + pmTotalFailed + '</b><br><small>Silent fail</small></td>' +
  '<td style="padding:10px;background:#e67e22;color:#fff;text-align:center;width:20%"><b style="font-size:20px">' + notifierStats.posted + '</b><br><small>Escalados</small></td>'`,
    `'<td style="padding:10px;background:#27ae60;color:#fff;text-align:center;width:18%"><b style="font-size:20px">' + pmTotalSent + '</b><br><small>WhatsApp OK</small></td>' +
  '<td style="padding:10px;background:#3498db;color:#fff;text-align:center;width:18%"><b style="font-size:20px">' + pmTotalInWait + '</b><br><small>En cola (Wait)</small></td>' +
  '<td style="padding:10px;background:#e74c3c;color:#fff;text-align:center;width:18%"><b style="font-size:20px">' + pmTotalFailed + '</b><br><small>Silent fail</small></td>' +
  '<td style="padding:10px;background:#e67e22;color:#fff;text-align:center;width:18%"><b style="font-size:20px">' + notifierStats.posted + '</b><br><small>Escalados</small></td>'`
  );
  js = js.replace(
    `'&bull; <b>WhatsApp OK</b> = ejecuciones n8n donde Primer Mensaje* devolvio status=success (mensaje realmente enviado).<br>' +
  '&bull; <b>Silent failure</b> = ejecuciones donde Primer Mensaje fallo (subscriber sin phone en ManyChat). NO se envio WhatsApp.<br>'`,
    `'&bull; <b>WhatsApp OK</b> = ejecuciones n8n donde Primer Mensaje* devolvio status=success (mensaje realmente enviado).<br>' +
  '&bull; <b>En cola (Wait 10min)</b> = ejecuciones que llegaron a n8n y est&aacute;n esperando el Wait de 10 min antes de Primer Mensaje. NO son p&eacute;rdida.<br>' +
  '&bull; <b>Silent failure</b> = ejecuciones donde Primer Mensaje fallo (subscriber sin phone en ManyChat). NO se envio WhatsApp.<br>'`
  );
  code.parameters.jsCode = js;

  // 3. PUT with retry
  for (let i = 0; i < 6; i++) {
    const r = await call('PUT', '/api/v1/workflows/' + WF_ID, {
      name: wf.name, nodes: wf.nodes, connections: wf.connections,
      settings:{ executionOrder: wf.settings?.executionOrder || 'v1' }
    }, 90000);
    console.log('PUT attempt ' + (i+1) + ' status=' + r.status);
    if (r.status === 200) { console.log('✅ Fix applied'); return; }
    await sleep(5000*(i+1));
  }
  console.log('FAILED after retries');
})();
