// Espera la primera ejecucion REAL de Reconsumos posterior al fix y verifica
// que ahora si pasa por el envio. Uso: node _luna_test/verify_reconsumos.js "<deployISO>" [minutos]
const fs = require('fs'), path = require('path'), https = require('https');
const KEY = fs.readFileSync('C:/Users/cheve/.claude/projects/c--Proyectos-n8n/memory/reference_n8n_api.md', 'utf8')
  .match(/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9[A-Za-z0-9._-]+/)[0];
const DEPLOY = new Date(process.argv[2]);
const MINUTES = parseInt(process.argv[3] || '45', 10);
const LOG = path.join(__dirname, 'reconsumos_verify.txt');
const END = Date.now() + MINUTES * 60e3;
const say = m => { console.log(m); fs.appendFileSync(LOG, m + '\n'); };
const g = p => new Promise(r => { https.get({ hostname: 'n8n.manzanaverde.la', path: p, headers: { 'X-N8N-API-KEY': KEY }, timeout: 120000 },
  s => { let b = ''; s.on('data', c => b += c); s.on('end', () => { try { r(JSON.parse(b)); } catch { r(null); } }); }).on('error', () => r(null)); });

const seen = new Set();
let recons = 0, sent = 0, blocked = 0, errs = 0;

async function tick() {
  const out = [];
  for (const st of ['success', 'error']) {
    const l = await g(`/api/v1/executions?workflowId=R81I6h5KWtyNaDAy&limit=100&status=${st}`);
    if (l?.data) out.push(...l.data.filter(e => new Date(e.startedAt) > DEPLOY && !seen.has(e.id)));
  }
  for (const m of out) seen.add(m.id);
  for (let i = 0; i < out.length; i += 6) {
    const batch = await Promise.all(out.slice(i, i + 6).map(m => g(`/api/v1/executions/${m.id}?includeData=true`)));
    for (const e of batch) {
      if (!e) continue;
      const rd = e.data?.resultData?.runData || {};
      if (!rd['Reconsumos']) continue;
      recons++;
      const guard = rd['If Skip Empty 3'] ? 'corrio' : 'NO corrio';
      const envio = rd['Saludo Whatsapp'] ? 'SI' : 'no';
      const noop = rd['No Op If Skip Empty 3'] ? 'si' : 'no';
      const err = rd['Saludo Whatsapp']?.[0]?.error?.message;
      if (envio === 'SI' && !err) sent++; else if (noop === 'si') blocked++;
      if (err) errs++;
      const txt = String(rd['Reconsumos']?.[0]?.data?.main?.[0]?.[0]?.json?.output || '').slice(0, 160);
      say(`\n[${e.startedAt}] exec ${e.id}`);
      say(`   guard If Skip Empty 3: ${guard} | envio Saludo Whatsapp: ${envio} | bloqueado: ${noop}${err ? ' | ERROR: ' + err : ''}`);
      say(`   texto: ${txt}`);
    }
  }
}

(async () => {
  say(`\n===== verificacion fix Reconsumos | deploy ${DEPLOY.toISOString()} | espera hasta ${MINUTES} min =====`);
  while (Date.now() < END) {
    await tick();
    if (recons >= 3) break;
    await new Promise(r => setTimeout(r, 60e3));
  }
  say(`\n===== RESULTADO =====`);
  say(`ejecuciones de Reconsumos post-fix: ${recons} | enviadas: ${sent} | bloqueadas por guard: ${blocked} | errores de envio: ${errs}`);
  say(recons === 0 ? 'SIN TRAFICO de Reconsumos en la ventana: repetir mas tarde.'
    : sent > 0 ? 'FIX CONFIRMADO: Reconsumos vuelve a responder al cliente.'
      : 'ATENCION: Reconsumos corrio pero NO envio. Revisar.');
})();
