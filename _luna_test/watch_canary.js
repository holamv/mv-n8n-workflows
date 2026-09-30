// Vigila el canario ATC durante N horas. Uso: node _luna_test/watch_canary.js "<deployISO>" <horas>
// Cada 10 min consulta ejecuciones nuevas y appendea a _luna_test/canary_log.txt
const fs = require('fs'), path = require('path'), https = require('https');
const KEY = fs.readFileSync('C:/Users/cheve/.claude/projects/c--Proyectos-n8n/memory/reference_n8n_api.md', 'utf8')
  .match(/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9[A-Za-z0-9._-]+/)[0];
const DEPLOY = new Date(process.argv[2]);
const HOURS = parseFloat(process.argv[3] || '3');
const LOG = path.join(__dirname, 'canary_log.txt');
const EVERY = 10 * 60e3;
const END = Date.now() + HOURS * 3600e3;

const g = p => new Promise(r => { https.get({ hostname: 'n8n.manzanaverde.la', path: p, headers: { 'X-N8N-API-KEY': KEY }, timeout: 120000 },
  s => { let b = ''; s.on('data', c => b += c); s.on('end', () => { try { r(JSON.parse(b)); } catch { r(null); } }); }).on('error', () => r(null)); });
const say = m => { console.log(m); fs.appendFileSync(LOG, m + '\n'); };

const seen = new Set();
const acc = { ATC: [], Ventas: [], Reconsumos: [] };
const tokAcc = {};
let errors = [], sends = {}, checked = 0;

async function tick() {
  let metas = [];
  for (const st of ['success', 'error']) {
    const l = await g(`/api/v1/executions?workflowId=R81I6h5KWtyNaDAy&limit=100&status=${st}`);
    if (l?.data) metas.push(...l.data.map(e => ({ id: e.id, status: e.status, startedAt: e.startedAt })));
  }
  const fresh = metas.filter(m => new Date(m.startedAt) > DEPLOY && !seen.has(m.id));
  fresh.forEach(m => seen.add(m.id));
  for (let i = 0; i < fresh.length; i += 6) {
    const batch = await Promise.all(fresh.slice(i, i + 6).map(m => g(`/api/v1/executions/${m.id}?includeData=true`)));
    for (const e of batch) {
      if (!e) continue; checked++;
      const rd = e.data?.resultData?.runData || {};
      if (e.data?.resultData?.error) errors.push(`exec ${e.id}: ${String(e.data.resultData.error.message || '').slice(0, 160)}`);
      for (const [name, runs] of Object.entries(rd)) {
        const r0 = runs?.[0];
        if (r0?.error) errors.push(`exec ${e.id} [${name}]: ${String(r0.error.message || '').slice(0, 160)}`);
        if (acc[name]) acc[name].push(r0?.executionTime || 0);
        if (/^(Saludo Whatsapp|Envío Imagen)/.test(name)) sends[name] = (sends[name] || 0) + 1;
        const j = r0?.data?.ai_languageModel?.[0]?.[0]?.json;
        const u = j?.tokenUsage || j?.tokenUsageEstimate;
        if (u) { const k = tokAcc[name] = tokAcc[name] || { calls: 0, in: 0, out: 0 }; k.calls++; k.in += u.promptTokens || 0; k.out += u.completionTokens || 0; }
      }
    }
  }
  const p50 = a => { if (!a.length) return '-'; const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };
  say(`[${new Date().toISOString()}] +${fresh.length} nuevas | total ${checked} | ATC ${acc.ATC.length} (p50 ${p50(acc.ATC)}ms) · Ventas ${acc.Ventas.length} · Recons ${acc.Reconsumos.length} | envios ${Object.values(sends).reduce((a, b) => a + b, 0)} | ERRORES ${errors.length}`);
  if (errors.length) { say('   ULTIMOS ERRORES:'); errors.slice(-4).forEach(e => say('     ! ' + e)); }
}

(async () => {
  say(`\n===== watch canary ATC | deploy ${DEPLOY.toISOString()} | ${HOURS}h =====`);
  await tick();
  while (Date.now() < END) {
    await new Promise(r => setTimeout(r, Math.min(EVERY, END - Date.now() + 1000)));
    await tick();
  }
  const m1 = tokAcc['OpenAI Chat Model1'];
  say(`\n===== RESUMEN ${HOURS}h =====`);
  say(`ejecuciones revisadas: ${checked} | ATC: ${acc.ATC.length} | errores: ${errors.length}`);
  if (m1) say(`ATC chat model (Luna): ${m1.calls} llamadas | prompt ${m1.in.toLocaleString()} | completion ${m1.out.toLocaleString()} (visible, sin reasoning)`);
  const m3 = tokAcc['OpenAI Chat Model3'];
  if (m3) say(`Ventas chat model (mini): ${m3.calls} llamadas | prompt ${m3.in.toLocaleString()} | completion ${m3.out.toLocaleString()} (incluye reasoning)`);
  if (errors.length) { say('TODOS LOS ERRORES:'); [...new Set(errors)].slice(0, 20).forEach(e => say('  ! ' + e)); }
  say('===== fin =====');
})();
