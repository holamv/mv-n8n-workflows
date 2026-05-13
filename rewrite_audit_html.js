// Simplificar HTML del audit: eliminar las cosas en 0 que no aportan, dejar solo lo accionable.
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
  fs.writeFileSync('audit_backup_pre_simplify.json', JSON.stringify(wf, null, 2));
  console.log('backup -> audit_backup_pre_simplify.json');

  const code = wf.nodes.find(n => n.name === 'Audit + Build Email');
  let js = code.parameters.jsCode;

  // Reemplazar el bloque HTML del reporte por uno simplificado
  // Mantener: Discord total, En PCL, WhatsApp OK, En cola, Silent fail, Escalados, Cobertura
  // Eliminar: "Total exec n8n", "Notifier runs: 0", wfBreakdown chart, nota workflows-no-guardan

  const oldHtml = `const html = '<div style="font-family:sans-serif;max-width:760px">' +
  '<h2 style="margin-bottom:4px">Audit ATC &mdash; Resumen 12h</h2>' +
  '<p style="color:#666;margin-top:0">' + startStr + ' &rarr; ' + endStr + ' (Lima)</p>' +
  '<table style="border-collapse:collapse;width:100%;margin-bottom:8px"><tr>' +
  '<td style="padding:10px;background:#3498db;color:#fff;text-align:center;width:20%"><b style="font-size:20px">' + allDiscordPhones.size + '</b><br><small>Discord (unicos)</small></td>' +
  '<td style="padding:10px;background:#2ecc71;color:#fff;text-align:center;width:20%"><b style="font-size:20px">' + matched.length + '</b><br><small>En n8n</small></td>' +
  '<td style="padding:10px;background:#27ae60;color:#fff;text-align:center;width:18%"><b style="font-size:20px">' + pmTotalSent + '</b><br><small>WhatsApp OK</small></td>' +
  '<td style="padding:10px;background:#3498db;color:#fff;text-align:center;width:18%"><b style="font-size:20px">' + pmTotalInWait + '</b><br><small>En cola (Wait)</small></td>' +
  '<td style="padding:10px;background:#e74c3c;color:#fff;text-align:center;width:18%"><b style="font-size:20px">' + pmTotalFailed + '</b><br><small>Silent fail</small></td>' +
  '<td style="padding:10px;background:#e67e22;color:#fff;text-align:center;width:18%"><b style="font-size:20px">' + notifierStats.posted + '</b><br><small>Escalados</small></td>' +
  '</tr></table>' +
  '<table style="border-collapse:collapse;width:100%;margin-bottom:8px"><tr>' +
  '<td style="padding:8px;background:#34495e;color:#fff;text-align:center"><b style="font-size:16px">' + cobertura + '%</b><br><small>Cobertura Discord&rarr;n8n</small></td>' +
  '<td style="padding:8px;background:#16a085;color:#fff;text-align:center"><b style="font-size:16px">' + pmRate + '%</b><br><small>Tasa envio WhatsApp</small></td>' +
  '<td style="padding:8px;background:#7f8c8d;color:#fff;text-align:center"><b style="font-size:16px">' + notifierStats.runs + '</b><br><small>Notifier runs</small></td>' +
  '<td style="padding:8px;background:#7f8c8d;color:#fff;text-align:center"><b style="font-size:16px">' + missing.length + '</b><br><small>Faltan en n8n</small></td>' +
  '</tr></table>' +
  satHtml +
  alertaHtml +
  waAlertHtml +
  '<img src="' + QC(chartGap) + '" style="display:block;margin:16px 0;width:100%">' +
  '<img src="' + QC(chartWA) + '" style="display:block;margin:16px 0;width:100%">' +
  '<img src="' + QC(chartCobertura) + '" style="display:block;margin:16px 0;width:100%">' +
  '<img src="' + QC(chartGapPct) + '" style="display:block;margin:16px 0;width:100%">' +
  '<img src="' + QC(chartWf) + '" style="display:block;margin:16px 0;width:100%">' +
  '<div style="background:#f4f6f7;padding:10px 14px;margin-top:14px;border-radius:4px;font-size:12px;color:#555">' +
  '<b>Como leer estos numeros:</b><br>' +
  '&bull; <b>Discord (unicos)</b> = telefonos distintos notificados por bots en los 8 canales en las ultimas 12h.<br>' +
  '&bull; <b>WhatsApp OK</b> = ejecuciones n8n donde Primer Mensaje* devolvio status=success (mensaje realmente enviado).<br>' +
  '&bull; <b>En cola (Wait 10min)</b> = ejecuciones que llegaron a n8n y est&aacute;n esperando el Wait de 10 min antes de Primer Mensaje. NO son p&eacute;rdida.<br>' +
  '&bull; <b>Silent failure</b> = ejecuciones donde Primer Mensaje fallo (subscriber sin phone en ManyChat). NO se envio WhatsApp.<br>' +
  '&bull; <b>Escalados a Discord</b> = silent failures notificados al canal origen para gestion humana via Discord Error Notifier.<br>' +
  '&bull; <b>Tasa envio WhatsApp</b> = OK / (OK + silent failure). 100% = todos los leads que llegaron a Primer Mensaje recibieron mensaje.<br>' +
  '&bull; Total ejecuciones n8n: ' + totalExecsAll + '. De ellas, ' + totalDiscordRoute + ' vinieron de Discord-hoy.<br>' +
  '&bull; <b>NOTA:</b> Solo <i>Agente ATC</i> y <i>Primer Contacto Leads</i> guardan ejecuciones success. Los dem&aacute;s workflows (Seg14, CPP, Bridge, Cashback, Discord Notifier, etc.) tienen <code>saveDataSuccessExecution=false</code> para no saturar la DB &mdash; se ejecutan pero solo se registran sus errores. Por eso este audit s&oacute;lo mide cobertura sobre PCL.' +
  '</div>' +
  '<p style="color:#999;font-size:11px;margin-top:14px">Generado automaticamente cada 12h. n8n workflow audit-12h-resumen.</p>' +
  '</div>';`;

  const newHtml = `// Métricas accionables: leads, cobertura, envíos OK, fallos, escalados
const html = '<div style="font-family:sans-serif;max-width:760px">' +
  '<h2 style="margin-bottom:4px">Audit ATC &mdash; Resumen 12h</h2>' +
  '<p style="color:#666;margin-top:0">' + startStr + ' &rarr; ' + endStr + ' (Lima)</p>' +
  // Fila principal: flujo Discord → PCL → WhatsApp
  '<table style="border-collapse:collapse;width:100%;margin-bottom:8px"><tr>' +
  '<td style="padding:12px;background:#3498db;color:#fff;text-align:center;width:25%"><b style="font-size:24px">' + allDiscordPhones.size + '</b><br><small>Leads en Discord</small></td>' +
  '<td style="padding:12px;background:#2ecc71;color:#fff;text-align:center;width:25%"><b style="font-size:24px">' + matched.length + '</b><br><small>Procesados en PCL</small></td>' +
  '<td style="padding:12px;background:#e74c3c;color:#fff;text-align:center;width:25%"><b style="font-size:24px">' + missing.length + '</b><br><small>Faltan procesar</small></td>' +
  '<td style="padding:12px;background:#34495e;color:#fff;text-align:center;width:25%"><b style="font-size:24px">' + cobertura + '%</b><br><small>Cobertura</small></td>' +
  '</tr></table>' +
  // Fila WhatsApp: enviado / en cola / fallido / escalado
  '<table style="border-collapse:collapse;width:100%;margin-bottom:8px"><tr>' +
  '<td style="padding:10px;background:#27ae60;color:#fff;text-align:center;width:25%"><b style="font-size:20px">' + pmTotalSent + '</b><br><small>WhatsApp enviado</small></td>' +
  '<td style="padding:10px;background:#5dade2;color:#fff;text-align:center;width:25%"><b style="font-size:20px">' + pmTotalInWait + '</b><br><small>En cola (Wait 10m)</small></td>' +
  '<td style="padding:10px;background:#e74c3c;color:#fff;text-align:center;width:25%"><b style="font-size:20px">' + pmTotalFailed + '</b><br><small>Fallido (silent)</small></td>' +
  '<td style="padding:10px;background:#e67e22;color:#fff;text-align:center;width:25%"><b style="font-size:20px">' + notifierStats.posted + '</b><br><small>Escalados a humano</small></td>' +
  '</tr></table>' +
  satHtml +
  alertaHtml +
  waAlertHtml +
  // Gráficos: solo los 3 más útiles
  '<img src="' + QC(chartGap) + '" style="display:block;margin:16px 0;width:100%">' +
  '<img src="' + QC(chartWA) + '" style="display:block;margin:16px 0;width:100%">' +
  '<img src="' + QC(chartGapPct) + '" style="display:block;margin:16px 0;width:100%">' +
  '<div style="background:#f4f6f7;padding:10px 14px;margin-top:14px;border-radius:4px;font-size:12px;color:#555">' +
  '<b>C&oacute;mo leer:</b><br>' +
  '&bull; <b>Leads Discord</b> → tel&eacute;fonos &uacute;nicos notificados en los 8 canales en 12h.<br>' +
  '&bull; <b>Procesados en PCL</b> → de esos, cu&aacute;ntos llegaron a Primer Contacto Leads.<br>' +
  '&bull; <b>Faltan procesar</b> → en Discord pero NO en PCL. Indicador clave de p&eacute;rdida.<br>' +
  '&bull; <b>WhatsApp enviado</b> → mensajes de bienvenida que SI llegaron al cliente.<br>' +
  '&bull; <b>En cola</b> → esperando el Wait de 10 min antes del envio. NO es p&eacute;rdida.<br>' +
  '&bull; <b>Fallido (silent)</b> → subscriber sin phone v&aacute;lido en ManyChat.<br>' +
  '&bull; <b>Escalados a humano</b> → silent failures notificados al canal Discord para gesti&oacute;n manual.' +
  '</div>' +
  '<p style="color:#999;font-size:11px;margin-top:14px">Generado automaticamente cada 12h.</p>' +
  '</div>';`;

  if (!js.includes(oldHtml.slice(0, 200))) {
    console.log('Anchor not exact, length match check...');
    // Try fuzzy find: start with "const html = '<div"
    const idx = js.indexOf("const html = '<div");
    if (idx < 0) { console.log('NOT found at all'); return; }
    // Find end (next const after)
    const endIdx = js.indexOf("const subject =", idx);
    if (endIdx < 0) { console.log('end anchor not found'); return; }
    js = js.slice(0, idx) + newHtml + '\n\n' + js.slice(endIdx);
    console.log('Replaced via fuzzy match');
  } else {
    js = js.replace(oldHtml, newHtml);
    console.log('Replaced via exact match');
  }

  // También simplificar el return final: quitar totalExecsAll y agregar campos accionables
  const oldReturn = `return [{ json: { subject, html, totalDiscord: allDiscordPhones.size, totalN8n: allN8nPhones.size, matched: matched.length, missing: missing.length, cobertura, pmTotalSent, pmTotalFailed, pmTotalNoPm, escalated: notifierStats.posted, totalExecsAll } }];`;
  const newReturn = `return [{ json: { subject, html, leadsDiscord: allDiscordPhones.size, procesadosPCL: matched.length, faltanProcesar: missing.length, cobertura, whatsappOK: pmTotalSent, enCola: pmTotalInWait, fallidos: pmTotalFailed, escalados: notifierStats.posted } }];`;
  if (js.includes(oldReturn)) {
    js = js.replace(oldReturn, newReturn);
    console.log('Return simplified');
  }

  // Simplificar subject del email
  const oldSubject = `const subject = 'Audit ATC ' + endStr.slice(0,10) + ' &mdash; ' + cobertura + '% cobertura, ' + pmTotalFailed + ' silent fails, ' + notifierStats.posted + ' escalados';`;
  const newSubject = `const subject = 'Audit ATC ' + endStr.slice(0,10) + ' \\u2014 ' + cobertura + '% cobertura | ' + missing.length + ' faltan | ' + pmTotalFailed + ' fallidos | ' + notifierStats.posted + ' escalados';`;
  if (js.includes(oldSubject)) {
    js = js.replace(oldSubject, newSubject);
    console.log('Subject simplified');
  }

  code.parameters.jsCode = js;
  console.log('New code length:', js.length);

  const r = await api('PUT', '/api/v1/workflows/' + WF_ID, {
    name: wf.name, nodes: wf.nodes, connections: wf.connections,
    settings: { executionOrder: wf.settings?.executionOrder || 'v1' }
  });
  console.log('PUT status=' + r.status);
})();
